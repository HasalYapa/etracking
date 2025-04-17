'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreatePolicyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const createPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setResult(null);
      
      const response = await fetch('/api/create-driver-policy');
      const data = await response.json();
      
      setResult(data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create policy');
      }
      
      setSuccess('Policy created successfully!');
    } catch (err: any) {
      console.error('Error creating policy:', err);
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
            <h1 className="text-2xl font-bold text-gray-900">Create Driver Policy</h1>
            <div className="flex space-x-4">
              <Link 
                href="/rls-manager" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                RLS Manager
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
            This page creates a policy that allows drivers to create order history entries.
          </p>
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
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
          
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <button
              onClick={createPolicy}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Creating Policy...' : 'Create Driver Order History Policy'}
            </button>
          </div>
          
          {result && (
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h3 className="text-md font-medium text-gray-800 mb-2">API Response</h3>
              <pre className="text-xs text-gray-700 overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
          
          <div className="mt-8 bg-blue-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Policy Details</h2>
            
            <div className="space-y-3 text-sm text-blue-800">
              <p>
                This page creates the following policy:
              </p>
              
              <div className="bg-white p-3 rounded-md border border-blue-200">
                <pre className="text-xs overflow-x-auto">
{`CREATE POLICY "drivers_can_create_any_order_history" 
ON "order_history" 
FOR INSERT TO authenticated 
USING (true) 
WITH CHECK (true);`}
                </pre>
              </div>
              
              <p>
                This policy allows any authenticated user to create order history entries,
                which is necessary for the driver dashboard to function correctly.
              </p>
              
              <p>
                After creating this policy, you should be able to scan QR codes in the
                driver dashboard without encountering RLS policy violations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
