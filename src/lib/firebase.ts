import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore, initializeFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;
let functionsInstance: Functions | undefined;
let storageInstance: FirebaseStorage | undefined;

let emulatorsConnected = false; // Keep track if emulators are connected

function initializeFirebaseCore() {
  if (!app) {
    // Log configuration for debugging - only when initializing
    console.log('Firebase Config:', {
      ...firebaseConfigValues,
      apiKey: firebaseConfigValues.apiKey ? 'SET' : 'NOT_SET'
    });
    console.log('Environment variables for Firebase client:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
      NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING: process.env.NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING,
    });

    if (getApps().length === 0) {
      app = initializeApp(firebaseConfigValues);
      console.log('Firebase app newly initialized:', app.name);
    } else {
      app = getApps()[0];
      console.log('Using existing Firebase app:', app.name);
    }

    // Initialize services after app is confirmed
    try {
      authInstance = getAuth(app);
      console.log('Firebase Auth initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase Auth:', error);
    }

    try {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
        firestoreInstance = getFirestore(app);
        console.log('Firestore initialized for emulator mode');
      } else {
        const forceLongPolling = process.env.NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING === 'true' ||
                                process.env.NODE_ENV === 'production';
        firestoreInstance = initializeFirestore(app, {
          experimentalForceLongPolling: forceLongPolling,
          ignoreUndefinedProperties: true,
        });
        if (forceLongPolling) {
          console.log('Firestore initialized with long polling');
        } else {
          console.log('Firestore initialized');
        }
      }
    } catch (error: any) {
      if (error.message && error.message.includes("already initialized")) {
         console.warn('Firestore failed to initialize with initializeFirestore (likely already exists), falling back to getFirestore.');
         if(app) firestoreInstance = getFirestore(app);
      } else {
        console.error('Failed to initialize Firestore:', error);
      }
    }

    try {
      functionsInstance = getFunctions(app);
      console.log('Firebase Functions initialized');
    } catch (error) {
      console.error('Failed to initialize Functions:', error);
    }

    try {
      storageInstance = getStorage(app);
      console.log('Firebase Storage initialized');
    } catch (error) {
      console.error('Failed to initialize Storage:', error);
    }

    // Connect to emulators in development, only once
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && !emulatorsConnected) {
      console.log('Attempting to connect to Firebase emulators...');
      if (authInstance) {
        try { connectAuthEmulator(authInstance, 'http://localhost:9099', { disableWarnings: true }); console.log('✅ Connected to Auth emulator'); }
        catch (e) { console.log('Auth emulator already connected or failed:', e); }
      }
      if (firestoreInstance) {
        try { connectFirestoreEmulator(firestoreInstance, 'localhost', 8080); console.log('✅ Connected to Firestore emulator'); }
        catch (e) { console.log('Firestore emulator already connected or failed:', e); }
      }
      if (functionsInstance) {
        try { connectFunctionsEmulator(functionsInstance, 'localhost', 5001); console.log('✅ Connected to Functions emulator'); }
        catch (e) { console.log('Functions emulator already connected or failed:', e); }
      }
      if (storageInstance) {
        try { connectStorageEmulator(storageInstance, 'localhost', 9199); console.log('✅ Connected to Storage emulator'); }
        catch (e) { console.log('Storage emulator already connected or failed:', e); }
      }
      emulatorsConnected = true;
      console.log('Firebase emulators connection attempt completed');
    }
  }
}

export const getFirebaseApp = (): FirebaseApp => {
  initializeFirebaseCore();
  if (!app) throw new Error('Firebase App not initialized.');
  return app;
};

export const auth = getFirebaseAuth(); // Keep existing export style if preferred by codebase
export const db = getFirebaseDb(); // Keep existing export style
export const functions = getFirebaseFunctions(); // Keep existing export style
export const storage = getFirebaseStorage(); // Keep existing export style


function getFirebaseAuth(): Auth {
  initializeFirebaseCore();
  if (!authInstance) throw new Error('Firebase Auth not available.');
  return authInstance;
}

function getFirebaseDb(): Firestore {
  initializeFirebaseCore();
  if (!firestoreInstance) throw new Error('Firestore not available.');
  return firestoreInstance;
}

function getFirebaseFunctions(): Functions {
  initializeFirebaseCore();
  if (!functionsInstance) throw new Error('Firebase Functions not available.');
  return functionsInstance;
}

function getFirebaseStorage(): FirebaseStorage {
  initializeFirebaseCore();
  if (!storageInstance) throw new Error('Firebase Storage not available.');
  return storageInstance;
}

// Default export can be the app getter, or an object with all service getters
export default getFirebaseApp; 