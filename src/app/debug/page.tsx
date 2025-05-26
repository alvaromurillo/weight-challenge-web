'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [browserInfo, setBrowserInfo] = useState<any>({});

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      setBrowserInfo({
        hostname: window.location.hostname,
        port: window.location.port,
        href: window.location.href,
      });
    }
  }, []);

  const envVars = {
    NEXT_PUBLIC_EMULATOR: process.env.NEXT_PUBLIC_EMULATOR,
    NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST,
    NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT,
    NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT_SET',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Debug - Variables de Entorno</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Estado del Emulador</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="border rounded p-3">
                <div className="font-mono text-sm text-gray-600">{key}</div>
                <div className={`font-mono text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                  {value || 'undefined'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🌐 Información del Navegador</h2>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Hostname:</span> {browserInfo.hostname || 'Loading...'}
            </div>
            <div>
              <span className="font-semibold">Port:</span> {browserInfo.port || 'Loading...'}
            </div>
            <div>
              <span className="font-semibold">URL:</span> {browserInfo.href || 'Loading...'}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="http://localhost:4000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔗 Abrir Emulator UI
          </a>
        </div>
      </div>
    </div>
  );
} 