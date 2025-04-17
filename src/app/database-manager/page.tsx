'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DatabaseManagerPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  const fetchDatabaseStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/database-setup');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get database status');
      }
      
      setStatus(result);
    } catch (err: any) {
      console.error('Error fetching database status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addForeignKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      setActionResult(null);
      
      const response = await fetch('/api/database-setup?action=add-foreign-keys');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add foreign keys');
      }
      
      setActionResult(result);
      
      // Refresh database status
      fetchDatabaseStatus();
    } catch (err: any) {
      console.error('Error adding foreign keys:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testRelationships = async () => {
    try {
      setLoading(true);
      setError(null);
      setTestResults(null);
      
      const response = await fetch('/api/database-setup?action=test-relationships');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to test relationships');
      }
      
      setTestResults(result.relationships);
    } catch (err: any) {
      console.error('Error testing relationships:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Database Manager</h1>
            <div className="flex space-x-4">
              <Link 
                href="/supabase-analyzer" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Supabase Analyzer
              </Link>
              <Link 
                href="/diagnostic" 
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Diagnostic Tool
              </Link>
              <Link 
                href="/" 
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            This tool helps manage your database schema and fix relationship issues.
          </p>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Database Status */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Database Status</h2>
            
            {loading && !status ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : status ? (
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">Tables:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {status.tables.map((table: string) => (
                    <div key={table} className="bg-white p-2 rounded-md text-sm">
                      {table}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={fetchDatabaseStatus}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">No database status available.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Database Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Database Actions</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">1. Add Foreign Key Constraints</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action will add explicit foreign key constraints to your database tables.
                  This helps Supabase understand the relationships between tables.
                </p>
                
                <button
                  onClick={addForeignKeys}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Adding...' : 'Add Foreign Keys'}
                </button>
                
                {actionResult && (
                  <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">{actionResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">2. Test Relationships</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action will test the relationships between tables by running queries that join tables.
                </p>
                
                <button
                  onClick={testRelationships}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Testing...' : 'Test Relationships'}
                </button>
                
                {testResults && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Test Results:</h4>
                    
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-md border border-gray-200">
                        <h5 className="font-medium text-gray-700 mb-2">Orders with Customers:</h5>
                        {testResults.ordersWithCustomers.error ? (
                          <div className="bg-red-50 p-3 rounded-md text-sm text-red-700">
                            Error: {testResults.ordersWithCustomers.error.message}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded-md max-h-60 overflow-y-auto">
                              {JSON.stringify(testResults.ordersWithCustomers.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white p-4 rounded-md border border-gray-200">
                        <h5 className="font-medium text-gray-700 mb-2">Orders with Profiles (Shop & Driver):</h5>
                        {testResults.ordersWithProfiles.error ? (
                          <div className="bg-red-50 p-3 rounded-md text-sm text-red-700">
                            Error: {testResults.ordersWithProfiles.error.message}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded-md max-h-60 overflow-y-auto">
                              {JSON.stringify(testResults.ordersWithProfiles.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Recommendations</h2>
            
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <h3 className="font-medium mb-1">1. Fix Foreign Key Relationships</h3>
                <p>
                  Add explicit foreign key constraints to your database tables to help Supabase understand the relationships.
                  Use the "Add Foreign Keys" button above to do this automatically.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">2. Use Explicit Joins</h3>
                <p>
                  Even with foreign keys, it's a good practice to use explicit foreign key filters in your queries:
                </p>
                <pre className="bg-blue-100 p-2 rounded-md mt-1">
                  <code className="text-xs font-mono">
{`.from('orders')
  .select('*, customers:customers(*)')
  .eq('customer_id', '00000000-0000-0000-0000-000000000000')`}
                  </code>
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">3. Check RLS Policies</h3>
                <p>
                  Make sure your Row Level Security policies allow proper access to related tables.
                  You might need to create policies that allow access to related records.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">4. Use UUID Format</h3>
                <p>
                  When querying with UUID fields, make sure to use the proper UUID format:
                </p>
                <pre className="bg-blue-100 p-2 rounded-md mt-1">
                  <code className="text-xs font-mono">
{`.eq('id', '00000000-0000-0000-0000-000000000000')`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
