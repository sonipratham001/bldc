import React, { useContext, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from "react-native";
import { BluetoothContext } from "../services/BluetoothServices";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import LinearGradient from "react-native-linear-gradient";
import { BleManager, Device } from "react-native-ble-plx";
import requestBluetoothPermissions from "../services/requestBluetoothPermissions";
import { getAuth, signOut } from "@react-native-firebase/auth"; // Use modular auth imports
import { getApp } from "@react-native-firebase/app"; // Import getApp for modular SDK
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

const manager = new BleManager();

// Get the auth instance using getApp()
const authInstance = getAuth(getApp());

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Home">>();
  const { connectedDevice, connectToDevice, disconnectDevice } = useContext(BluetoothContext);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null); // State for free trial days left

  useEffect(() => {
    requestBluetoothPermissions();

    // Fetch or set free trial data when the component mounts
    const fetchOrSetTrialData = async () => {
      const user = authInstance.currentUser;
      if (user) {
        const trialStartStr = await AsyncStorage.getItem(`freeTrialStart_${user.uid}`);
        const subscriptionStr = await AsyncStorage.getItem(`isSubscribed_${user.uid}`); // Optional: Check subscription status

        if (!trialStartStr) {
          // New user: set free trial start date (today)
          const trialStart = new Date().toISOString();
          await AsyncStorage.setItem(`freeTrialStart_${user.uid}`, trialStart);
          setTrialDaysLeft(15); // Start with 15 days
        } else {
          // Existing user: calculate remaining days
          const trialStart = new Date(trialStartStr);
          const now = new Date();
          const diffMs = now.getTime() - trialStart.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const daysLeft = 15 - diffDays;

          if (daysLeft > 0) {
            setTrialDaysLeft(daysLeft);
          } else {
            setTrialDaysLeft(0); // Trial expired
            // Check if user is subscribed (optional, if implemented)
            if (!subscriptionStr || subscriptionStr !== "true") {
              handleTrialExpired(); // Prompt to subscribe if not subscribed
            }
          }
        }
      }
    };

    fetchOrSetTrialData();

    return () => {
      manager.stopDeviceScan(); // Stop scanning if the user leaves the screen
    };
  }, []);

  const startScan = async () => {
    if (isScanning) return;

    await requestBluetoothPermissions();
    setDevices([]);
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

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const handleConnect = async (device: Device) => {
    await connectToDevice(device);
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(authInstance); // Use authInstance for signOut
      Alert.alert("Success", "Logged out successfully!");
      // Do not use navigation.reset—rely on App.tsx's onAuthStateChanged to navigate to Login
      // Clear free trial data on logout
      const user = authInstance.currentUser;
      if (user) {
        await AsyncStorage.removeItem(`freeTrialStart_${user.uid}`);
        await AsyncStorage.removeItem(`isSubscribed_${user.uid}`); // Optional: Clear subscription status
      }
    } catch (error: any) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  const handleSubscribe = () => {
    navigation.navigate("PaymentScreen"); // Navigate to Subscription screen
  };

  const handleTrialExpired = () => {
    Alert.alert(
      "Trial Expired",
      "Your 15-day free trial has expired. Please subscribe to continue using the app.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Subscribe", onPress: () => navigation.navigate("Subscription"), style: "default" },
      ]
    );
  };

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require("../assets/intuteLogo.png")} style={styles.logo} />
      </View>

      <Text style={styles.title}>
        {connectedDevice ? "✅ Connected to ESP32" : "❌ App is Disconnected"}
      </Text>

      {!connectedDevice && (
        <TouchableOpacity style={[styles.button, styles.scanButton]} onPress={startScan} disabled={isScanning}>
          <Text style={styles.buttonText}>{isScanning ? "Scanning..." : "Scan for Bluetooth Devices"}</Text>
        </TouchableOpacity>
      )}

      {isScanning && <ActivityIndicator size="large" color="#4CAF50" style={{ marginBottom: 10 }} />}

      {!connectedDevice && (
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
      )}

      {connectedDevice && (
        <TouchableOpacity style={[styles.button, styles.disconnectButton]} onPress={disconnectDevice}>
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      )}

      {/* Trial Status or Subscription Prompt */}
      {trialDaysLeft !== null && (
        <View style={styles.trialContainer}>
          {trialDaysLeft > 0 ? (
            <View style={styles.trialContent}>
              <Text style={styles.trialText}>
                Your free trial expires in {trialDaysLeft} days
              </Text>
              <TouchableOpacity style={[styles.button, styles.subscribeButton]} onPress={handleSubscribe}>
                <Text style={styles.buttonText}>Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.button, styles.subscribeButton]} onPress={handleSubscribe}>
              <Text style={styles.buttonText}>Subscribe Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Updated Logout Button */}
      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.footerText}>🏠 Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Dashboard")}>
          <Text style={styles.footerText}>📊 Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("History")}>
          <Text style={styles.footerText}>📜 History</Text>
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
    marginLeft: 80,
  },
  title: {
    fontSize: 30,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  scanButton: {
    backgroundColor: "#4CAF50",
  },
  disconnectButton: {
    backgroundColor: "#FF4D4D",
  },
  logoutButton: {
    backgroundColor: "#FF6347",
    marginTop: 5,
  },
  subscribeButton: {
    backgroundColor: "#4CAF50", // Match the Subscribe Now button color with Scan button
    marginTop: 10,
    paddingHorizontal: 20, // Reduced padding to make the button narrower
    width: 150, // Set a fixed width to reduce the button size
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
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
  trialContainer: {
    alignItems: "center",
    marginTop: 20,
    width: "100%", // Ensure full width for centering
  },
  trialContent: {
    alignItems: "center", // Center the content horizontally
    width: "100%", // Ensure full width for centering
  },
  trialText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default HomeScreen;