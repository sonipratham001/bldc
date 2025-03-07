import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import HomeScreen from "./screens/HomeScreen";
import DashboardScreen from "./screens/Dashboard";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import Subscription from "./screens/SubscriptionScreen";
import PaymentScreen from "./screens/PaymentScreen";
import { BluetoothProvider } from "./services/BluetoothServices";
import HistoryScreen from './screens/HistoryScreen';
import UserProfile from "./screens/UserProfile";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import Toast from 'react-native-toast-message'; // Corrected import

// Import the User type from FirebaseAuthTypes
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

const Stack = createNativeStackNavigator();

const App = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const authInstance = getAuth(getApp());
    const unsubscribe = onAuthStateChanged(authInstance, (currentUser: FirebaseAuthTypes.User | null) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    // Removed ToastProvider wrapper
    <BluetoothProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Subscription" component={Subscription} />
              <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="UserProfile" component={UserProfile} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {/* Added Toast component at the root level */}
      <Toast />
    </BluetoothProvider>
  );
};

export default App;