import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore, initializeFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Log configuration for debugging
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? 'SET' : 'NOT_SET'
});

console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
  NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING: process.env.NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING,
});

// Initialize Firebase only if we have a valid config
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
console.log('Firebase app initialized:', app.name);

// Initialize Firebase services with error handling
let auth: Auth | undefined;
let db: Firestore | undefined;
let functions: Functions | undefined;
let storage: FirebaseStorage | undefined;

// Track if emulators are connected
let emulatorsConnected = false;

try {
  auth = getAuth(app);
  console.log('Firebase Auth initialized');
} catch (error) {
  console.error('Failed to initialize Firebase Auth:', error);
}

try {
  // Use initializeFirestore for better control over Firestore settings
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    // In emulator mode, use regular getFirestore
    db = getFirestore(app);
    console.log('Firestore initialized for emulator mode');
  } else {
    // In production, use initializeFirestore with specific settings
    try {
      const forceLongPolling = process.env.NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING === 'true' || 
                              process.env.NODE_ENV === 'production';
      
      db = initializeFirestore(app, {
        // Force long polling in production to avoid WebSocket CORS issues
        experimentalForceLongPolling: forceLongPolling,
        ignoreUndefinedProperties: true,
      });
      
      if (forceLongPolling) {
        console.log('Firestore initialized with long polling to avoid CORS issues');
      }
    } catch (error) {
      // If initializeFirestore fails (already initialized), fall back to getFirestore
      console.warn('initializeFirestore failed, falling back to getFirestore:', error);
      db = getFirestore(app);
    }
  }
} catch (error) {
  console.error('Failed to initialize Firestore:', error);
}

try {
  functions = getFunctions(app);
  console.log('Firebase Functions initialized');
} catch (error) {
  console.error('Failed to initialize Functions:', error);
}

try {
  storage = getStorage(app);
  console.log('Firebase Storage initialized');
} catch (error) {
  console.error('Failed to initialize Storage:', error);
}

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  console.log('Attempting to connect to Firebase emulators...');
  
  try {
    // Connect to Auth emulator
    if (auth && !emulatorsConnected) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('✅ Connected to Auth emulator at localhost:9099');
    }
  } catch (error) {
    console.log('Auth emulator already connected or failed to connect:', error);
  }
  
  try {
    // Connect to Firestore emulator
    if (db && !emulatorsConnected) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('✅ Connected to Firestore emulator at localhost:8080');
    }
  } catch (error) {
    console.log('Firestore emulator already connected or failed to connect:', error);
  }
  
  try {
    // Connect to Functions emulator
    if (functions && !emulatorsConnected) {
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('✅ Connected to Functions emulator at localhost:5001');
    }
  } catch (error) {
    console.log('Functions emulator already connected or failed to connect:', error);
  }

  try {
    // Connect to Storage emulator
    if (storage && !emulatorsConnected) {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('✅ Connected to Storage emulator at localhost:9199');
    }
  } catch (error) {
    console.log('Storage emulator already connected or failed to connect:', error);
  }

  emulatorsConnected = true;
  console.log('Firebase emulators connection attempt completed');
}

// Helper function to get initialized services with error handling
export const getFirebaseServices = () => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  if (!db) throw new Error('Firestore not initialized');
  if (!functions) throw new Error('Firebase Functions not initialized');
  if (!storage) throw new Error('Firebase Storage not initialized');
  
  return { auth, db, functions, storage };
};

// Export individual services (can be undefined)
export { auth, db, functions, storage };
export default app; 