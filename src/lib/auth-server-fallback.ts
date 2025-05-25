import { cookies, headers } from 'next/headers';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Verify Firebase ID token using Firebase REST API
 * This is a fallback when Firebase Admin SDK is not available
 */
async function verifyIdTokenWithRestAPI(idToken: string): Promise<AuthUser | null> {
  try {
    console.log('verifyIdTokenWithRestAPI: Starting REST API token verification');
    
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    if (!apiKey) {
      console.error('verifyIdTokenWithRestAPI: Firebase API key not found');
      return null;
    }

    // Use Firebase Auth REST API to verify the token
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: idToken,
      }),
    });

    if (!response.ok) {
      console.error('verifyIdTokenWithRestAPI: Firebase REST API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data.users || data.users.length === 0) {
      console.error('verifyIdTokenWithRestAPI: No user found in token');
      return null;
    }

    const user = data.users[0];
    console.log('verifyIdTokenWithRestAPI: Token verified successfully for user:', user.localId);

    return {
      uid: user.localId,
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoUrl || null,
    };
  } catch (error) {
    console.error('verifyIdTokenWithRestAPI: Error verifying token:', error);
    return null;
  }
}

/**
 * Get the current user using fallback authentication
 */
export async function getCurrentUserFallback(): Promise<AuthUser | null> {
  try {
    console.log('getCurrentUserFallback: Starting authentication check');
    
    // Get the authorization header
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    console.log('getCurrentUserFallback: Authorization header present:', !!authorization);
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('getCurrentUserFallback: No valid authorization header, checking cookies');
      // Try to get token from cookies as fallback
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session');
      
      if (!sessionCookie?.value) {
        console.log('getCurrentUserFallback: No session cookie found');
        return null;
      }
      
      console.log('getCurrentUserFallback: Found session cookie, but fallback doesn\'t support session cookies');
      return null;
    }

    const token = authorization.split('Bearer ')[1];
    console.log('getCurrentUserFallback: Found Bearer token, verifying with REST API');
    return await verifyIdTokenWithRestAPI(token);
  } catch (error) {
    console.error('getCurrentUserFallback: Error getting current user:', error);
    return null;
  }
}

/**
 * Check if a user is authenticated using fallback method
 */
export async function isAuthenticatedFallback(): Promise<boolean> {
  const user = await getCurrentUserFallback();
  return user !== null;
}

/**
 * Require authentication using fallback method
 */
export async function requireAuthFallback(): Promise<AuthUser> {
  const user = await getCurrentUserFallback();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
} 