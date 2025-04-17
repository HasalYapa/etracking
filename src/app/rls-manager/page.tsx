'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RlsManagerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('order_history');
  const [tables, setTables] = useState<string[]>(['profiles', 'customers', 'orders', 'order_history']);
  const [policyName, setPolicyName] = useState<string>('');
  const [policyDefinition, setPolicyDefinition] = useState<string>('');

  useEffect(() => {
    listPolicies();
  }, [selectedTable]);

  const listPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/manage-rls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list_policies',
          table: selectedTable,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to list policies');
      }
      
      setPolicies(data.policies || []);
    } catch (err: any) {
      console.error('Error listing policies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!policyName.trim()) {
        throw new Error('Policy name is required');
      }
      
      if (!policyDefinition.trim()) {
        throw new Error('Policy definition is required');
      }
      
      const response = await fetch('/api/manage-rls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_policy',
          table: selectedTable,
          policyName,
          policyDefinition,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create policy');
      }
      
      setSuccess(`Policy "${policyName}" created successfully`);
      setPolicyName('');
      setPolicyDefinition('');
      
      // Refresh the policies list
      listPolicies();
    } catch (err: any) {
      console.error('Error creating policy:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dropPolicy = async (policyName: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/manage-rls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'drop_policy',
          table: selectedTable,
          policyName,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to drop policy');
      }
      
      setSuccess(`Policy "${policyName}" dropped successfully`);
      
      // Refresh the policies list
      listPolicies();
    } catch (err: any) {
      console.error('Error dropping policy:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createDriverOrderHistoryPolicy = async () => {
    setPolicyName('drivers_can_create_any_order_history');
    setPolicyDefinition(`FOR INSERT TO authenticated USING (true) WITH CHECK (true)`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">RLS Policy Manager</h1>
            <div className="flex space-x-4">
              <Link 
                href="/trigger-manager" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Trigger Manager
              </Link>
              <Link 
                href="/schema-check" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Schema Check
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
            This page allows you to manage Row Level Security (RLS) policies for your database tables.
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Table
            </label>
            <div className="flex space-x-2">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
              <button
                onClick={listPolicies}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'List Policies'}
              </button>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Existing Policies for {selectedTable}</h2>
            
            {policies.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-md text-gray-500">
                No policies found for this table.
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Command</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Using Expression</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">With Check</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {policies.map((policy: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{policy.policyname}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{policy.cmd}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{policy.roles?.join(', ')}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{policy.qual}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{policy.with_check}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => dropPolicy(policy.policyname)}
                            className="px-3 py-1 text-xs font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            Drop
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Policy</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Name
              </label>
              <input
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="e.g., allow_select_for_authenticated"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Definition
              </label>
              <textarea
                value={policyDefinition}
                onChange={(e) => setPolicyDefinition(e.target.value)}
                placeholder="e.g., FOR SELECT TO authenticated USING (auth.uid() = user_id)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
              />
            </div>
            
            <div className="flex justify-between">
              <div>
                <button
                  onClick={createDriverOrderHistoryPolicy}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mr-2"
                >
                  Create Driver Order History Policy
                </button>
              </div>
              <button
                onClick={createPolicy}
                disabled={loading || !policyName.trim() || !policyDefinition.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </div>
          
          <div className="mt-8 bg-blue-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Common Policy Examples</h2>
            
            <div className="space-y-3 text-sm text-blue-800">
              <div className="bg-white p-3 rounded-md border border-blue-200">
                <p className="font-medium mb-1">Allow authenticated users to select their own data:</p>
                <pre className="text-xs overflow-x-auto">FOR SELECT TO authenticated USING (auth.uid() = user_id)</pre>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-blue-200">
                <p className="font-medium mb-1">Allow authenticated users to insert their own data:</p>
                <pre className="text-xs overflow-x-auto">FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)</pre>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-blue-200">
                <p className="font-medium mb-1">Allow authenticated users to update their own data:</p>
                <pre className="text-xs overflow-x-auto">FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)</pre>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-blue-200">
                <p className="font-medium mb-1">Allow authenticated users to delete their own data:</p>
                <pre className="text-xs overflow-x-auto">FOR DELETE TO authenticated USING (auth.uid() = user_id)</pre>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-blue-200">
                <p className="font-medium mb-1">Allow drivers to create order history for any order:</p>
                <pre className="text-xs overflow-x-auto">FOR INSERT TO authenticated USING (true) WITH CHECK (true)</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
