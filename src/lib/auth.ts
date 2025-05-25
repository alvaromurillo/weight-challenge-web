import {
  User,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  ActionCodeSettings,
} from 'firebase/auth';
import { auth } from './firebase';

// Action code settings for magic link - function to get dynamic URL
const getActionCodeSettings = (): ActionCodeSettings => {
  const url = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth-action`
    : typeof window !== 'undefined' 
      ? `${window.location.origin}/auth-action`
      : 'http://localhost:5002/auth-action'; // Default fallback for emulator
  
  return {
    url,
    handleCodeInApp: true,
  };
};

// Log the configuration for debugging
console.log('Auth actionCodeSettings:', getActionCodeSettings());

/**
 * Send a magic link to the user's email for authentication
 */
export const sendMagicLink = async (email: string): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }
  
  try {
    console.log('Sending magic link to:', email);
    console.log('Using actionCodeSettings:', getActionCodeSettings());
    await sendSignInLinkToEmail(auth, email, getActionCodeSettings());
    // Store email in localStorage for the sign-in process
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForSignIn', email);
      console.log('Email stored in localStorage for sign-in');
    }
  } catch (error) {
    console.error('Error sending magic link:', error);
    throw error;
  }
};

/**
 * Complete the sign-in process with the magic link
 */
export const signInWithMagicLink = async (url: string, email?: string): Promise<User> => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }
  
  try {
    console.log('Processing magic link URL:', url);
    console.log('Checking if URL is a magic link...');
    
    if (!isSignInWithEmailLink(auth, url)) {
      console.error('URL is not a valid magic link');
      throw new Error('Invalid magic link');
    }

    console.log('URL confirmed as valid magic link');

    // Get email from parameter or localStorage
    let userEmail = email;
    if (!userEmail && typeof window !== 'undefined') {
      userEmail = window.localStorage.getItem('emailForSignIn') || undefined;
      console.log('Retrieved email from localStorage:', userEmail);
    }

    console.log('Email for sign-in:', userEmail);
    if (!userEmail) {
      console.error('No email found for sign-in');
      throw new Error('Email not found. Please try signing in again.');
    }

    console.log('Attempting to sign in with email link...');
    const result = await signInWithEmailLink(auth, userEmail, url);
    console.log('Sign-in successful! User:', result.user.email);
    
    // Clear email from localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('emailForSignIn');
      console.log('Email cleared from localStorage');
    }

    return result.user;
  } catch (error) {
    console.error('Error signing in with magic link:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }
  
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = (): User | null => {
  if (!auth) {
    console.warn('Firebase Auth not initialized');
    return null;
  }
  return auth.currentUser;
};

/**
 * Subscribe to authentication state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log('🔐 onAuthStateChange: Setting up listener...');
  
  if (!auth) {
    console.warn('🔐 onAuthStateChange: Firebase Auth not initialized');
    // Call callback with null user immediately to prevent infinite loading
    setTimeout(() => {
      console.log('🔐 onAuthStateChange: Calling callback with null user (no auth)');
      callback(null);
    }, 100);
    return () => {}; // Return empty unsubscribe function
  }

  console.log('🔐 onAuthStateChange: Auth instance available, setting up onAuthStateChanged');
  console.log('🔐 onAuthStateChange: Current user before listener:', auth.currentUser?.email || 'No user');
  console.log('🔐 onAuthStateChange: Auth app name:', auth.app?.name);
  console.log('🔐 onAuthStateChange: Auth config:', auth.config);
  
  // Set up a fallback timeout to ensure callback is called
  let callbackCalled = false;
  const fallbackTimeout = setTimeout(() => {
    if (!callbackCalled && auth) {
      console.warn('🔐 onAuthStateChange: Fallback timeout - calling callback with current user');
      console.log('🔐 onAuthStateChange: Current user at timeout:', auth.currentUser?.email || 'No user');
      callbackCalled = true;
      callback(auth.currentUser);
    }
  }, 3000); // Increased to 3 seconds
  
  // Also set up an immediate check for current user
  setTimeout(() => {
    if (!callbackCalled && auth && auth.currentUser) {
      console.log('🔐 onAuthStateChange: Found existing user, calling callback immediately');
      callbackCalled = true;
      clearTimeout(fallbackTimeout);
      callback(auth.currentUser);
    }
  }, 500); // Check after 500ms
  
  try {
    console.log('🔐 onAuthStateChange: Setting up onAuthStateChanged listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!callbackCalled) {
        console.log('🔐 onAuthStateChanged: State change detected', {
          hasUser: !!user,
          email: user?.email,
          uid: user?.uid,
          timestamp: new Date().toISOString()
        });
        callbackCalled = true;
        clearTimeout(fallbackTimeout);
        callback(user);
      } else {
        console.log('🔐 onAuthStateChanged: State change detected but callback already called');
      }
    }, (error) => {
      console.error('🔐 onAuthStateChanged: Error in auth state listener:', error);
      if (!callbackCalled) {
        callbackCalled = true;
        clearTimeout(fallbackTimeout);
        // Call callback with null on error to prevent infinite loading
        callback(null);
      }
    });

    console.log('🔐 onAuthStateChange: Listener set up successfully');
    
    return () => {
      console.log('🔐 onAuthStateChange: Cleaning up listener');
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  } catch (error) {
    console.error('🔐 onAuthStateChange: Error setting up listener:', error);
    clearTimeout(fallbackTimeout);
    // Call callback with null on error to prevent infinite loading
    setTimeout(() => {
      if (!callbackCalled) {
        console.log('🔐 onAuthStateChange: Calling callback with null user (error)');
        callback(null);
      }
    }, 100);
    return () => {};
  }
};

/**
 * Check if the current URL is a magic link
 */
export const isMagicLink = (url: string): boolean => {
  if (!auth) {
    console.warn('Firebase Auth not initialized');
    return false;
  }
  return isSignInWithEmailLink(auth, url);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}; 