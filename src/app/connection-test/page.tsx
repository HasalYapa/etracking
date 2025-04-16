'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function ConnectionTestPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [supabaseUrl, setSupabaseUrl] = useState('https://slujerwtublzuxtzdtyw.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Get the Supabase key from localStorage if available
    const savedKey = localStorage.getItem('supabase_anon_key');
    if (savedKey) {
      setSupabaseKey(savedKey);
      runTests(savedKey);
    }
  }, []);

  const addResult = (test: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => [...prev, { test, status, message, details, timestamp: new Date().toISOString() }]);
  };

  const runTests = async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      setTestResults([]);
      
      // Save the key to localStorage for future use
      localStorage.setItem('supabase_anon_key', key);

      // Test 1: Create Supabase client
      try {
        addResult('Create Supabase Client', 'success', 'Successfully created Supabase client');
        
        const supabase = createClient(supabaseUrl, key);
        
        // Test 2: Check authentication
        try {
          const { data: authData, error: authError } = await supabase.auth.getSession();
          
          if (authError) {
            addResult('Authentication Check', 'error', 'Failed to get session', authError);
          } else if (!authData.session) {
            addResult('Authentication Check', 'error', 'No active session found. You might need to log in again.');
          } else {
            addResult('Authentication Check', 'success', 'Active session found', {
              user_id: authData.session.user.id,
              email: authData.session.user.email,
              expires_at: new Date(authData.session.expires_at * 1000).toISOString()
            });
            
            // Test 3: Fetch profiles
            try {
              const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .limit(5);
              
              if (profilesError) {
                addResult('Fetch Profiles', 'error', 'Failed to fetch profiles', profilesError);
              } else {
                addResult('Fetch Profiles', 'success', `Successfully fetched ${profilesData.length} profiles`, 
                  profilesData.map(p => ({ id: p.id, name: p.name, role: p.role })));
              }
            } catch (profilesErr: any) {
              addResult('Fetch Profiles', 'error', 'Exception when fetching profiles', profilesErr.message);
            }
            
            // Test 4: Fetch orders
            try {
              const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .limit(5);
              
              if (ordersError) {
                addResult('Fetch Orders', 'error', 'Failed to fetch orders', ordersError);
              } else {
                addResult('Fetch Orders', 'success', `Successfully fetched ${ordersData.length} orders`, 
                  ordersData.map(o => ({ id: o.id, tracking_number: o.tracking_number, status: o.status })));
              }
            } catch (ordersErr: any) {
              addResult('Fetch Orders', 'error', 'Exception when fetching orders', ordersErr.message);
            }
            
            // Test 5: Fetch customers
            try {
              const { data: customersData, error: customersError } = await supabase
                .from('customers')
                .select('*')
                .limit(5);
              
              if (customersError) {
                addResult('Fetch Customers', 'error', 'Failed to fetch customers', customersError);
              } else {
                addResult('Fetch Customers', 'success', `Successfully fetched ${customersData.length} customers`, 
                  customersData.map(c => ({ id: c.id, name: c.name, phone: c.phone })));
              }
            } catch (customersErr: any) {
              addResult('Fetch Customers', 'error', 'Exception when fetching customers', customersErr.message);
            }
            
            // Test 6: Fetch order history
            try {
              const { data: historyData, error: historyError } = await supabase
                .from('order_history')
                .select('*')
                .limit(5);
              
              if (historyError) {
                addResult('Fetch Order History', 'error', 'Failed to fetch order history', historyError);
              } else {
                addResult('Fetch Order History', 'success', `Successfully fetched ${historyData.length} order history entries`, 
                  historyData.map(h => ({ id: h.id, order_id: h.order_id, status: h.status })));
              }
            } catch (historyErr: any) {
              addResult('Fetch Order History', 'error', 'Exception when fetching order history', historyErr.message);
            }
            
            // Test 7: Check RLS policies by trying to fetch another user's orders
            try {
              // First, get the current user's ID
              const userId = authData.session.user.id;
              
              // Try to fetch orders with a different shop_id
              const { data: otherOrdersData, error: otherOrdersError } = await supabase
                .from('orders')
                .select('*')
                .neq('shop_id', userId)
                .limit(5);
              
              if (otherOrdersError) {
                if (otherOrdersError.code === 'PGRST116') {
                  addResult('RLS Policy Check', 'success', 'RLS policies are correctly preventing access to other users\' data');
                } else {
                  addResult('RLS Policy Check', 'error', 'Error when testing RLS policies', otherOrdersError);
                }
              } else if (otherOrdersData.length > 0) {
                addResult('RLS Policy Check', 'error', 'RLS policies may not be properly configured. You can see other users\' orders.', 
                  { count: otherOrdersData.length });
              } else {
                addResult('RLS Policy Check', 'success', 'No other users\' orders were returned');
              }
            } catch (rlsErr: any) {
              addResult('RLS Policy Check', 'error', 'Exception when checking RLS policies', rlsErr.message);
            }
          }
        } catch (authErr: any) {
          addResult('Authentication Check', 'error', 'Exception when checking authentication', authErr.message);
        }
      } catch (clientErr: any) {
        addResult('Create Supabase Client', 'error', 'Failed to create Supabase client', clientErr.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runTests(supabaseKey);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool tests your connection to Supabase and helps diagnose issues with data fetching.
        </p>
      </div>

      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Connection Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="supabaseUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Supabase URL
            </label>
            <input
              type="text"
              id="supabaseUrl"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="supabaseKey" className="block text-sm font-medium text-gray-700 mb-1">
              Supabase Anon Key
            </label>
            <div className="flex">
              <input
                type={showKey ? "text" : "password"}
                id="supabaseKey"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-md bg-gray-50"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              This is your public anon key from Supabase. It will be saved in your browser for convenience.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Running Tests..." : "Run Connection Tests"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests have been run yet. Enter your Supabase anon key and click "Run Connection Tests".</p>
        ) : (
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg ${
                  result.status === 'success' ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'
                }`}
              >
                <div className="flex justify-between">
                  <h3 className={`font-medium ${result.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {result.test}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className={`mt-1 ${result.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message}
                </p>
                {result.details && (
                  <div className="mt-2">
                    <details>
                      <summary className="text-sm cursor-pointer">Details</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Common Issues and Solutions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-800">Authentication Issues</h3>
            <p className="text-gray-600">If you see "No active session found", you need to log in again. Your session may have expired.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">RLS Policy Issues</h3>
            <p className="text-gray-600">If RLS policy checks fail, your database security rules might not be properly configured.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Empty Data</h3>
            <p className="text-gray-600">If tests succeed but return empty arrays, you might not have any data in your tables.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Connection Timeout</h3>
            <p className="text-gray-600">If tests take too long or fail with timeout errors, there might be network issues or Supabase might be experiencing downtime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
