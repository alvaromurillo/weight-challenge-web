import { cookies, headers } from 'next/headers';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK (only if not already initialized)
// For development, we'll skip admin initialization since we don't have service account credentials
// In production, you would properly initialize Firebase Admin SDK here

// Firebase Admin SDK imports
let adminApp: any = null;
let adminAuth: any = null;

// Initialize Firebase Admin SDK
async function initializeFirebaseAdmin() {
  // ONLY initialize if a specific ENV var signals it\'s safe and intended.
  // This is to prevent unintended execution during Next.js build phases.
  if (process.env.ALLOW_SERVER_AUTH_INIT !== 'true') {
    console.warn(`Firebase Admin SDK: ALLOW_SERVER_AUTH_INIT is not 'true'. Skipping full initialization in auth-server.ts. NEXT_PHASE: ${process.env.NEXT_PHASE}, NODE_ENV: ${process.env.NODE_ENV}`);
    return { app: null, auth: null };
  }

  if (adminApp) return { app: adminApp, auth: adminAuth };

  try {
    console.log('Firebase Admin SDK: Proceeding with full initialization because ALLOW_SERVER_AUTH_INIT is true.');
    // Dynamic import to avoid issues with server-side rendering
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    // Check if app is already initialized
    if (getApps().length > 0) {
      adminApp = getApps()[0];
      adminAuth = getAuth(adminApp);
      console.log('Firebase Admin SDK: Using existing app');
      return { app: adminApp, auth: adminAuth };
    }

    // Get project ID from environment
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'weight-challenge-app-dev';
    
    console.log('Firebase Admin SDK: Initializing with project ID:', projectId);
    console.log('Firebase Admin SDK: Service account key available:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('Firebase Admin SDK: Environment:', process.env.NODE_ENV);
    console.log('Firebase Admin SDK: FIREBASE_CONFIG available:', !!process.env.FIREBASE_CONFIG);
    console.log('Firebase Admin SDK: NEXT_PHASE:', process.env.NEXT_PHASE);
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Production: Use service account key
      console.log('Firebase Admin SDK: Using service account credentials');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
      });
    } else {
      // Use Application Default Credentials (works in Firebase App Hosting)
      console.log('Firebase Admin SDK: Using Application Default Credentials');
      adminApp = initializeApp({
        projectId: projectId,
      });
    }

    adminAuth = getAuth(adminApp);
    console.log('Firebase Admin SDK: Successfully initialized');
    return { app: adminApp, auth: adminAuth };
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK (ALLOW_SERVER_AUTH_INIT was true):', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
      nodeEnv: process.env.NODE_ENV,
      nextPhase: process.env.NEXT_PHASE
    });
    // If initialization fails during build, ensure we return nulls to avoid breaking build further
    // No longer need PHASE_PRODUCTION_BUILD check here as the top check is primary
    return { app: null, auth: null }; // Default return null on error
  }
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Get the current user from server-side context
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log('getCurrentUser: Starting authentication check');
    
    // Get the authorization header
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    console.log('getCurrentUser: Authorization header present:', !!authorization);
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('getCurrentUser: No valid authorization header, checking cookies');
      // Try to get token from cookies as fallback
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session');
      
      if (!sessionCookie?.value) {
        console.log('getCurrentUser: No session cookie found');
        return null;
      }
      
      console.log('getCurrentUser: Found session cookie, verifying');
      return await verifySessionCookie(sessionCookie.value);
    }

    const token = authorization.split('Bearer ')[1];
    console.log('getCurrentUser: Found Bearer token, verifying');
    return await verifyAuthToken(token);
  } catch (error) {
    console.error('Error getting current user on server:', error);
    return null;
  }
}

/**
 * Verify a Firebase Auth token on the server
 */
export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    console.log('verifyAuthToken: Starting token verification');
    
    const { auth } = await initializeFirebaseAdmin();
    
    if (!auth) {
      console.error('verifyAuthToken: Firebase Admin Auth not initialized');
      return null;
    }

    console.log('verifyAuthToken: Verifying ID token with Firebase Admin SDK');
    const decodedToken = await auth.verifyIdToken(token);
    
    console.log('verifyAuthToken: Token verified successfully for user:', decodedToken.uid);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      displayName: decodedToken.name || null,
      photoURL: decodedToken.picture || null,
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    console.error('Token verification error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * Verify a session cookie
 */
export async function verifySessionCookie(sessionCookie: string): Promise<AuthUser | null> {
  try {
    console.log('verifySessionCookie: Starting session cookie verification');
    
    const { auth } = await initializeFirebaseAdmin();
    
    if (!auth) {
      console.error('verifySessionCookie: Firebase Admin Auth not initialized');
      return null;
    }

    console.log('verifySessionCookie: Verifying session cookie with Firebase Admin SDK');
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    console.log('verifySessionCookie: Session cookie verified successfully for user:', decodedClaims.uid);
    
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || null,
      displayName: decodedClaims.name || null,
      photoURL: decodedClaims.picture || null,
    };
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    console.error('Session cookie verification error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * Check if a user is authenticated on the server
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Require authentication for a server component
 * Throws an error if user is not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Create a session cookie from an ID token
 */
export async function createSessionCookie(idToken: string, expiresIn: number = 60 * 60 * 24 * 5 * 1000): Promise<string> {
  const { auth } = await initializeFirebaseAdmin();
  
  if (!auth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  return await auth.createSessionCookie(idToken, { expiresIn });
} 