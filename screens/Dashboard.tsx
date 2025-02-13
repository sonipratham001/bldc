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
      
      {/* Back Button (Transparent Background) */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Motor Dashboard</Text>

      {/* Show Connection Status */}
      <Text style={styles.connectionStatus}>
        {connectedDevice ? `✅ Connected to ${connectedDevice.name}` : "❌ Not Connected"}
      </Text>

      {/* Speedometer Graphic */}
      <View style={styles.speedometerContainer}>
        <RNSpeedometer value={connectedDevice ? data.rpm / 60 : 0} maxValue={100} size={250} />
      </View>

      {/* Data Card */}
      <Card style={styles.card}>
        <Card.Title title="Motor Parameters" titleStyle={styles.cardTitle} />
        <Card.Content>
          <Text style={styles.dataText}>⚙️ RPM: {connectedDevice ? data.rpm : "No Data"}</Text>
          <Text style={styles.dataText}>🔋 Voltage: {connectedDevice ? `${data.voltage.toFixed(1)}V` : "No Data"}</Text>
          <Text style={styles.dataText}>🎛️ Throttle: {connectedDevice ? `${data.throttle}%` : "No Data"}</Text>
          <Text style={styles.dataText}>🌡️ Temperature: {connectedDevice ? `${data.temperature.toFixed(1)}°C` : "No Data"}</Text>
        </Card.Content>
      </Card>

      {/* Error Messages */}
      {data.errors.length > 0 && (
        <Card style={styles.errorCard}>
          <Card.Title title="⚠️ Errors Detected" titleStyle={styles.errorTitle} />
          <Card.Content>
            {data.errors.map((error: string, index: number) => (
              <Text key={index} style={styles.errorText}>🔴 {error}</Text>
            ))}
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
  errorCard: {
    width: "90%",
    backgroundColor: "#FF4D4D",
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
    elevation: 5,
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