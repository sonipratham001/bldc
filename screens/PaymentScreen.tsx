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
  const authInstance = getAuth(getApp());

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
        Toast.show({
                type: "success",
                text1: "Subscription purchased successfully!",
                visibilityTime: 4000, // Duration in milliseconds
                autoHide: true,
                position: "bottom", // Can be 'top', 'bottom', or 'center'
              });
        navigation.goBack();
        await RNIap.finishTransaction({ purchase, isConsumable: false });
      }
    });

    initializeIap();
    return () => {
      purchaseListener.remove();
      RNIap.endConnection();
    };
  }, [navigation]);

  const handleSubscription = async (sku: string) => {
    if (isSubscribed) {
      Alert.alert('Info', 'You are already subscribed!');
      return;
    }

    try {
      setLoading(true);
      await RNIap.requestSubscription({ sku });
    } catch (error: any) {
      Alert.alert('Purchase Failed', error.message || 'Failed to process purchase.');
    } finally {
      setLoading(false);
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
          <Text style={styles.subscribedText}>You are subscribed to Premium!</Text>
        ) : (
          subscriptions.map((plan) => (
            <TouchableOpacity
              key={plan.productId}
              style={[styles.button, styles.subscribeButton]}
              onPress={() => handleSubscription(plan.productId)}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>
                {plan.title} -{' '}
                {plan.subscriptionOfferDetails?.[0]?.pricingPhases.pricingPhaseList[0].formattedPrice}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {!loading && subscriptions.length === 0 && !isSubscribed && (
          <Text style={styles.noDevices}>No subscription plans available</Text>
        )}

        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText1}>Back</Text>
        </TouchableOpacity>
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
    color: '#000', // Changed to black
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
    borderRadius: 8, // Reduced for consistency with other screens
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1, // Added subtle border
    borderColor: '#E0E0E0', // Light gray border
  },
  subscribeButton: {
    backgroundColor: '#4CAF50', // Kept green for action button
    width: '80%',
  },
  backButton: {
    backgroundColor: '#FF4D4D', // Kept red for cancel action
    width: '80%',
  },
  buttonText: {
    color: '#000', // Changed to black for contrast
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'left',
    width: '100%',
  },
  buttonText1: {
    color: '#000', // Changed to black for contrast
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  subscribedText: {
    fontSize: 18,
    color: '#000', // Changed to black
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '500',
  },
  noDevices: {
    color: '#666', // Darker gray for visibility
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
    color: '#000', // Changed to black
    paddingLeft: 0,
    marginLeft: 0,
  },
});

export default PaymentScreen;