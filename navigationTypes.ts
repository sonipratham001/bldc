import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  Dashboard: undefined;
  Control: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home">;
export type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, "Dashboard">;
export type ControlScreenProps = NativeStackScreenProps<RootStackParamList, "Control">;
