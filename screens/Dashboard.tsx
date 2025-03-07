import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BluetoothContext } from '../services/BluetoothServices';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import LinearGradient from 'react-native-linear-gradient';
import { getFirestore, collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import Speedometer from 'react-native-speedometer';
import SideMenu from './SideMenu';

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Dashboard'>>();
  const { data = {}, connectedDevice } = useContext(BluetoothContext);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const message1 = data.message1 || {};
  const message2 = data.message2 || {};

  useEffect(() => {
    const authInstance = getAuth(getApp());
    const db = getFirestore(getApp());

    const saveData = async () => {
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

          try {
            await addDoc(collection(db, 'users', user.uid, 'ev_data'), combinedData);
            console.log('Data saved successfully');
          } catch (error) {
            console.error('Error saving data:', error);
          }
        }
      }
    };

    saveData();
    const interval = setInterval(saveData, 300000); // 5 minutes = 300,000ms
    return () => clearInterval(interval);
  }, [connectedDevice, data.message1, data.message2]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <LinearGradient
      colors={['#F5F5F5', '#E8ECEF', '#DEE2E6']} // Matching HomeScreen gradient
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🚀 BLDC Motor Dashboard</Text>
      </View>

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
                backgroundColor="#FFFFFF" // Changed to white for light theme
                arcWidth={15}
                arcBackgroundColor="#E0E0E0" // Light gray for contrast
                customArcs={[
                  { start: 0, end: 1250, color: '#00FF00' },
                  { start: 1250, end: 2500, color: '#FFFF00' },
                  { start: 2500, end: 3750, color: '#FFA500' },
                  { start: 3750, end: 5000, color: '#FF0000' },
                ]}
              />
               {/* <Text style={styles.speedometerLabel}>Speed (RPM)</Text> */}
            </View>

            <Text style={styles.sectionTitle}>📊 Motor Metrics</Text>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>
                ⚡ Speed: {message1.speed ?? 'N/A'} RPM
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>
                🔋 Battery Voltage: {message1.voltage ?? 'N/A'} V
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>
                🔌 Motor Current: {message1.current ?? 'N/A'} A
              </Text>
            </View>

            <Text style={styles.sectionTitle}>🎚 Control Metrics</Text>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>
                🌡 Controller Temp: {message2.controllerTemp ?? 'N/A'} °C
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>
                🌡 Motor Temp: {message2.motorTemp ?? 'N/A'} °C
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.dataText, styles.iconText]}>
                🎛 Throttle Signal:{' '}
                {message2.throttle ? ((message2.throttle / 255) * 5).toFixed(2) : 'N/A'} V
              </Text>
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
              '🟢 Hall A': message2.switchSignals?.hallA,
            }).map(([label, value]) => (
              <View key={label} style={styles.switchRow}>
                <Text style={[styles.dataText, styles.iconText]}>
                  {label}: {value ? 'ON' : 'OFF'}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.disconnected}>❌ Not Connected to Controller</Text>
      )}

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 10,
    paddingLeft: 0,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    color: '#000', // Changed to black
    fontWeight: 'bold',
    marginBottom: 20,
    marginRight: 18,
    marginLeft: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  dataContainer: {
    backgroundColor: '#F8F9FA', // Matching HomeScreen trialMessage
    padding: 20,
    borderRadius: 8, // Reduced for simplicity
    width: '90%',
    marginVertical: 10,
    borderWidth: 1, // Subtle border like HomeScreen
    borderColor: '#E0E0E0',
  },
  speedometerContainer: {
    alignItems: 'center',
    marginBottom: 18,
    height: 200,  // Increased from 220 to accommodate extra spacing
  },
  speedometerLabel: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 22,  // Increased from 10 to push label down
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50', // Kept green for distinction
    marginVertical: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Lighter border
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
    color: '#000', // Changed to black
    marginVertical: 4,
    paddingHorizontal: 10,
  },
  iconText: {
    flex: 1,
  },
  disconnected: {
    fontSize: 18,
    color: '#FF4D4D',
    marginTop: 20,
    textAlign: 'center',
  },
  menuButton: {
    padding: 0,
    marginLeft: -7,
    marginBottom: 18,
  },
  menuIcon: {
    fontSize: 30,
    color: '#000', // Changed to black
    paddingLeft: 0,
    marginLeft: 0,
  },
  speedometerText: {
    color: '#000', // Changed to black
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;