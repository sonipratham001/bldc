import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigationTypes';
import { getAuth, signOut } from '@react-native-firebase/auth';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const auth = getAuth();

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error: any) {
      console.error('Logout Error:', error);
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Side Menu Content */}
      <View style={styles.sideMenu}>
        {/* User Profile Icon */}
        <TouchableOpacity
          style={styles.userIconContainer}
          onPress={() => {
            navigation.navigate('UserProfile');
            onClose();
          }}
        >
          <Text style={styles.userIcon}>👤</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('Home');
            onClose();
          }}
        >
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('Dashboard');
            onClose();
          }}
        >
          <Text style={styles.buttonText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('History');
            onClose();
          }}
        >
          <Text style={styles.buttonText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('PaymentScreen');
            onClose();
          }}
        >
          <Text style={styles.buttonText}>Subscribe Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Backdrop that closes the menu when clicked */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sideMenu: {
    width: 250,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    paddingTop: 50,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(224, 224, 224, 0.2)',
    borderRightWidth: 0,
  },
  userIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userIcon: {
    fontSize: 40,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    width: 60,
    height: 60,
    textAlign: 'center',
    lineHeight: 60,
  },
  menuItem: {
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 224, 224, 0.2)',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'left',
    width: '100%',
  },
});

export default SideMenu;