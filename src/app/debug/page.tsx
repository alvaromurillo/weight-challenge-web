'use client';

import { useEffect, useState } from 'react';
import { auth, db, functions, storage } from '@/lib/firebase';

const DebugPage = () => {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [output, setOutput] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');

  const handleTestFunction = async (func: (input?: any) => Promise<any>) => {
    setOutput('Loading...');
    try {
      const result = await func(inputValue);
      setOutput(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setOutput(`Error: ${error.message}\n${error.stack}`);
    }
  };

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: any = {
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_USE_FIREBASE_EMULATOR: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING: process.env.NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING,
        },
        firebase: {
          auth: {
            initialized: !!auth,
            currentUser: auth?.currentUser?.email || 'No user',
            config: auth?.config || 'No config',
          },
          firestore: {
            initialized: !!db,
            app: db?.app?.name || 'No app',
          },
          functions: {
            initialized: !!functions,
            app: functions?.app?.name || 'No app',
          },
          storage: {
            initialized: !!storage,
            app: storage?.app?.name || 'No app',
          },
        },
        window: {
          location: typeof window !== 'undefined' ? window.location.href : 'SSR',
          localStorage: typeof window !== 'undefined' ? {
            emailForSignIn: window.localStorage.getItem('emailForSignIn'),
          } : 'SSR',
        },
      };

      // Test Firestore connection
      if (db) {
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const testCollection = collection(db, 'test');
          await getDocs(testCollection);
          results.firebase.firestore.connectionTest = 'SUCCESS';
        } catch (error: any) {
          results.firebase.firestore.connectionTest = `ERROR: ${error.message}`;
        }
      }

      // Test Auth state
      if (auth) {
        try {
          const { onAuthStateChanged } = await import('firebase/auth');
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            results.firebase.auth.stateListener = user ? `User: ${user.email}` : 'No user';
            setDiagnostics({ ...results });
            unsubscribe();
          });
        } catch (error: any) {
          results.firebase.auth.stateListener = `ERROR: ${error.message}`;
        }
      }

      setDiagnostics(results);
    };

    runDiagnostics();
  }, []);

  // Example functions to test (replace with actual debug functions)
  const testGetCurrentUser = async () => {
    // ... existing code ...
  };

  const testCreateMembership = async (userId?: any) => {
    if (!userId) throw new Error('User ID is required for createMembership');
    // This would typically call a serverless function or API endpoint
    // ... existing code ...
  };

  const testGetMembership = async (userId?: any) => {
    if (!userId) throw new Error('User ID is required for getMembership');
    // This would typically call a serverless function or API endpoint
    // ... existing code ...
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Firebase Diagnostics</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(diagnostics, null, 2)}
        </pre>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
        
        <div className="space-y-2">
          <div className="p-2 border rounded">
            <strong>Auth Status:</strong> {auth ? '✅ Initialized' : '❌ Not Initialized'}
          </div>
          
          <div className="p-2 border rounded">
            <strong>Firestore Status:</strong> {db ? '✅ Initialized' : '❌ Not Initialized'}
          </div>
          
          <div className="p-2 border rounded">
            <strong>Functions Status:</strong> {functions ? '✅ Initialized' : '❌ Not Initialized'}
          </div>
          
          <div className="p-2 border rounded">
            <strong>Storage Status:</strong> {storage ? '✅ Initialized' : '❌ Not Initialized'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage; 