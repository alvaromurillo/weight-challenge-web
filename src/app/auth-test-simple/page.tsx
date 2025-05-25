'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AuthTestSimplePage() {
  const [authState, setAuthState] = useState({
    loading: true,
    user: null as any,
    error: null as string | null,
    logs: [] as string[]
  });
  const router = useRouter();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAuthState(prev => ({
      ...prev,
      logs: [...prev.logs, `[${timestamp}] ${message}`]
    }));
  };

  useEffect(() => {
    addLog('Component mounted');
    addLog(`Auth instance: ${auth ? 'Available' : 'Not available'}`);
    
    if (!auth) {
      addLog('ERROR: Firebase Auth not initialized');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Firebase Auth not initialized'
      }));
      return;
    }

    addLog('Setting up onAuthStateChanged listener...');
    
    try {
      const unsubscribe = onAuthStateChanged(auth, 
        (user) => {
          addLog(`Auth state changed: ${user ? `User ${user.email}` : 'No user'}`);
          setAuthState(prev => ({
            ...prev,
            loading: false,
            user: user,
            error: null
          }));
        },
        (error) => {
          addLog(`Auth error: ${error.message}`);
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: error.message
          }));
        }
      );

      addLog('Listener set up successfully');

      // Cleanup
      return () => {
        addLog('Cleaning up listener');
        unsubscribe();
      };
    } catch (error: any) {
      addLog(`Error setting up listener: ${error.message}`);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Simple Auth Test</h1>
      
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Auth State</h2>
          <div className="space-y-2">
            <div>
              <strong>Loading:</strong> {authState.loading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>User:</strong> {authState.user ? authState.user.email : 'None'}
            </div>
            <div>
              <strong>Error:</strong> {authState.error || 'None'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Logs</h2>
          <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
            {authState.logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 