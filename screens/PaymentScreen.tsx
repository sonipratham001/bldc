import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import SideMenu from './SideMenu';
import Toast from 'react-native-toast-message';

type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentScreen'>;

const subscriptionSkus = ['bldc_monitor_basic', 'bldc_monitor_premium'];

const PaymentScreen = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const [subscriptions, setSubscriptions] = useState<RNIap.SubscriptionAndroid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [purchasing, setPurchasing] = useState<string | null>(null); // Track which SKU is being purchased
  const authInstance = getAuth(getApp());

  const saveSubscriptionStatus = async () => {
    const user = authInstance.currentUser;
    if (user) {
      const db = getFirestore(getApp());
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { isSubscribed: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
        console.log('Subscription status saved successfully');
      } catch (error) {
        console.error('Error saving subscription status:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to save subscription status. Please try again.',
          visibilityTime: 4000,
          autoHide: true,
          position: 'bottom',
        });
      }
    }
  };

  useEffect(() => {
    const initializeIap = async () => {
      try {
        await RNIap.initConnection();
        const availableSubscriptions = (await RNIap.getSubscriptions({
          skus: subscriptionSkus,
        })) as RNIap.SubscriptionAndroid[];
        setSubscriptions(availableSubscriptions);

        const purchases = await RNIap.getAvailablePurchases();
        const isUserSubscribed = purchases.some((purchase) =>
          subscriptionSkus.includes(purchase.productId)
        );
        setIsSubscribed(isUserSubscribed);
        if (isUserSubscribed) {
          await AsyncStorage.setItem(
            `isSubscribed_${authInstance.currentUser?.uid}`,
            'true'
          );
          await saveSubscriptionStatus(); // Save to Firestore if already subscribed
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load subscriptions.');
      } finally {
        setLoading(false);
      }
    };

    const purchaseListener = RNIap.purchaseUpdatedListener(async (purchase) => {
      if (purchase.transactionReceipt && subscriptionSkus.includes(purchase.productId)) {
        setIsSubscribed(true);
        await AsyncStorage.setItem(
          `isSubscribed_${authInstance.currentUser?.uid}`,
          'true'
        );
        await saveSubscriptionStatus(); // Save to Firestore
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Subscription purchased successfully!',
          visibilityTime: 4000,
          autoHide: true,
          position: 'bottom',
        });
        setPurchasing(null);
        await RNIap.finishTransaction({ purchase, isConsumable: false });
        navigation.navigate('Home'); // Navigate back to Home after successful subscription
      }
    });

    const purchaseErrorListener = RNIap.purchaseErrorListener((error) => {
      setPurchasing(null);
      Alert.alert('Purchase Failed', error.message || 'An error occurred during the purchase.');
    });

    initializeIap();
    return () => {
      purchaseListener.remove();
      purchaseErrorListener.remove();
      RNIap.endConnection();
    };
  }, [navigation]);

  const handleSubscription = async (sku: string) => {
    if (isSubscribed) {
      Alert.alert('Info', 'You are already subscribed!');
      return;
    }

    try {
      setPurchasing(sku); // Set the SKU being purchased
      await RNIap.requestSubscription({ sku });
    } catch (error: any) {
      setPurchasing(null);
      Alert.alert('Purchase Failed', error.message || 'Failed to process purchase.');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <LinearGradient colors={['#F5F5F5', '#E8ECEF', '#DEE2E6']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select a Subscription Plan</Text>
      </View>

      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4CAF50"
            style={{ marginVertical: 15 }}
          />
        ) : isSubscribed ? (
          <View style={styles.subscribedContainer}>
            <Text style={styles.subscribedText}>You are subscribed to Premium!</Text>
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText1}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          subscriptions.map((plan) => (
            <TouchableOpacity
              key={plan.productId}
              style={[styles.button, styles.subscribeButton]}
              onPress={() => handleSubscription(plan.productId)}
              activeOpacity={0.7}
              disabled={purchasing === plan.productId}
            >
              {purchasing === plan.productId ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.planContainer}>
                  <Text style={styles.buttonText}>
                    {plan.title || 'Subscription Plan'}
                  </Text>
                  <Text style={styles.priceText}>
                    {plan.subscriptionOfferDetails?.[0]?.pricingPhases.pricingPhaseList[0].formattedPrice || 'N/A'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        {!loading && subscriptions.length === 0 && !isSubscribed && (
          <Text style={styles.noDevices}>No subscription plans available</Text>
        )}
      </View>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 10,
    paddingLeft: 0,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 20,
    marginRight: 18,
    marginLeft: 28,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '80%',
  },
  subscribeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#FF4D4D',
  },
  planContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonText1: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  subscribedContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  subscribedText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  noDevices: {
    color: '#666',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '500',
  },
  menuButton: {
    padding: 0,
    marginLeft: -7,
    marginBottom: 18,
  },
  menuIcon: {
    fontSize: 30,
    color: '#000',
    paddingLeft: 0,
    marginLeft: 0,
  },
});

export default PaymentScreen;