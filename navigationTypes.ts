import { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Dashboard: undefined;
  Control: undefined;
  Subscription: undefined;
  PaymentScreen: undefined;
  History: undefined;
  UserProfile: undefined;
  ForgotPassword: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;
export type SignupScreenProps = NativeStackScreenProps<RootStackParamList, "Signup">;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home">;
export type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, "Dashboard">;
export type ControlScreenProps = NativeStackScreenProps<RootStackParamList, "Control">;
export type SubscriptionScreenProps = NativeStackScreenProps<RootStackParamList, "Subscription">;
export type PaymentScreenProps = NativeStackScreenProps<RootStackParamList, "PaymentScreen">;
export type HistoryScreenProps = NativeStackScreenProps<RootStackParamList, "History">;
export type UserProfileProps = NativeStackScreenProps<RootStackParamList, "UserProfile">;
export type ForgotPasswordProps = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

