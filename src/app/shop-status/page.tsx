'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

export default function ShopStatusPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkRequests, setNetworkRequests] = useState<any[]>([]);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [shopDashboardCode, setShopDashboardCode] = useState<string | null>(null);

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      addLog('Starting shop dashboard status check...');
      
      // Step 1: Check authentication status
      addLog('Checking authentication status...');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        addLog(`Authentication error: ${authError.message}`);
        setAuthStatus({ status: 'error', error: authError.message });
      } else if (session) {
        addLog(`Authenticated as ${session.user.email}`);
        setAuthStatus({ 
          status: 'authenticated', 
          user: {
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || 'unknown'
          }
        });
        
        // Step 2: Check database status
        await checkDatabase(supabase, session.user.id);
      } else {
        addLog('Not authenticated');
        setAuthStatus({ status: 'not_authenticated' });
      }
      
      // Step 3: Check network requests
      addLog('Checking network requests...');
      try {
        const requests = [];
        
        // Test Supabase connection
        const startTime = Date.now();
        const { error: connError } = await supabase.from('profiles').select('count');
        const endTime = Date.now();
        
        requests.push({
          url: `${supabaseUrl}/rest/v1/profiles?select=count`,
          status: connError ? 'error' : 'success',
          duration: endTime - startTime,
          error: connError ? connError.message : null
        });
        
        // Test API endpoint
        const apiStartTime = Date.now();
        try {
          const apiResponse = await fetch('/api/create-test-order', { method: 'HEAD' });
          const apiEndTime = Date.now();
          
          requests.push({
            url: '/api/create-test-order',
            status: apiResponse.ok ? 'success' : 'error',
            statusCode: apiResponse.status,
            duration: apiEndTime - apiStartTime
          });
        } catch (apiErr: any) {
          requests.push({
            url: '/api/create-test-order',
            status: 'error',
            error: apiErr.message,
            duration: Date.now() - apiStartTime
          });
        }
        
        setNetworkRequests(requests);
        addLog(`Checked ${requests.length} network requests`);
      } catch (netErr: any) {
        addLog(`Error checking network requests: ${netErr.message}`);
      }
      
      // Step 4: Check shop dashboard code
      addLog('Checking shop dashboard code...');
      try {
        const response = await fetch('/shop-dashboard');
        if (response.ok) {
          const html = await response.text();
          
          // Extract just a small portion of the code for display
          const codeSnippet = html.substring(0, 500) + '...';
          setShopDashboardCode(codeSnippet);
          addLog('Retrieved shop dashboard code');
        } else {
          addLog(`Failed to retrieve shop dashboard code: ${response.status}`);
        }
      } catch (codeErr: any) {
        addLog(`Error retrieving shop dashboard code: ${codeErr.message}`);
      }
      
      addLog('Status check completed');
      
    } catch (err: any) {
      addLog(`Error in status check: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async (supabase: any, userId: string) => {
    try {
      addLog('Checking database status...');
      
      // Check orders table
      const { data: orders, error: ordersError, count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('shop_id', userId);
      
      // Check customers table
      const { data: customers, error: customersError, count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('shop_id', userId);
      
      // Check order history table
      const { data: history, error: historyError } = await supabase
        .from('order_history')
        .select('*')
        .limit(5);
      
      setDbStatus({
        orders: {
          count: ordersCount || (orders?.length || 0),
          error: ordersError ? ordersError.message : null,
          sample: orders?.slice(0, 3) || []
        },
        customers: {
          count: customersCount || (customers?.length || 0),
          error: customersError ? customersError.message : null
        },
        history: {
          count: history?.length || 0,
          error: historyError ? historyError.message : null
        }
      });
      
      addLog(`Found ${ordersCount || (orders?.length || 0)} orders for user ${userId}`);
      addLog(`Found ${customersCount || (customers?.length || 0)} customers for user ${userId}`);
      addLog(`Found ${history?.length || 0} order history entries`);
      
    } catch (err: any) {
      addLog(`Error checking database: ${err.message}`);
      setDbStatus({ error: err.message });
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      addLog('Creating test order via API...');
      
      const response = await fetch('/api/create-test-order');
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        const errorMessage = data.error || 'Failed to create test order';
        addLog(`API error: ${errorMessage}`);
        setError(errorMessage);
        return;
      }
      
      addLog(`Test order created successfully`);
      addLog(`Customer ID: ${data.customer.id}`);
      addLog(`Order ID: ${data.order.id}`);
      
      // Refresh status
      await checkStatus();
      
    } catch (err: any) {
      addLog(`Error creating test order: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shop Dashboard Status</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool checks the status of your shop dashboard and helps diagnose issues.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
          
          {authStatus ? (
            authStatus.status === 'authenticated' ? (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <p className="text-green-700">
                  <span className="font-bold">Logged in as:</span> {authStatus.user.email}
                </p>
                <p className="text-green-700">
                  <span className="font-bold">User ID:</span> {authStatus.user.id}
                </p>
                <p className="text-green-700">
                  <span className="font-bold">Role:</span> {authStatus.user.role}
                </p>
              </div>
            ) : authStatus.status === 'error' ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-700">
                  <span className="font-bold">Authentication Error:</span> {authStatus.error}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-700">
                  <span className="font-bold">Not logged in</span>
                </p>
                <Link 
                  href="/login" 
                  className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Go to Login
                </Link>
              </div>
            )
          ) : (
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Database Status</h2>
          
          {dbStatus ? (
            dbStatus.error ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-700">
                  <span className="font-bold">Database Error:</span> {dbStatus.error}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-32 font-medium">Orders:</div>
                  {dbStatus.orders.error ? (
                    <div className="text-red-600">Error: {dbStatus.orders.error}</div>
                  ) : (
                    <div className="text-green-600">{dbStatus.orders.count} records found</div>
                  )}
                </div>
                
                <div className="flex items-center">
                  <div className="w-32 font-medium">Customers:</div>
                  {dbStatus.customers.error ? (
                    <div className="text-red-600">Error: {dbStatus.customers.error}</div>
                  ) : (
                    <div className="text-green-600">{dbStatus.customers.count} records found</div>
                  )}
                </div>
                
                <div className="flex items-center">
                  <div className="w-32 font-medium">Order History:</div>
                  {dbStatus.history.error ? (
                    <div className="text-red-600">Error: {dbStatus.history.error}</div>
                  ) : (
                    <div className="text-green-600">{dbStatus.history.count} records found</div>
                  )}
                </div>
                
                {dbStatus.orders.count === 0 && (
                  <div className="mt-4">
                    <button
                      onClick={createTestOrder}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {loading ? 'Creating...' : 'Create Test Order'}
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-600">Checking database...</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Network Requests</h2>
          
          {networkRequests.length > 0 ? (
            <div className="space-y-4">
              {networkRequests.map((request, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg ${
                    request.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <p className="font-medium">{request.url}</p>
                  <div className="flex justify-between mt-1">
                    <span className={`text-sm ${
                      request.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {request.status === 'success' ? 'Success' : 'Error'}
                      {request.statusCode && ` (${request.statusCode})`}
                    </span>
                    <span className="text-sm text-gray-500">{request.duration}ms</span>
                  </div>
                  {request.error && (
                    <p className="text-sm text-red-600 mt-1">{request.error}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-600">Checking network requests...</p>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-100 p-3 rounded-lg h-60 overflow-y-auto text-xs font-mono">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Shop Dashboard Code</h2>
        
        {shopDashboardCode ? (
          <div className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
            <pre className="text-xs font-mono">{shopDashboardCode}</pre>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-gray-600">No code available</p>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/shop-dashboard" 
            className="block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Shop Dashboard
          </Link>
          
          <Link 
            href="/no-auth-fix" 
            className="block text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            No-Auth Fix Tool
          </Link>
          
          <Link 
            href="/login" 
            className="block text-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Login Page
          </Link>
        </div>
      </div>
    </div>
  );
}
