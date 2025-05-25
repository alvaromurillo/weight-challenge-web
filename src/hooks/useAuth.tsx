'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, signOut, sendMagicLink, signInWithMagicLink } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithMagicLink: (url: string, email?: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔐 AuthProvider: Setting up auth state listener...');
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('🔐 AuthProvider: Auth loading timeout reached');
        setError('Authentication timeout - please refresh the page');
        setLoading(false);
      }
    }, 8000); // 8 second timeout

    try {
      const unsubscribe = onAuthStateChange((user) => {
        console.log('🔐 AuthProvider: Auth state changed:', user ? `User: ${user.email}` : 'No user');
        setUser(user);
        setLoading(false);
        setError(null);
        clearTimeout(timeout); // Clear timeout on successful auth state change
      });

      return () => {
        console.log('🔐 AuthProvider: Cleaning up auth listener');
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (error) {
      console.error('🔐 AuthProvider: Error setting up auth listener:', error);
      setError(`Auth setup failed: ${error}`);
      setLoading(false);
      clearTimeout(timeout);
    }
  }, [loading]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signOut,
    sendMagicLink,
    signInWithMagicLink,
  };

  console.log('🔐 AuthProvider: Render state', { 
    hasUser: !!user, 
    loading, 
    error,
    userEmail: user?.email 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking if user is authenticated
export function useRequireAuth() {
  const { user, loading, error } = useAuth();
  
  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
  };
} 