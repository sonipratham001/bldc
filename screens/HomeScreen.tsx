import React, { useContext, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from "react-native";
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

    return () => {
      manager.stopDeviceScan(); // Stop scanning if the user leaves the screen
    };
  }, []);

  const startScan = async () => {
    if (isScanning) return; // Prevent multiple scans

    await requestBluetoothPermissions();
    setDevices([]); // Clear previous scan results
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Scan Error:", error);
        Alert.alert("Error", "Failed to scan for devices. Turn on your device Bluetooth");
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

  const handleConnect = async (device: Device) => {
    await connectToDevice(device);
    manager.stopDeviceScan(); // Stop scanning once connected
    setIsScanning(false);
  };

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      {/* Company Logo */}
      <View style={styles.logoContainer}>
        <Image source={require("../assets/intuteLogo.png")} style={styles.logo} />
      </View>

      {/* Connection Status Message */}
      <Text style={styles.title}>
        {connectedDevice ? "✅ Connected to ESP32" : "❌ App is Disconnected"}
      </Text>

      {/* Scan for Bluetooth Devices Button */}
      <TouchableOpacity style={[styles.button, styles.scanButton]} onPress={startScan} disabled={isScanning}>
        <Text style={styles.buttonText}>{isScanning ? "Scanning..." : "Scan for Bluetooth Devices"}</Text>
      </TouchableOpacity>

      {/* Show loading indicator when scanning */}
      {isScanning && <ActivityIndicator size="large" color="#4CAF50" style={{ marginBottom: 10 }} />}

      {/* List of Scanned Devices */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceItem} onPress={() => handleConnect(item)}>
            <View style={styles.deviceDetails}>
              <Text style={styles.deviceName}>{item.name || "Unknown Device"}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!isScanning ? <Text style={styles.noDevices}>No devices found</Text> : null}
      />

      {/* Disconnect Button */}
      {connectedDevice && (
        <TouchableOpacity style={[styles.button, styles.disconnectButton]} onPress={disconnectDevice}>
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      )}

      {/* Button to Go to Dashboard */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Dashboard")}>
        <Text style={styles.buttonText}>📊 Go to Dashboard</Text>
      </TouchableOpacity>

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
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#121212",
    paddingBottom: 60,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  logo: {
    width: 350,
    height: 200,
    resizeMode: "contain",
  },
  title: {
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: "#4CAF50",
  },
  disconnectButton: {
    backgroundColor: "#FF4D4D",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  list: {
    paddingBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  deviceItem: {
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    width: "90%",
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
    fontSize: 16,
    fontWeight: "600",
  },
  deviceId: {
    fontSize: 14,
    color: "#555",
  },
  noDevices: {
    color: "#bbb",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
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

export default HomeScreen;
