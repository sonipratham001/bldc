import { initializeApp, getApp } from '@react-native-firebase/app'; // Use React Native Firebase for app and getApp
import { getAuth } from '@react-native-firebase/auth'; // Use modular auth
import { getFirestore } from '@react-native-firebase/firestore'; // Use modular firestore

// Define the Firebase config type
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Your Firebase config
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyAXk1AtM88QRQkEkrOZP6ssmtCU-9spiHk",
  authDomain: "bldc-a6481.firebaseapp.com",
  projectId: "bldc-a6481",
  storageBucket: "bldc-a6481.appspot.com",
  messagingSenderId: "456438530752",
  appId: "1:456438530752:android:77841a521fed277fcea325"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export modular auth and firestore instances using getApp()
export const auth = getAuth(getApp());
export const db = getFirestore(getApp());

export default app;