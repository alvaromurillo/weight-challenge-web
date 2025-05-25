import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore, initializeFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

// Función para obtener la configuración de Firebase
function getFirebaseConfig() {
  // Detectar si estamos en el App Hosting Emulator
  const isAppHostingEmulator = typeof window !== 'undefined' && 
    (window.location.port === '5002' || 
     process.env.FIREBASE_EMULATOR_HUB || 
     process.env.FIREBASE_APP_HOSTING_EMULATOR === 'true');
  
  // PRODUCCIÓN Y EMULADOR: Firebase App Hosting inyecta automáticamente la configuración
  if (typeof window !== 'undefined' && window.FIREBASE_WEBAPP_CONFIG) {
    console.log('✅ Using Firebase App Hosting configuration (FIREBASE_WEBAPP_CONFIG)');
    console.log('🔧 App Hosting config detected:', {
      ...window.FIREBASE_WEBAPP_CONFIG,
      apiKey: window.FIREBASE_WEBAPP_CONFIG.apiKey ? 'SET' : 'NOT_SET'
    });
    return window.FIREBASE_WEBAPP_CONFIG;
  }
  
  // APP HOSTING EMULATOR: Verificar si estamos en el emulador
  if (isAppHostingEmulator) {
    console.log('🧪 Detected App Hosting Emulator environment');
    console.log('🔍 Environment variables:', {
      FIREBASE_APP_HOSTING_EMULATOR: process.env.FIREBASE_APP_HOSTING_EMULATOR,
      FIREBASE_WEBAPP_CONFIG: process.env.FIREBASE_WEBAPP_CONFIG ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV
    });
    
    // En el emulador, verificar si la configuración está disponible en process.env
    if (process.env.FIREBASE_WEBAPP_CONFIG) {
      console.log('🧪 Found FIREBASE_WEBAPP_CONFIG in process.env, parsing...');
      try {
        const config = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
        console.log('✅ Successfully parsed FIREBASE_WEBAPP_CONFIG from environment');
        
        // Inyectar en window para consistencia
        if (typeof window !== 'undefined') {
          window.FIREBASE_WEBAPP_CONFIG = config;
        }
        
        return config;
      } catch (error) {
        console.error('❌ Failed to parse FIREBASE_WEBAPP_CONFIG:', error);
      }
    }
    
    console.warn('⚠️ App Hosting Emulator detected but FIREBASE_WEBAPP_CONFIG not found');
    console.warn('📋 Available environment variables:', Object.keys(process.env).filter(key => key.includes('FIREBASE')));
  }
  
  // DESARROLLO LOCAL: Fallback para desarrollo usando variables de entorno
  // Nota: En desarrollo siempre deberías usar el Firebase App Hosting Emulator
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Using development configuration with environment variables');
    console.log('⚠️ Recomendado: Usar Firebase App Hosting Emulator (firebase emulators:start)');
    console.log('🔍 Environment context:', {
      NODE_ENV: process.env.NODE_ENV,
      isAppHostingEmulator,
      port: typeof window !== 'undefined' ? window.location.port : 'N/A',
      FIREBASE_EMULATOR_HUB: process.env.FIREBASE_EMULATOR_HUB
    });
    
    // En el cliente, las variables sin NEXT_PUBLIC_ no están disponibles
    // Así que necesitamos usar una estrategia diferente
    const requiredVars = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    };
    
    // Verificar que todas las variables estén configuradas
    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing Firebase environment variables: ${missingVars.join(', ')}`);
      
      if (isAppHostingEmulator) {
        console.warn('🧪 In App Hosting Emulator - this might be expected if config is injected later');
        console.warn('📋 Available environment variables:', Object.keys(process.env).filter(key => key.includes('FIREBASE')));
      } else {
        console.warn('Using demo configuration for development');
      }
      
      return {
        apiKey: 'demo-key',
        authDomain: 'demo-project.firebaseapp.com',
        projectId: 'demo-project',
        storageBucket: 'demo-project.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef',
      };
    }
    
    return requiredVars;
  }
  
  // PRODUCCIÓN: Si llegamos aquí, algo está mal
  throw new Error(
    'Firebase configuration not available. ' +
    'Make sure you are deploying to Firebase App Hosting or check your environment variables.'
  );
}

const firebaseConfigValues = getFirebaseConfig();

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
      HAS_FIREBASE_WEBAPP_CONFIG: typeof window !== 'undefined' && !!window.FIREBASE_WEBAPP_CONFIG,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? 'SET' : 'NOT_SET',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'NOT_SET',
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