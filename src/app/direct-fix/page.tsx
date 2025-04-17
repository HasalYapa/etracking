'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DirectFixPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [shopFixApplied, setShopFixApplied] = useState(false);
  const [performanceFixApplied, setPerformanceFixApplied] = useState(false);

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    addLog('Shop Dashboard Fix Tool loaded');
    addLog('This tool fixes issues with the shop dashboard');
  }, []);

  const runDirectFix = async () => {
    setLoading(true);
    setError(null);
    addLog('Running direct database fix...');

    try {
      const response = await fetch('/api/direct-fix');
      const data = await response.json();

      setResult(data);

      if (!data.success) {
        addLog(`Error: ${data.error || 'Unknown error occurred'}`);
        setError(data.error || 'Unknown error occurred');
      } else {
        addLog('Direct database fix completed successfully');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message || 'Failed to run direct fix'}`);
      setError(err.message || 'Failed to run direct fix');
      console.error('Error running direct fix:', err);
    } finally {
      setLoading(false);
    }
  };

  const fixShopDashboard = async () => {
    try {
      setLoading(true);
      addLog('Applying fix to shop dashboard...');

      const response = await fetch('/api/fix-shop-dashboard', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        addLog(`Error applying fix: ${errorData.error || 'Unknown error'}`);
        setError(errorData.error || 'Unknown error');
      } else {
        const data = await response.json();
        addLog(`Fix applied successfully: ${data.message}`);
        setShopFixApplied(true);
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fixPerformance = async () => {
    try {
      setLoading(true);
      addLog('Applying performance fix...');

      const response = await fetch('/api/fix-shop-performance', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        addLog(`Error applying performance fix: ${errorData.error || 'Unknown error'}`);
        setError(errorData.error || 'Unknown error');
      } else {
        const data = await response.json();
        addLog(`Performance fix applied: ${data.message}`);
        data.actions?.forEach((action: string) => {
          addLog(`- ${action}`);
        });
        setPerformanceFixApplied(true);
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shop Dashboard Fix Tool</h1>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool fixes issues with your shop dashboard. It can help if your dashboard is loading slowly or not showing any orders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Available Fixes</h2>

          <div className="space-y-4">
            <div>
              <button
                onClick={fixShopDashboard}
                disabled={loading || shopFixApplied}
                className={`w-full px-4 py-2 text-white rounded ${shopFixApplied ? 'bg-green-600' : loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {shopFixApplied ? '✓ Shop Dashboard Fix Applied' : loading ? 'Applying...' : 'Fix Shop Dashboard'}
              </button>
              <p className="text-sm text-gray-500 mt-1">Fixes issues with data loading and display in the shop dashboard.</p>
            </div>

            <div>
              <button
                onClick={fixPerformance}
                disabled={loading || performanceFixApplied}
                className={`w-full px-4 py-2 text-white rounded ${performanceFixApplied ? 'bg-green-600' : loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {performanceFixApplied ? '✓ Performance Fix Applied' : loading ? 'Applying...' : 'Fix Performance Issues'}
              </button>
              <p className="text-sm text-gray-500 mt-1">Optimizes database queries and creates a test order if needed.</p>
            </div>

            <div>
              <button
                onClick={runDirectFix}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300"
              >
                {loading ? 'Running...' : 'Run Advanced Database Fix'}
              </button>
              <p className="text-sm text-gray-500 mt-1">Advanced fix that directly modifies the database. Use only as a last resort.</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/shop-dashboard"
                className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Go to Shop Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-100 p-3 rounded-lg h-60 overflow-y-auto text-xs font-mono">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          {result?.details && (
            <pre className="mt-2 text-sm overflow-auto max-h-40">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          )}
          {result?.sdkError && (
            <div className="mt-2">
              <p>SDK Error:</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(result.sdkError, null, 2)}
              </pre>
            </div>
          )}
          {result?.restError && (
            <div className="mt-2">
              <p>REST Error:</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {result.restError}
              </pre>
            </div>
          )}
        </div>
      )}

      {result && result.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Success!</p>
          <p>{result.message}</p>

          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Shop Owner Used for Fixing:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(result.shopOwner, null, 2)}
            </pre>

            <h2 className="text-lg font-semibold mt-4 mb-2">Test Order Created:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(result.order, null, 2)}
            </pre>

            <h2 className="text-lg font-semibold mt-4 mb-2">Order History Created:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(result.historyData, null, 2)}
            </pre>

            <h2 className="text-lg font-semibold mt-4 mb-2">Verified Order History:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(result.verifyHistory, null, 2)}
            </pre>

            {result.fixResults && result.fixResults.length > 0 && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Fix Results:</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.fixResults.map((item: any, index: number) => (
                    <div key={index} className={`p-4 rounded-lg ${
                      item.status === 'ok' ? 'bg-green-50 border border-green-200' :
                      item.status === 'fixed' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-red-50 border border-red-200'
                    }`}>
                      <p className="font-medium">Order ID: {item.order_id.substring(0, 8)}...</p>
                      <p className="text-sm mt-1">
                        Status: <span className={`font-medium ${
                          item.status === 'ok' ? 'text-green-600' :
                          item.status === 'fixed' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{item.status}</span>
                      </p>
                      {item.count !== undefined && (
                        <p className="text-sm">Entries: {item.count}</p>
                      )}
                      {item.error && (
                        <p className="text-sm text-red-600 mt-1">{item.error}</p>
                      )}
                      {item.history && (
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer">Show history</summary>
                          <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(item.history, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
