'use client';

import { useState } from 'react';

export default function CheckSchemaPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSchema = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-schema');
      const data = await response.json();
      
      setResult(data);
      
      if (!data.success) {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check schema');
      console.error('Error checking schema:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Check Database Schema</h1>
      
      <div className="mb-6">
        <button
          onClick={checkSchema}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Checking...' : 'Check Database Schema'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && result.success && (
        <div className="bg-white border rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Database Schema Information</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Table Counts:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(result.counts).map(([table, data]: [string, any]) => (
                <div key={table} className="bg-gray-100 p-4 rounded">
                  <p className="font-semibold">{table}</p>
                  <p className="text-2xl">{data.count !== null ? data.count : 'Error'}</p>
                  {data.error && <p className="text-red-500 text-sm">{data.error}</p>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Table Details:</h3>
            {Object.entries(result.tables).map(([table, data]: [string, any]) => (
              <div key={table} className="mb-6 border-b pb-6">
                <h4 className="text-md font-semibold mb-2">{table}</h4>
                <p className="mb-2">
                  Status: <span className={data.exists ? "text-green-600" : "text-red-600"}>
                    {data.exists ? "Exists" : "Does not exist or error"}
                  </span>
                </p>
                
                {data.error && (
                  <div className="bg-red-50 p-2 rounded mb-3">
                    <p className="text-red-600 text-sm">{data.error}</p>
                  </div>
                )}
                
                <div className="mt-3">
                  <h5 className="font-medium mb-1">RLS Policies:</h5>
                  {data.policies && data.policies.length > 0 ? (
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(data.policies, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-yellow-600">No RLS policies found</p>
                  )}
                  
                  {data.policiesError && (
                    <p className="text-red-500 text-sm mt-1">{data.policiesError}</p>
                  )}
                </div>
                
                {data.sample && data.sample.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium mb-1">Sample Data:</h5>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(data.sample, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
