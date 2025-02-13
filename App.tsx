import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import DashboardScreen from "./screens/Dashboard";
import BluetoothService from "./services/BluetoothServices"; 
import ControlScreen from "./screens/ControlScreen";

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <BluetoothService> 
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Control" component={ControlScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </BluetoothService>
  );
};

export default App;
