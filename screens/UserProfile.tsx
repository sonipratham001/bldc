import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { 
    getAuth, 
    reauthenticateWithCredential, 
    updatePassword 
  } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import SideMenu from './SideMenu';

type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

const UserProfile: React.FC = () => {
  const navigation = useNavigation<UserProfileNavigationProp>();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false); // State for modal visibility
  const authInstance = getAuth(getApp());

  useEffect(() => {
    const fetchUserData = async () => {
      const user = authInstance.currentUser;
      if (user) {
        setEmail(user.email);
        const subscriptionStatus = await AsyncStorage.getItem(`isSubscribed_${user.uid}`);
        setIsSubscribed(subscriptionStatus === 'true');
      }
    };
    fetchUserData();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openModal = () => {
    setIsModalVisible(true);
    setError(null); // Clear any previous errors when opening the modal
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handlePasswordChange = async () => {
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    try {
      const user = authInstance.currentUser;
      if (user && user.email) {
        // Re-authenticate user with current password
        const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Password updated successfully!');
        closeModal(); // Close modal on success
      }
    } catch (error: any) {
      console.error('Password Change Error:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#F5F5F5', '#E8ECEF', '#DEE2E6']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Profile</Text>
      </View>

      <View style={styles.profileContainer}>
        {/* User Icon */}
        <View style={styles.userIconContainer}>
          <Text style={styles.userIcon}>👤</Text>
        </View>

        {/* Email */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{email || 'Not available'}</Text>
        </View>

        {/* Subscription Status */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Subscription Status:</Text>
          <Text style={styles.value}>{isSubscribed ? 'Premium' : 'Free Trial'}</Text>
        </View>

        {/* Change Password Button to Open Modal */}
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={openModal}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#666"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handlePasswordChange}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
  title: {
    fontSize: 22,
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 20,
    marginRight: 18,
    marginLeft: 28,
  },
  profileContainer: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  userIconContainer: {
    marginBottom: 30,
  },
  userIcon: {
    fontSize: 60,
    color: '#000',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 50,
    width: 80,
    height: 80,
    textAlign: 'center',
    lineHeight: 80,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
  },
  changePasswordButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '80%',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: 'center',
    backgroundColor: '#FF4D4D',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '80%',
  },
  buttonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: '#000',
    backgroundColor: '#FFF',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButton: {
    backgroundColor: '#FF4D4D',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});

export default UserProfile;