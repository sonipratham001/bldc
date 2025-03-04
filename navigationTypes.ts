import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Dashboard: undefined;
  Control: undefined;
  Subscription: undefined; // Add Subscription screen
  PaymentScreen: undefined; // Add PaymentScreen for navigation
  History: undefined; // Add History screen
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;
export type SignupScreenProps = NativeStackScreenProps<RootStackParamList, "Signup">;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home">;
export type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, "Dashboard">;
export type ControlScreenProps = NativeStackScreenProps<RootStackParamList, "Control">;
export type SubscriptionScreenProps = NativeStackScreenProps<RootStackParamList, "Subscription">; // Add Subscription screen props
export type PaymentScreenProps = NativeStackScreenProps<RootStackParamList, "PaymentScreen">; // Add PaymentScreen props
export type HistoryScreenProps = NativeStackScreenProps<RootStackParamList, "History">; // Add History screen props