'use client';

import { useState } from 'react';

export default function FixOrderHistoryPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fixOrderHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fix-order-history');
      const data = await response.json();
      
      setResult(data);
      
      if (!data.success) {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fix order history');
      console.error('Error fixing order history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Fix Order History</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Warning:</strong> This tool will fix order history entries with null updated_by values and create a test order. Use with caution.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <button
          onClick={fixOrderHistory}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Fixing...' : 'Fix Order History'}
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
            
            {result.testOrder && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Test Order Created:</h2>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(result.testOrder, null, 2)}
                </pre>
              </div>
            )}
            
            {result.testHistory && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Test Order History Created:</h2>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(result.testHistory, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">Fix Results:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.results.map((item: any, index: number) => (
                  <div key={index} className={`p-4 rounded-lg ${
                    item.status === 'ok' ? 'bg-green-50 border border-green-200' :
                    item.status === 'fixed' ? 'bg-yellow-50 border border-yellow-200' :
                    item.status === 'created' ? 'bg-blue-50 border border-blue-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <p className="font-medium">{item.tracking_number}</p>
                    <p className="text-sm text-gray-600">Order ID: {item.order_id.substring(0, 8)}...</p>
                    <p className="text-sm mt-1">
                      Status: <span className={`font-medium ${
                        item.status === 'ok' ? 'text-green-600' :
                        item.status === 'fixed' ? 'text-yellow-600' :
                        item.status === 'created' ? 'text-blue-600' :
                        'text-red-600'
                      }`}>{item.status}</span>
                    </p>
                    {item.count !== undefined && (
                      <p className="text-sm">Entries: {item.count}</p>
                    )}
                    {item.error && (
                      <p className="text-sm text-red-600 mt-1">{item.error}</p>
                    )}
                    {item.details && item.details.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer">Show details</summary>
                        <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(item.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
