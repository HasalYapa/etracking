'use client';

import { useState } from 'react';

export default function AuthTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const runAuthTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      setResult(data);
      
      if (!data.success) {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run authentication test');
      console.error('Error running authentication test:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              This tool tests authentication and creates a test order history entry with the authenticated user ID.
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={runAuthTest} className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Running...' : 'Run Authentication Test'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          {result?.details && (
            <pre className="mt-2 text-sm overflow-auto max-h-40">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          )}
          {result?.userId && (
            <div className="mt-2">
              <p>User ID: {result.userId}</p>
              <p>History Data:</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(result.historyData, null, 2)}
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
            <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
            
            <div className="mb-4">
              <h3 className="font-medium mb-1">User:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-20">
                {JSON.stringify(result.data.user, null, 2)}
              </pre>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-1">Profile:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-20">
                {JSON.stringify(result.data.profile, null, 2)}
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
          </div>
        </div>
      )}
    </div>
  );
}
