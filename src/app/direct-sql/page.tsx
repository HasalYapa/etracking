'use client';

import { useState } from 'react';

export default function DirectSqlPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDirectSql = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/direct-sql');
      const data = await response.json();
      
      setResult(data);
      
      if (!data.success) {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run direct SQL test');
      console.error('Error running direct SQL test:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Direct SQL Test</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              This tool runs direct SQL commands to test database operations. It will create test data in your database.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <button
          onClick={runDirectSql}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Running...' : 'Run Direct SQL Test'}
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
          {result?.shopOwnerId && (
            <p className="mt-2">Shop Owner ID: {result.shopOwnerId}</p>
          )}
        </div>
      )}
      
      {result && result.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Success!</p>
          <p>{result.message}</p>
          
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
            
            <div className="mb-4">
              <h3 className="font-medium mb-1">Shop Owner:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-20">
                {JSON.stringify(result.data.shopOwner, null, 2)}
              </pre>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-1">Customer:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-20">
                {JSON.stringify(result.data.customer, null, 2)}
              </pre>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-1">Order:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-20">
                {JSON.stringify(result.data.order, null, 2)}
              </pre>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-1">Order History:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-20">
                {JSON.stringify(result.data.history, null, 2)}
              </pre>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-1">Verified Order History:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-20">
                {JSON.stringify(result.data.verifyHistory, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
