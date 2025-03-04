import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Image, Alert, ActivityIndicator 
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes"; 
import { getAuth, signInWithEmailAndPassword } from "@react-native-firebase/auth"; // Use modular auth imports
import { getApp } from "@react-native-firebase/app"; // Import getApp for modular SDK

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Login">>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const authInstance = getAuth(getApp()); // Get modular auth instance with getApp()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(authInstance, email, password); // Use authInstance
      Alert.alert("Success", "Login successful!");
      // Do not manually navigate here—rely on App.tsx's onAuthStateChanged to handle navigation
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require("../assets/intuteLogo.png")} style={styles.logo} />
      </View>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  logo: {
    width: 350,
    height: 200,
    resizeMode: "contain",
    marginLeft: 80,
  },
  title: {
    fontSize: 30,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    color: "black",
  },
  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "#fff",
    marginTop: 15,
    fontSize: 16,
    textDecorationLine: "underline",
  },
});

export default LoginScreen;