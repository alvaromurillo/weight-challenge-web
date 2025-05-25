'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function TestAuthPage() {
  const { user, loading, error } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog('TestAuthPage mounted');
    addLog(`Initial state - loading: ${loading}, user: ${user?.email || 'null'}, error: ${error || 'null'}`);
  }, [loading, user?.email, error]);

  useEffect(() => {
    addLog(`Auth state changed - loading: ${loading}, user: ${user?.email || 'null'}, error: ${error || 'null'}`);
  }, [user, loading, error]);

  const handleLogin = async () => {
    // ... existing code ...
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Auth Test Page</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="space-y-2">
            <div className="p-2 border rounded">
              <strong>Loading:</strong> {loading ? '✅ True' : '❌ False'}
            </div>
            <div className="p-2 border rounded">
              <strong>User:</strong> {user ? `✅ ${user.email}` : '❌ No user'}
            </div>
            <div className="p-2 border rounded">
              <strong>Error:</strong> {error ? `❌ ${error}` : '✅ No error'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Auth Logs</h2>
          <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
          <Button 
            onClick={() => setLogs([])} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Clear Logs
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-x-2">
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          <Button variant="outline" onClick={() => addLog('Manual log entry')}>
            Add Test Log
          </Button>
        </div>
      </div>
    </div>
  );
} 