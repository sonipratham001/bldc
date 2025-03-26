// App.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, BackHandler } from "react-native";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import { getFirestore, doc, getDoc } from "@react-native-firebase/firestore";
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
import Toast from 'react-native-toast-message';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Dashboard: undefined;
  Subscription: undefined;
  PaymentScreen: undefined;
  History: undefined;
  UserProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const authInstance = getAuth(getApp());

const App = () => {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  const checkTrialAndSubscription = async () => {
    if (!user) {
      setIsTrialExpired(null);
      setIsSubscribed(null);
      return;
    }

    try {
      const creationTimeStr = user.metadata.creationTime;
      if (creationTimeStr) {
        const trialStart = new Date(creationTimeStr);
        const now = new Date();
        const diffMs = now.getTime() - trialStart.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const trialPeriod = 15;
        const daysLeft = trialPeriod - diffDays;

        const trialExpired = daysLeft <= 0;
        setIsTrialExpired(trialExpired);

        if (trialExpired) {
          const db = getFirestore(getApp());
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const subscribed = userDoc.exists && userDoc.data()?.isSubscribed;
          setIsSubscribed(subscribed);
        } else {
          setIsSubscribed(true); // If trial is not expired, no need to check subscription
        }
      } else {
        console.error('User creation time is undefined');
        setIsTrialExpired(true);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking trial/subscription:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to check subscription status. Please try again.',
      });
      setIsTrialExpired(true);
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    const authInstance = getAuth(getApp());
    const unsubscribe = onAuthStateChanged(authInstance, (currentUser: FirebaseAuthTypes.User | null) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      checkTrialAndSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (!user || isTrialExpired === null || isSubscribed === null) return;

    const unsubscribe = navigationRef.addListener('state', () => {
      const currentRoute = navigationRef.getCurrentRoute();
      if (currentRoute) {
        const routeName = currentRoute.name;

        // Allow navigation to Home, PaymentScreen, Login, Signup, or ForgotPassword
        if (
          routeName === 'Home' ||
          routeName === 'PaymentScreen' ||
          routeName === 'Login' ||
          routeName === 'Signup' ||
          routeName === 'ForgotPassword'
        ) {
          return;
        }

        // If trial is expired and user is not subscribed, redirect to HomeScreen
        if (isTrialExpired && !isSubscribed) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
          Toast.show({
            type: 'info',
            text1: 'Subscription Required',
            text2: 'Please subscribe to access this screen.',
            visibilityTime: 4000,
            autoHide: true,
            position: 'bottom',
          });
        }
      }
    });

    return unsubscribe;
  }, [user, isTrialExpired, isSubscribed]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentRoute = navigationRef.getCurrentRoute();
      if (currentRoute?.name === 'PaymentScreen' && isTrialExpired && !isSubscribed) {
        navigationRef.navigate('Home');
        Toast.show({
          type: 'info',
          text1: 'Subscription Required',
          text2: 'Please subscribe to continue using the app.',
          visibilityTime: 4000,
          autoHide: true,
          position: 'bottom',
        });
        return true; // Prevent default back action
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isTrialExpired, isSubscribed]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <BluetoothProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: false, // Disable swipe gestures to prevent back navigation
          }}
        >
          {user ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Subscription" component={Subscription} />
              <Stack.Screen
                name="PaymentScreen"
                component={PaymentScreen}
                options={{ headerLeft: () => null }} // Remove back button on PaymentScreen
              />
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
      <Toast />
    </BluetoothProvider>
  );
};

export default App;