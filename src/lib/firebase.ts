import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

// Firebase configuration with fallbacks for development
// In production (Firebase App Hosting), these will be provided by apphosting.yaml
// In development, we'll use fallback values or .env.local if available
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBzSnpSZ2fRq5cIG3hXMuqYXazqri325uI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "weight-challenge-app-dev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "weight-challenge-app-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "weight-challenge-app-dev.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "742316431711",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:742316431711:web:886c310185aec80dc63eea"
}

// Log configuration source
const isUsingEnvVars = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
console.log(`🔧 Firebase config source: ${isUsingEnvVars ? 'Environment variables' : 'Fallback values (apphosting.yaml)'}`);
console.log('🔧 Initializing Firebase with project:', firebaseConfig.projectId);

// Validate that we have a valid configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Invalid Firebase configuration');
  throw new Error('Firebase configuration is incomplete');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Functions
export const functions = getFunctions(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

console.log('✅ Firebase client initialized successfully');

export { app as firebaseApp }

// Default export for the app
export default app;