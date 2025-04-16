'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function ManualFixPage() {
  const [userIds, setUserIds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user IDs
  const fetchUserIds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a Supabase client
      const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Get all user IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, role, email')
        .order('role', { ascending: true });
      
      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }
      
      if (!profiles || profiles.length === 0) {
        throw new Error('No profiles found in the database');
      }
      
      setUserIds(profiles);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user IDs');
      console.error('Error fetching user IDs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manual Fix Guide for Order History Issues</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              This guide provides step-by-step instructions for manually fixing the order history issues in the database.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Step-by-Step Guide</h2>
          
          <ol className="list-decimal list-inside space-y-4">
            <li className="font-medium">Log in to the Supabase Dashboard</li>
            <div className="ml-6 text-sm text-gray-600">
              <p>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://app.supabase.com</a> and log in with your credentials.</p>
            </div>
            
            <li className="font-medium">Access your project</li>
            <div className="ml-6 text-sm text-gray-600">
              <p>Select the project for the etracking application.</p>
            </div>
            
            <li className="font-medium">Go to the Table Editor</li>
            <div className="ml-6 text-sm text-gray-600">
              <p>Click on "Table Editor" in the left sidebar.</p>
            </div>
            
            <li className="font-medium">Examine the order_history table</li>
            <div className="ml-6 text-sm text-gray-600">
              <p>Select the "order_history" table from the list.</p>
              <p>Look for entries with null "updated_by" values.</p>
            </div>
            
            <li className="font-medium">Update the order_history entries</li>
            <div className="ml-6 text-sm text-gray-600">
              <p>For each entry with a null "updated_by" value, click on the row to edit it.</p>
              <p>Set the "updated_by" field to a valid user ID (see the list below).</p>
              <p>Click "Save" to update the entry.</p>
            </div>
            
            <li className="font-medium">Verify the fix</li>
            <div className="ml-6 text-sm text-gray-600">
              <p>After updating all entries, refresh the table view.</p>
              <p>Verify that there are no more entries with null "updated_by" values.</p>
            </div>
            
            <li className="font-medium">Test order creation</li>
            <div className="ml-6 text-sm text-gray-600">
              <p>Go back to the application and try creating a new order.</p>
              <p>Verify that the order is created successfully and appears in the database.</p>
            </div>
          </ol>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Valid User IDs</h2>
              <button
                onClick={fetchUserIds}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Loading...' : 'Fetch User IDs'}
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            )}
            
            {userIds.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userIds.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'shop_owner' ? 'bg-green-100 text-green-800' :
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.name || user.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{user.id}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">Click the button above to fetch valid user IDs.</p>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">SQL Fix (Alternative)</h2>
            
            <p className="text-sm text-gray-600 mb-4">
              If you prefer to use SQL to fix the issue, you can use the SQL Fix tool to generate a script.
            </p>
            
            <a
              href="/sql-fix"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to SQL Fix Tool
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
