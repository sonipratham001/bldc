import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import { getAuth, sendPasswordResetEmail } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import Toast from "react-native-toast-message";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<RootStackParamList, "ForgotPassword">;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const authInstance = getAuth(getApp());

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address to reset your password.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(authInstance, email);
      // Alert.alert("Success", "Password reset email sent! Please check your inbox.");
      Toast.show({
              type: "success",
              text1: "Password reset email sent! Please check your inbox.",
              visibilityTime: 4000, // Duration in milliseconds
              autoHide: true,
              position: "bottom", // Can be 'top', 'bottom', or 'center'
            });
      navigation.goBack(); // Return to LoginScreen after success
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send password reset email.");
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={["#F5F5F5", "#E8ECEF", "#DEE2E6"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address to receive a password reset link.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Email</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    color: "#000",
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    color: "#000",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "#666",
    marginTop: 15,
    fontSize: 16,
    textDecorationLine: "underline",
  },
});

export default ForgotPasswordScreen;