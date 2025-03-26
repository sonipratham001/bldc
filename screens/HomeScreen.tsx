// HomeScreen.tsx (only showing the relevant changes)
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  BackHandler,
  Modal,
} from 'react-native';
import { BluetoothContext } from '../services/BluetoothServices';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import { BleManager, Device } from 'react-native-ble-plx';
import requestBluetoothPermissions from '../services/requestBluetoothPermissions';
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import SideMenu from './SideMenu';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

const manager = new BleManager();
const authInstance = getAuth(getApp());

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const { connectedDevice, connectToDevice, disconnectDevice } = useContext(BluetoothContext);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [showTrialModal, setShowTrialModal] = useState<boolean>(false);

  useEffect(() => {
    requestBluetoothPermissions();

    const fetchTrialData = async () => {
      const user = authInstance.currentUser;
      if (user) {
        const creationTimeStr = user.metadata.creationTime;
        if (creationTimeStr) {
          const trialStart = new Date(creationTimeStr);
          const now = new Date();
          const diffMs = now.getTime() - trialStart.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const trialPeriod = 15;
          const daysLeft = trialPeriod - diffDays;

          if (daysLeft > 0) {
            setTrialDaysLeft(daysLeft);
            setIsSubscribed(true);
            Toast.show({
              type: 'success',
              text1: 'Free Trial Active',
              text2: `Your trial expires in ${daysLeft} days.`,
              visibilityTime: 4000,
              autoHide: true,
              position: 'bottom',
            });
          } else {
            setTrialDaysLeft(0);
            const db = getFirestore(getApp());
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            const subscribed = userDoc.exists && userDoc.data()?.isSubscribed;
            setIsSubscribed(subscribed);
            if (!subscribed) {
              setShowTrialModal(true);
            }
          }
        } else {
          console.error('User creation time is undefined');
          setTrialDaysLeft(0);
          setIsSubscribed(false);
          setShowTrialModal(true);
        }
      }
    };

    fetchTrialData();

    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  const startScan = async () => {
    if (isScanning) return;

    await requestBluetoothPermissions();
    setDevices([]);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan Error:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to scan for devices. Turn on your device Bluetooth',
          visibilityTime: 4000,
          autoHide: true,
          position: 'top',
        });
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSubscribe = () => {
    setShowTrialModal(false);
    navigation.navigate('PaymentScreen');
  };

  const handleCancel = () => {
    setShowTrialModal(false);
    BackHandler.exitApp();
  };

  return (
    <LinearGradient
      colors={['#F5F5F5', '#E8ECEF', '#DEE2E6']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: '#000' }]}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#000' }]}>
          {connectedDevice ? 'Connected to ESP32' : 'App is Disconnected'}
        </Text>
      </View>

      <View style={styles.logoContainer}>
        <Image source={require('../assets/intuteLogo.png')} style={styles.logo} />
      </View>

      <View style={styles.buttonContainer}>
        {!connectedDevice && (
          <TouchableOpacity
            style={[styles.button, styles.scanButton]}
            onPress={startScan}
            disabled={isScanning || !isSubscribed}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText1}>Scan for Bluetooth Devices</Text>
          </TouchableOpacity>
        )}

        {isScanning && (
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginVertical: 15 }} />
        )}

        {!connectedDevice && (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.deviceItem}
                onPress={() => handleConnect(item)}
                activeOpacity={0.8}
                disabled={!isSubscribed}
              >
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                  <Text style={styles.deviceId}>{item.id}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              !isScanning ? (
                <Text style={[styles.noDevices, { color: '#666' }]}>No devices found</Text>
              ) : null
            }
          />
        )}

        {connectedDevice && (
          <TouchableOpacity
            style={[styles.button, styles.goToDashboardButton]}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.7}
            disabled={!isSubscribed}
          >
            <Text style={styles.buttonText1}>Go to Dashboard</Text>
          </TouchableOpacity>
        )}

        {connectedDevice && (
          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={disconnectDevice}
            activeOpacity={0.7}
            disabled={!isSubscribed}
          >
            <Text style={styles.buttonText1}>Disconnect</Text>
          </TouchableOpacity>
        )}

        <View style={styles.trialContent}>
          {trialDaysLeft !== null && trialDaysLeft > 0 && (
            <View style={styles.trialMessage}>
              <Text style={styles.trialIcon}>⏳</Text>
              <Text style={[styles.trialText, { color: '#000' }]}>
                Your free trial expires in {trialDaysLeft} days
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Custom Trial Expired Modal */}
      <Modal
        visible={showTrialModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#F5F5F5', '#E8ECEF', '#DEE2E6']}
            style={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Trial Expired</Text>
            <Text style={styles.modalMessage}>
              Your 15-day free trial has ended. Subscribe now to continue enjoying the app!
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.subscribeButton]}
                onPress={handleSubscribe}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Subscribe</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} isSubscribed={isSubscribed} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  buttonText1: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 10,
    paddingLeft: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logo: {
    width: 240,
    height: 140,
    resizeMode: 'contain',
    marginLeft: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 20,
    marginRight: 18,
    marginLeft: 45,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    width: '80%',
  },
  goToDashboardButton: {
    backgroundColor: '#4CAF50',
    width: '80%',
  },
  disconnectButton: {
    backgroundColor: '#FF4D4D',
    width: '80%',
  },
  menuButton: {
    padding: 0,
    marginLeft: -7,
    marginBottom: 18,
  },
  menuIcon: {
    fontSize: 30,
    color: '#000',
    paddingLeft: 0,
    marginLeft: 0,
  },
  list: {
    paddingBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  deviceItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    width: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  deviceId: {
    fontSize: 15,
    color: '#666',
  },
  noDevices: {
    color: '#666',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  trialContent: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 30,
  },
  trialMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', // Light green background to indicate active trial
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trialIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#4CAF50',
  },
  trialText: {
    fontSize: 17,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cancelButton: {
    backgroundColor: '#FF4D4D',
  },
  subscribeButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;