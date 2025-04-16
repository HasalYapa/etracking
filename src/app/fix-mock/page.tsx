'use client';

import { useState, useEffect } from 'react';

export default function FixMockPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [fixApplied, setFixApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Run automatically when the page loads
  useEffect(() => {
    applyFix();
  }, []);

  const applyFix = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setError(null);
    addLog('Starting shop dashboard fix...');
    
    try {
      // Call the API to apply the fix
      const response = await fetch('/api/fix-shop-dashboard', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Unknown error';
        addLog(`Error applying fix: ${errorMessage}`);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      addLog(`Fix applied successfully: ${data.message}`);
      setFixApplied(true);
      
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setError(error.message);
    } finally {
      setIsRunning(false);
      addLog('Fix process completed');
    }
  };

  const goToShopDashboard = () => {
    window.location.href = '/shop-dashboard';
  };

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const goToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Fix Mock Data in Shop Dashboard</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool automatically fixes your shop dashboard to use real data instead of mock data.
          No button clicks required - the fix is applied automatically when the page loads.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Fix Status</h2>
        
        {isRunning ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700">
              <span className="font-bold">Status:</span> Applying fix...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-red-700">
              <span className="font-bold">Error:</span> {error}
            </p>
          </div>
        ) : fixApplied ? (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <p className="text-green-700">
              <span className="font-bold">Success:</span> Fix applied successfully!
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-gray-600">Starting fix process...</p>
          </div>
        )}
        
        <div className="mt-4 flex space-x-4">
          <button
            onClick={goToShopDashboard}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={isRunning}
          >
            Go to Shop Dashboard
          </button>
          
          <button
            onClick={goToDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isRunning}
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={goToLogin}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            disabled={isRunning}
          >
            Go to Login
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Debug Logs</h2>
          <div className="text-sm text-gray-500">
            {isRunning ? 'Running...' : 'Completed'}
          </div>
        </div>
        <div className="bg-gray-100 p-3 rounded-lg h-40 overflow-y-auto text-xs font-mono">
          {logs.length === 0 ? (
            <p className="text-gray-500">Starting process...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">What This Tool Does</h2>
        <p className="mb-4">
          This tool modifies your shop dashboard code to use real data from your Supabase database instead of mock data.
          It specifically:
        </p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Replaces mock data loading with real Supabase queries</li>
          <li>Removes hardcoded mock data arrays</li>
          <li>Updates the order creation process to use Supabase</li>
        </ol>
        
        <div className="mt-4">
          <p className="font-medium">After the fix is applied:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to your shop dashboard to see if it works</li>
            <li>If you still don't see any orders, you may need to create some first</li>
            <li>You can create orders from the regular dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
