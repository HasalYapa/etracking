'use client';

import { useState } from 'react';

export default function DirectFixPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDirectFix = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/direct-fix');
      const data = await response.json();
      
      setResult(data);
      
      if (!data.success) {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run direct fix');
      console.error('Error running direct fix:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Direct Database Fix</h1>
      
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This is a direct database fix tool that bypasses normal application logic. Use only as a last resort.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <button
          onClick={runDirectFix}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300"
        >
          {loading ? 'Running...' : 'Run Direct Database Fix'}
        </button>
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
