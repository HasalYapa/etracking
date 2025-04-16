'use client';

import { useState } from 'react';

export default function CreateTestCustomerPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTestCustomer = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/create-test-customer');
      const data = await response.json();
      
      setResult(data);
      
      if (!data.success) {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create test customer');
      console.error('Error creating test customer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create Test Customer</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              This tool creates a test customer in the database. Use this before creating orders to ensure a valid customer exists.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <button
          onClick={createTestCustomer}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Creating...' : 'Create Test Customer'}
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
            <h2 className="text-lg font-semibold mb-2">Created Customer:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(result.customer, null, 2)}
            </pre>
            
            <h2 className="text-lg font-semibold mt-4 mb-2">Shop Owner:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(result.shopOwner, null, 2)}
            </pre>
            
            <h2 className="text-lg font-semibold mt-4 mb-2">Recent Customers:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result.allCustomers, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
