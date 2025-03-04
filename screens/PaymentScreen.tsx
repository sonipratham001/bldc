import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import * as RNIap from "react-native-iap";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";

type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "PaymentScreen">;

const subscriptionSkus = ["bldc_monitor_basic", "bldc_monitor_premium"];

const PaymentScreen = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const [subscriptions, setSubscriptions] = useState<RNIap.SubscriptionAndroid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const authInstance = getAuth(getApp());

  useEffect(() => {
    const initializeIap = async () => {
      try {
        await RNIap.initConnection();
        const availableSubscriptions = await RNIap.getSubscriptions({ skus: subscriptionSkus }) as RNIap.SubscriptionAndroid[];
        setSubscriptions(availableSubscriptions);

        const purchases = await RNIap.getAvailablePurchases();
        const isUserSubscribed = purchases.some((purchase) =>
          subscriptionSkus.includes(purchase.productId)
        );
        setIsSubscribed(isUserSubscribed);
        if (isUserSubscribed) {
          await AsyncStorage.setItem(`isSubscribed_${authInstance.currentUser?.uid}`, "true");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to load subscriptions.");
      } finally {
        setLoading(false);
      }
    };

    const purchaseListener = RNIap.purchaseUpdatedListener(async (purchase) => {
      if (purchase.transactionReceipt && subscriptionSkus.includes(purchase.productId)) {
        setIsSubscribed(true);
        await AsyncStorage.setItem(`isSubscribed_${authInstance.currentUser?.uid}`, "true");
        Alert.alert("Success", "Subscription purchased successfully!");
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
      Alert.alert("Info", "You are already subscribed!");
      return;
    }

    try {
      setLoading(true);
      await RNIap.requestSubscription({ sku });
    } catch (error: any) {
      Alert.alert("Purchase Failed", error.message || "Failed to process purchase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      <Text style={styles.title}>Select a Subscription Plan</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
      ) : isSubscribed ? (
        <Text style={styles.subscribedText}>You are subscribed to Premium!</Text>
      ) : (
        subscriptions.map((plan) => (
          <TouchableOpacity
            key={plan.productId}
            style={[styles.button, styles.subscribeButton]}
            onPress={() => handleSubscription(plan.productId)}
          >
            <Text style={styles.buttonText}>
              {plan.title} - {plan.subscriptionOfferDetails?.[0]?.pricingPhases.pricingPhaseList[0].formattedPrice}
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
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
              <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Home")}>
                <Text style={styles.footerText}>🏠 Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Dashboard")}>
                <Text style={styles.footerText}>📊 Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("History")}>
                <Text style={styles.footerText}>📜 History</Text>
              </TouchableOpacity>
            </View>
    </LinearGradient>
  );
};

// Keep your existing styles unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 30,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  subscribeButton: {
    backgroundColor: "#4CAF50",
    width: 200,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#FF4D4D",
    width: 100,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  subscribedText: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  noDevices: {
    color: "#bbb",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "#1E1E1E",
    zIndex: 2,
  },
  footerButton: {
    padding: 10,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PaymentScreen;