import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Card } from "react-native-paper";
import RNSpeedometer from "react-native-speedometer";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import { BluetoothContext } from "../services/BluetoothServices";  // ✅ Import Bluetooth Context

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Dashboard">>();

  // ✅ Get live data from Bluetooth Service
  const { connectedDevice, data } = useContext(BluetoothContext);

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      
      {/* 🔙 Back Button (Transparent Background) */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Motor Dashboard</Text>

      {/* ✅ Show Connection Status */}
      <Text style={styles.connectionStatus}>
        {connectedDevice ? `✅ Connected to ${connectedDevice.name}` : "❌ Not Connected"}
      </Text>

      {/* 📊 Speedometer Display */}
      <View style={styles.speedometerContainer}>
        <RNSpeedometer
          value={data["0xCF11E05"]?.rpm ?? 0} // ✅ Show RPM safely
          maxValue={6000} // Adjust maxValue based on actual limits
          size={250}
        />
      </View>

      {/* 📦 Display Controller Instrument Data (0xCF11E05) */}
{data["0xCF11E05"] && (
  <Card style={styles.card}>
    <Card.Title title="Motor Parameters" titleStyle={styles.cardTitle} />
    <Card.Content>
      <Text style={styles.dataText}>⚙️ RPM: {data["0xCF11E05"].rpm}</Text>
      <Text style={styles.dataText}>🔋 Voltage: {data["0xCF11E05"].voltage}V</Text>
      <Text style={styles.dataText}>⚡ Current: {data["0xCF11E05"].current}A</Text>

      {/* 🚨 Show Errors Only If Present */}
{data["0xCF11E05"]?.errors?.length > 0 && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>⚠️ Errors Detected:</Text>
    {data["0xCF11E05"].errors.map((error: string, index: number) => (
      <Text key={index} style={styles.errorText}>🔴 {error}</Text>
    ))}
  </View>
)}

    </Card.Content>
  </Card>
)}

{/* 📦 Display Additional Controller Data (0xCF11F05) */}
{data["0xCF11F05"] && (
  <Card style={styles.card}>
    <Card.Title title="Controller Status" titleStyle={styles.cardTitle} />
    <Card.Content>
      <Text style={styles.dataText}>🎛️ Throttle: {data["0xCF11F05"].throttle}V</Text>
      <Text style={styles.dataText}>🌡️ Controller Temp: {data["0xCF11F05"].controllerTemp}°C</Text>
      <Text style={styles.dataText}>🌡️ Motor Temp: {data["0xCF11F05"].motorTemp}°C</Text>
    </Card.Content>
  </Card>
)}

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 10,
  },
  connectionStatus: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 15,
  },
  speedometerContainer: {
    backgroundColor: "#ffffff20",
    padding: 15,
    paddingBottom: 60,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
    elevation: 5,
  },
  card: {
    width: "90%",
    backgroundColor: "#1E1E1E",
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
    elevation: 5,
  },
  cardTitle: {
    color: "#FF6B6B",
    fontSize: 22,
    fontWeight: "bold",
    alignContent: "center",
  },
  dataText: {
    fontSize: 18,
    color: "#fff",
    marginTop: 5,
    fontWeight: "600",
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FF4D4D",
  },
  errorTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 5,
    fontWeight: "600",
  },
});

export default DashboardScreen;
