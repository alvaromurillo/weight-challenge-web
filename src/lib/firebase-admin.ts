/**
 * Firebase Admin SDK configuration for server-side operations
 * Following Firebase App Hosting best practices:
 * https://firebase.google.com/docs/app-hosting/firebase-sdks
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as path from 'path';

let adminAppInstance: App | undefined;
let adminAuthInstance: Auth | undefined;
let adminFirestoreInstance: Firestore | undefined;

/**
 * Initialize Firebase Admin SDK following App Hosting best practices
 * Uses automatic initialization when possible, falls back to service account
 */
function initializeAdminSDK(): App {
  if (adminAppInstance) {
    return adminAppInstance;
  }

  if (getApps().length === 0) {
    console.log('🔧 Initializing Firebase Admin SDK...');
    
    // Production: Use service account key from environment variables
    if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('📋 Using service account for production');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminAppInstance = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } 
    // App Hosting: Try automatic initialization first (recommended)
    else if (process.env.FIREBASE_CONFIG || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🚀 Using automatic initialization (App Hosting/Google Cloud)');
      try {
        // Use initializeApp() with no arguments for automatic configuration
        // This works in App Hosting, Cloud Run, App Engine, and Cloud Functions
        adminAppInstance = initializeApp();
        console.log('✅ Automatic initialization successful');
      } catch (error) {
        console.warn('⚠️ Automatic initialization failed, falling back to service account');
        throw error;
      }
    }
    // Development: Use service account key file as fallback
    else {
      console.log('🛠️ Using service account key file for development...');
      try {
        const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
        adminAppInstance = initializeApp({
          credential: cert(serviceAccountPath),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'weight-challenge-app-dev',
        });
        console.log('✅ Service account key file initialization successful');
      } catch (error) {
        console.error('❌ Failed to initialize Admin SDK:', error);
        throw new Error('Admin SDK initialization failed. Please ensure proper credentials are configured.');
      }
    }
    
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    adminAppInstance = getApps()[0];
    console.log('♻️ Using existing Firebase Admin app');
  }

  return adminAppInstance;
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    const app = initializeAdminSDK();
    adminAuthInstance = getAuth(app);
    console.log('🔐 Firebase Admin Auth initialized');
  }
  return adminAuthInstance;
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminFirestore(): Firestore {
  if (!adminFirestoreInstance) {
    const app = initializeAdminSDK();
    adminFirestoreInstance = getFirestore(app);
    console.log('🔥 Firebase Admin Firestore initialized');
  }
  return adminFirestoreInstance;
}

/**
 * Get Firebase Admin App instance
 */
export function getAdminApp(): App {
  return initializeAdminSDK();
}

// Export instances for convenience
export const adminAuth = getAdminAuth();
export const adminDb = getAdminFirestore();
export const adminApp = getAdminApp(); 