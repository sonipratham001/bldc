import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { BluetoothContext } from "../services/BluetoothServices";

const DashboardScreen = () => {
  const { data, connectedDevice } = useContext(BluetoothContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 BLDC Motor Dashboard</Text>

      {connectedDevice ? (
        <View style={styles.dataContainer}>
          <Text style={styles.dataText}>⚡ Speed: {data.speed || "N/A"} RPM</Text>
          <Text style={styles.dataText}>🔋 Voltage: {data.voltage || "N/A"} V</Text>
          <Text style={styles.dataText}>🔌 Current: {data.current || "N/A"} A</Text>
          <Text style={styles.dataText}>🌡 Controller Temp: {data.controllerTemp || "N/A"} °C</Text>
          <Text style={styles.dataText}>🌡 Motor Temp: {data.motorTemp || "N/A"} °C</Text>
          <Text style={styles.dataText}>🎛 Throttle: {data.throttle?.toFixed(2) || "N/A"} V</Text>

          {/* Error Messages */}
          <Text style={styles.errorTitle}>🚨 Errors:</Text>
          {data.errorMessages?.map((error: string, index: number) => (
  <Text key={index} style={styles.errorText}>• {error}</Text>
))}

        </View>
      ) : (
        <Text style={styles.disconnected}>❌ Not Connected to ESP32</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121212",
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
    alignItems: "center",
  },
  dataText: {
    fontSize: 18,
    color: "#fff",
    marginVertical: 5,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF4D4D",
    marginTop: 15,
  },
  errorText: {
    fontSize: 16,
    color: "#FF4D4D",
  },
  disconnected: {
    fontSize: 18,
    color: "#FF4D4D",
    marginTop: 20,
  },
});

export default DashboardScreen;
