import React from 'react';

function getAuthEmulatorHost() {
  // we can access these variables
  // because they are prefixed with "NEXT_PUBLIC_"
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
  const port = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || '9099';
  return ['http://', host, ':', port].join('');
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function isEmulatorMode() {
  return process.env.NEXT_PUBLIC_EMULATOR === 'true' || 
         (isBrowser() && window.location.hostname === 'localhost');
}

export default function FirebaseAuthProvider({
  children,
}: React.PropsWithChildren) {
  
  // Log emulator configuration for debugging
  if (isBrowser()) {
    console.log('🔧 Emulator Mode:', isEmulatorMode());
    console.log('🔧 Auth Emulator Host:', getAuthEmulatorHost());
    console.log('🔧 Environment Variables:', {
      NEXT_PUBLIC_EMULATOR: process.env.NEXT_PUBLIC_EMULATOR,
      NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST,
      NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT,
    });
  }

  return (
    <>
      {children}
    </>
  );
} 