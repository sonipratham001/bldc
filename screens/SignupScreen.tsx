import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import auth from "@react-native-firebase/auth";
import Icon from "react-native-vector-icons/Ionicons";

const SignupScreen = () => {
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList, "Signup">
  >();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );
      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("Home");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require("../assets/intuteLogo.png")} style={styles.logo} />
      </View>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureTextEntry}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setSecureTextEntry(!secureTextEntry)}
        >
          <Icon name={secureTextEntry ? "eye-off" : "eye"} size={24} color="#aaa" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
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
  },
  passwordContainer: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 10,
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

export default SignupScreen;
