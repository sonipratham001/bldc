import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BluetoothContext } from "../services/BluetoothServices";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import LinearGradient from "react-native-linear-gradient";

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Dashboard">>();
  const { data = {}, connectedDevice } = useContext(BluetoothContext);

  const message1 = data.message1 || {};
  const message2 = data.message2 || {};

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      <Text style={styles.title}>🚀 BLDC Motor Dashboard</Text>

      {connectedDevice ? (
        <View style={styles.dataContainer}>
          <Text style={styles.sectionTitle}>📊 Motor Metrics</Text>
          <Text style={styles.dataText}>⚡ Speed: {message1.speed ?? "N/A"} RPM</Text>
          <Text style={styles.dataText}>🔋 Battery Voltage: {message1.voltage ?? "N/A"} V</Text>
          <Text style={styles.dataText}>🔌 Motor Current: {message1.current ?? "N/A"} A</Text>

          <Text style={styles.sectionTitle}>🎚 Control Metrics</Text>
          <Text style={styles.dataText}>🌡 Controller Temp: {message2.controllerTemp ?? "N/A"} °C</Text>
          <Text style={styles.dataText}>🌡 Motor Temp: {message2.motorTemp ?? "N/A"} °C</Text>
          <Text style={styles.dataText}>🎛 Throttle Signal: {message2.throttle ? ((message2.throttle / 255) * 5).toFixed(2) : "N/A"} V</Text>

          <Text style={styles.sectionTitle}>🔌 Switch Signals</Text>
          <Text style={styles.dataText}>🚀 Boost: {message2.switchSignals?.boost ? "ON" : "OFF"}</Text>
          <Text style={styles.dataText}>👣 Footswitch: {message2.switchSignals?.footswitch ? "ON" : "OFF"}</Text>
          <Text style={styles.dataText}>⏩ Forward: {message2.switchSignals?.forward ? "ON" : "OFF"}</Text>
          <Text style={styles.dataText}>⏪ Backward: {message2.switchSignals?.backward ? "ON" : "OFF"}</Text>
          <Text style={styles.dataText}>🛑 Brake: {message2.switchSignals?.brake ? "ON" : "OFF"}</Text>
          <Text style={styles.dataText}>🔵 Hall C: {message2.switchSignals?.hallC ? "ON" : "OFF"}</Text>
          <Text style={styles.dataText}>🟡 Hall B: {message2.switchSignals?.hallB ? "ON" : "OFF"}</Text>
          <Text style={styles.dataText}>🟢 Hall A: {message2.switchSignals?.hallA ? "ON" : "OFF"}</Text>
        </View>
      ) : (
        <Text style={styles.disconnected}>❌ Not Connected to Controller</Text>
      )}

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.footerText}>🏠 Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Dashboard")}>
          <Text style={styles.footerText}>📊 Dashboard</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  dataContainer: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4CAF50",
    marginVertical: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dataText: {
    fontSize: 16,
    color: "#fff",
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  yellowText: {
    color: "yellow",
  },
  disconnected: {
    fontSize: 18,
    color: "#FF4D4D",
    marginTop: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "#1E1E1E",
  },
  footerButton: {
    padding: 10,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DashboardScreen;