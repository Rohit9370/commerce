import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCMWNelSOq6Zf2iqWmW8pc9EZRJIcRYyCw",
  authDomain: "serviceprovider-33f80.firebaseapp.com",
  projectId: "serviceprovider-33f80",
  storageBucket: "serviceprovider-33f80.firebasestorage.app",
  messagingSenderId: "735847697694",
  appId: "1:735847697694:web:f58a5f10a026375b1f8d0f",
  databaseURL: "https://serviceprovider-33f80-default-rtdb.firebaseio.com/"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize auth with React Native persistence
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (e) {
    // Hot reload / multi-import can attempt to init twice; reuse existing auth.
    // eslint-disable-next-line no-console
    console.log("Firebase auth already initialized");
    // Lazy import to avoid circulars; getAuth exists in firebase/auth.
    // We keep it inline to ensure we always return a valid instance.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAuth } = require("firebase/auth");
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);