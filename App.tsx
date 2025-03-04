import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth"; // Use modular auth
import { getApp } from "@react-native-firebase/app"; // Import getApp for modular SDK
import HomeScreen from "./screens/HomeScreen";
import DashboardScreen from "./screens/Dashboard";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import Subscription from "./screens/SubscriptionScreen";
import PaymentScreen from "./screens/PaymentScreen";
import { BluetoothProvider } from "./services/BluetoothServices";
import HistoryScreen from './screens/HistoryScreen';

// Import the User type from FirebaseAuthTypes (part of @react-native-firebase/auth types)
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

const Stack = createNativeStackNavigator();

const App = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);// Use correct Firebase User type

  useEffect(() => {
    const authInstance = getAuth(getApp()); // Get modular auth instance with getApp()
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
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </BluetoothProvider>
  );
};

export default App;