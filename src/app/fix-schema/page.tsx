'use client';

import { useState } from 'react';

export default function FixSchemaPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fixSchema = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/fix-schema');
      const data = await response.json();

      setResult(data);

      if (!data.success) {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fix schema');
      console.error('Error fixing schema:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Fix Database Schema Issues</h1>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Warning:</strong> This will attempt to fix schema issues in your database. Use with caution.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={fixSchema}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Fixing...' : 'Fix Schema Issues'}
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
          <p>Schema check and fix completed.</p>

          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Fix Results:</h2>
            <p className="mb-2">Entries fixed: {result.fixResults.entriesFixed}</p>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40 text-sm">
              {JSON.stringify(result.fixResults.details, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
