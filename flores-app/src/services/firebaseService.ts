// Firebase initialization (Expo-managed, JS SDK).
//
// Credentials come from Expo public env vars (`.env`, see .env.example) so no
// secret is hardcoded. Until they're provided, `isFirebaseConfigured` is false
// and every service falls back to an in-memory mock so the app stays usable in
// development.
//
// Live setup: set EXPO_PUBLIC_FIREBASE_* in `.env`, then restart the bundler.
// Auth (Email/Password), Firestore and Storage must be enabled in the project.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// `getReactNativePersistence` ships only in firebase/auth's React Native build,
// so it's absent from the default TypeScript types (Metro resolves the RN entry
// at runtime). Reach it through the namespace with a fallback if unavailable.
const getReactNativePersistence = (
  firebaseAuth as unknown as { getReactNativePersistence?: (storage: unknown) => Persistence }
).getReactNativePersistence;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);

  // Persist the auth session across restarts using AsyncStorage (React Native).
  // initializeAuth throws if auth was already initialized (e.g. Fast Refresh) —
  // fall back to the existing instance in that case.
  try {
    authInstance = initializeAuth(
      app,
      getReactNativePersistence ? { persistence: getReactNativePersistence(AsyncStorage) } : undefined,
    );
  } catch {
    authInstance = getAuth(app);
  }

  // Auto-detect long polling avoids the Hermes/WebChannel stall that can leave
  // Firestore "connecting" forever on some Android networks.
  try {
    dbInstance = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    dbInstance = getFirestore(app);
  }

  storageInstance = getStorage(app);
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
