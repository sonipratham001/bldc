import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { RootStackParamList } from "../navigationTypes"; // Adjust the import path as needed

// Define the navigation prop type for Subscription screen (matching HomeScreen's style)
type SubscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Subscription">;

const Subscription = () => {
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();

  const handleSubscribe = () => {
    navigation.navigate("PaymentScreen");
  };

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      <Text style={styles.title}>Subscribe Now</Text>
      <Text style={styles.description}>
        Get unlimited access to premium content and exclusive benefits.
      </Text>

      <TouchableOpacity style={[styles.button, styles.subscribeButton]} onPress={handleSubscribe}>
        <Text style={styles.buttonText}>Subscribe Now</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

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
  description: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  subscribeButton: {
    textAlign: "center",
    backgroundColor: "#4CAF50", // Match HomeScreen subscribe button color
    width: 175, // Match HomeScreen subscribe button width
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Subscription;