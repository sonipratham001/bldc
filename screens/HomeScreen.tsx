import React, { useContext, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import { BluetoothContext } from "../services/BluetoothServices";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import LinearGradient from "react-native-linear-gradient";
import { BleManager, Device } from "react-native-ble-plx";
import requestBluetoothPermissions from "../services/requestBluetoothPermissions";

const manager = new BleManager();

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Home">>();
  const { connectedDevice, connectToDevice, disconnectDevice } = useContext(BluetoothContext);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    requestBluetoothPermissions();
  }, []);

  const startScan = async () => {
    await requestBluetoothPermissions();
    setDevices([]); // Clear previous scan results
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Scan Error:", error);
        Alert.alert("Error", "Failed to scan for devices. Turn On your device Bluetooth");
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices((prevDevices) => {
          const exists = prevDevices.some((d) => d.id === device.id);
          if (!exists) return [...prevDevices, device];
          return prevDevices;
        });
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      {/* Company Logo */}
      <Image source={require("../assets/intuteLogo.png")} style={styles.logo} />

      {/* Connection Status Message */}
      <Text style={styles.title}>
        {connectedDevice ? "Your app is connected to ESP32" : "App is Disconnected"}
      </Text>

      {/* Scan for Bluetooth Devices Button */}
      <TouchableOpacity style={[styles.button, styles.scanButton]} onPress={startScan} disabled={isScanning}>
        <Text style={styles.buttonText}>{isScanning ? "Scanning..." : "Scan for Bluetooth Devices"}</Text>
      </TouchableOpacity>

      {/* List of Scanned Devices */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceItem} onPress={() => connectToDevice(item)}>
            <View style={styles.deviceDetails}>
              <Text style={styles.deviceName}>{item.name || "Unknown Device"}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      {/* Disconnect Button */}
      {connectedDevice && (
        <TouchableOpacity style={[styles.button, { backgroundColor: "red" }]} onPress={disconnectDevice}>
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      )}
      
      {/* Button to Go to Control Screen */}
<TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Control")}>
  <Text style={styles.buttonText}>🎛️ Control Motor</Text>
</TouchableOpacity>


      {/* Button to Go to Dashboard */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Dashboard")}>
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Dashboard")}>
          <Text style={styles.footerText}>Dashboard</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#121212",
    paddingBottom: 60,
    paddingTop: 20,
  },
  logo: {
    width: 300,
    height: 200,
    resizeMode: "contain",
    marginBottom: 50,
    marginLeft: 80,
  },
  title: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 25,
  },
  scanButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  list: {
    paddingBottom: 20,
  },
  deviceItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  deviceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceName: {
    fontSize: 18,
    fontWeight: "600",
  },
  deviceId: {
    fontSize: 14,
    color: "#555",
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
  },
});

export default HomeScreen;
