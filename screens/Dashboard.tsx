import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { BluetoothContext } from "../services/BluetoothServices";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import LinearGradient from "react-native-linear-gradient";
import { getFirestore, collection, addDoc, serverTimestamp } from "@react-native-firebase/firestore"; // Use modular firestore
import { getAuth } from "@react-native-firebase/auth"; // Use modular auth
import { getApp } from "@react-native-firebase/app"; // Import getApp for modular SDK
import Speedometer from 'react-native-speedometer';

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Dashboard">>();
  const { data = {}, connectedDevice } = useContext(BluetoothContext);

  const message1 = data.message1 || {};
  const message2 = data.message2 || {};

  useEffect(() => {
    const authInstance = getAuth(getApp());
    const db = getFirestore(getApp());
  
    let lastSavedData: any = null;
  
    // Save data immediately if conditions are met on mount
    const saveInitialData = async () => {
      if (
        connectedDevice &&
        data.message1 &&
        !data.message1.error &&
        data.message2 &&
        !data.message2.error
      ) {
        const user = authInstance.currentUser;
        if (user) {
          const combinedData = {
            speed: data.message1.speed,
            voltage: data.message1.voltage,
            current: data.message1.current,
            errorCode: data.message1.errorCode,
            errorMessages: data.message1.errorMessages,
            throttle: data.message2.throttle,
            controllerTemp: data.message2.controllerTemp,
            motorTemp: data.message2.motorTemp,
            controllerStatus: data.message2.controllerStatus,
            switchSignals: data.message2.switchSignals,
            timestamp: serverTimestamp(),
          };
  
          if (!lastSavedData || JSON.stringify(lastSavedData) !== JSON.stringify(combinedData)) {
            await addDoc(collection(db, 'users', user.uid, 'ev_data'), combinedData)
              .catch((error) => {
                console.error('Error saving initial data:', error);
              });
            lastSavedData = combinedData;
          }
        }
      }
    };
  
    saveInitialData(); // Save data immediately on mount
  
    // Continue saving every 3 minutes
    const interval = setInterval(() => {
      if (
        connectedDevice &&
        data.message1 &&
        !data.message1.error &&
        data.message2 &&
        !data.message2.error
      ) {
        const user = authInstance.currentUser;
        if (user) {
          const combinedData = {
            speed: data.message1.speed,
            voltage: data.message1.voltage,
            current: data.message1.current,
            errorCode: data.message1.errorCode,
            errorMessages: data.message1.errorMessages,
            throttle: data.message2.throttle,
            controllerTemp: data.message2.controllerTemp,
            motorTemp: data.message2.motorTemp,
            controllerStatus: data.message2.controllerStatus,
            switchSignals: data.message2.switchSignals,
            timestamp: serverTimestamp(),
          };
  
          if (!lastSavedData || JSON.stringify(lastSavedData) !== JSON.stringify(combinedData)) {
            addDoc(collection(db, 'users', user.uid, 'ev_data'), combinedData)
              .catch((error) => {
                console.error('Error saving data:', error);
              });
            lastSavedData = combinedData;
          }
        }
      }
    }, 180000); // Store data every 3 minutes (180,000ms)
  
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [connectedDevice, data.message1, data.message2]); // Add dependencies to re-run effect if data changes

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      <Text style={styles.title}>🚀 BLDC Motor Dashboard</Text>

      {connectedDevice ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dataContainer}>
            <View style={styles.speedometerContainer}>
              <Speedometer
                value={message1.speed || 0}
                totalValue={5000}
                size={200}
                showText
                textStyle={styles.speedometerText}
                needleColor="#1E90FF"
                backgroundColor="#1E1E1E"
                arcWidth={15}
                arcBackgroundColor="#333"
                customArcs={[
                  { start: 0, end: 1250, color: '#00FF00' },
                  { start: 1250, end: 2500, color: '#FFFF00' },
                  { start: 2500, end: 3750, color: '#FFA500' },
                  { start: 3750, end: 5000, color: '#FF0000' },
                ]}
              />
              <Text style={styles.speedometerLabel}>Speed (RPM)</Text>
            </View>

            <Text style={styles.sectionTitle}>📊 Motor Metrics</Text>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>⚡ Speed: {message1.speed ?? "N/A"} RPM</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>🔋 Battery Voltage: {message1.voltage ?? "N/A"} V</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>🔌 Motor Current: {message1.current ?? "N/A"} A</Text>
            </View>

            <Text style={styles.sectionTitle}>🎚 Control Metrics</Text>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>🌡 Controller Temp: {message2.controllerTemp ?? "N/A"} °C</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>🌡 Motor Temp: {message2.motorTemp ?? "N/A"} °C</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>🎛 Throttle Signal: {message2.throttle ? ((message2.throttle / 255) * 5).toFixed(2) : "N/A"} V</Text>
            </View>

            <Text style={styles.sectionTitle}>🔌 Switch Signals</Text>
            {Object.entries({
              '🚀 Boost': message2.switchSignals?.boost,
              '👣 Footswitch': message2.switchSignals?.footswitch,
              '⏩ Forward': message2.switchSignals?.forward,
              '⏪ Backward': message2.switchSignals?.backward,
              '🛑 Brake': message2.switchSignals?.brake,
              '🔵 Hall C': message2.switchSignals?.hallC,
              '🟡 Hall B': message2.switchSignals?.hallB,
              '🟢 Hall A': message2.switchSignals?.hallA
            }).map(([label, value]) => (
              <View key={label} style={styles.switchRow}>
                <Text style={[styles.dataText, styles.iconText]}>
                  {label}: {value ? "ON" : "OFF"}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.disconnected}>❌ Not Connected to Controller</Text>
      )}

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
    paddingBottom: 60,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  dataContainer: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    marginVertical: 10,
    elevation: 6,
  },
  speedometerContainer: {
    alignItems: 'center',
    marginBottom: 16,
    height: 220,
  },
  speedometerLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4CAF50",
    marginVertical: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dataText: {
    fontSize: 16,
    color: "#fff",
    marginVertical: 4,
    paddingHorizontal: 10,
  },
  iconText: {
    flex: 1,
  },
  disconnected: {
    fontSize: 18,
    color: "#FF4D4D",
    marginTop: 20,
    textAlign: 'center',
  },
  footer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "#1E1E1E",
    zIndex: 2,
  },
  footerButton: {
    padding: 10,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  speedometerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default DashboardScreen;