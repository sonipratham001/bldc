import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import Slider from "@react-native-community/slider";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import LinearGradient from "react-native-linear-gradient";
import { BluetoothContext } from "../services/BluetoothServices";

const ControlScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Control">>();
  const { connectedDevice } = React.useContext(BluetoothContext);

  const [rpm, setRPM] = useState(0);
  const [voltage, setVoltage] = useState(48);
  const [throttle, setThrottle] = useState(0);
  const [temperature, setTemperature] = useState(30);

  const sendCommand = (parameter: string, value: number) => {
    if (!connectedDevice) {
        Alert.alert("No device connected", "Connect to ESP32 first.");
      return;
    }
    // Here, you would send data to ESP32 via Bluetooth
    console.log(`Sending ${parameter}: ${value}`);
  };

  return (
    <LinearGradient colors={["#0F2027", "#203A43", "#2C5364"]} style={styles.container}>
      
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Motor Control Panel</Text>

      {/* RPM Control */}
      <View style={styles.controlItem}>
        <Text style={styles.label}>RPM: {rpm}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={5000}
          step={100}
          value={rpm}
          onValueChange={setRPM}
          onSlidingComplete={() => sendCommand("RPM", rpm)}
        />
      </View>

      {/* Voltage Control */}
      <View style={styles.controlItem}>
        <Text style={styles.label}>Voltage: {voltage}V</Text>
        <Slider
          style={styles.slider}
          minimumValue={24}
          maximumValue={60}
          step={1}
          value={voltage}
          onValueChange={setVoltage}
          onSlidingComplete={() => sendCommand("Voltage", voltage)}
        />
      </View>

      {/* Throttle Control */}
      <View style={styles.controlItem}>
        <Text style={styles.label}>Throttle: {throttle}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={throttle}
          onValueChange={setThrottle}
          onSlidingComplete={() => sendCommand("Throttle", throttle)}
        />
      </View>

      {/* Temperature Control */}
      <View style={styles.controlItem}>
        <Text style={styles.label}>Temperature: {temperature}°C</Text>
        <Slider
          style={styles.slider}
          minimumValue={20}
          maximumValue={100}
          step={1}
          value={temperature}
          onValueChange={setTemperature}
          onSlidingComplete={() => sendCommand("Temperature", temperature)}
        />
      </View>

      {/* Send Command Button */}
      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => Alert.alert(`Sending all values:\nRPM: ${rpm}, Voltage: ${voltage}, Throttle: ${throttle}, Temperature: ${temperature}`)}
      >
        <Text style={styles.sendButtonText}>📡 Send Command</Text>
      </TouchableOpacity>
      
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    padding: 5,
  },
  backText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },
  title: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 20,
  },
  controlItem: {
    width: "85%",
    backgroundColor: "#ffffff20",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 5,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sendButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ControlScreen;
