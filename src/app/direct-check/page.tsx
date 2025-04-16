'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

export default function DirectCheckPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>({});

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Run all checks automatically when the page loads
  useEffect(() => {
    runAllChecks();
  }, []);

  const runAllChecks = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLogs([]);
    setResults({});
    
    addLog('Starting direct database check...');
    
    try {
      // Create Supabase client
      addLog('Creating Supabase client...');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      addLog('Supabase client created successfully');
      
      // Check authentication
      addLog('Checking authentication...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        addLog(`Authentication error: ${authError.message}`);
        setResults(prev => ({ ...prev, auth: { success: false, error: authError.message } }));
      } else if (!authData.session) {
        addLog('No active session found. You need to log in.');
        setResults(prev => ({ ...prev, auth: { success: false, error: 'No active session' } }));
      } else {
        addLog(`Authenticated as ${authData.session.user.email}`);
        setResults(prev => ({ 
          ...prev, 
          auth: { 
            success: true, 
            user: {
              id: authData.session.user.id,
              email: authData.session.user.email,
              role: authData.session.user.user_metadata?.role || 'unknown'
            }
          } 
        }));
        
        // Check profiles table
        await checkTable(supabase, 'profiles', authData.session.user.id);
        
        // Check orders table
        await checkTable(supabase, 'orders', authData.session.user.id);
        
        // Check customers table
        await checkTable(supabase, 'customers', authData.session.user.id);
        
        // Check order_history table
        await checkTable(supabase, 'order_history', authData.session.user.id);
        
        // Create a test order if no orders exist
        if (results.orders && results.orders.count === 0) {
          await createTestOrder(supabase, authData.session.user.id);
        }
      }
    } catch (error: any) {
      addLog(`Unexpected error: ${error.message}`);
      setResults(prev => ({ ...prev, error: error.message }));
    } finally {
      setIsRunning(false);
      addLog('Direct database check completed');
    }
  };

  const checkTable = async (supabase: any, tableName: string, userId: string) => {
    addLog(`Checking ${tableName} table...`);
    
    try {
      let query = supabase.from(tableName).select('*');
      
      // Add filters for user-specific tables
      if (tableName === 'orders' || tableName === 'customers') {
        query = query.eq('shop_id', userId);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        addLog(`Error querying ${tableName}: ${error.message}`);
        setResults(prev => ({ ...prev, [tableName]: { success: false, error: error.message } }));
      } else {
        const recordCount = data?.length || 0;
        addLog(`Found ${recordCount} records in ${tableName}`);
        setResults(prev => ({ 
          ...prev, 
          [tableName]: { 
            success: true, 
            count: recordCount,
            sample: data?.slice(0, 3) || []
          } 
        }));
      }
    } catch (error: any) {
      addLog(`Error checking ${tableName}: ${error.message}`);
      setResults(prev => ({ ...prev, [tableName]: { success: false, error: error.message } }));
    }
  };

  const createTestOrder = async (supabase: any, userId: string) => {
    addLog('No orders found. Creating a test order...');
    
    try {
      // Create a test customer
      addLog('Creating test customer...');
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: 'Test Customer',
          phone: '123-456-7890',
          email: 'test@example.com',
          address: 'Test Address',
          shop_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (customerError) {
        addLog(`Error creating customer: ${customerError.message}`);
        return;
      }
      
      addLog('Test customer created successfully');
      
      // Generate a tracking number
      const trackingNumber = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Create a test order
      addLog('Creating test order...');
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          shop_id: userId,
          customer_id: customer.id,
          status: 'pending',
          delivery_address: 'Test Delivery Address',
          delivery_notes: 'Test order created by direct check tool',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) {
        addLog(`Error creating order: ${orderError.message}`);
        return;
      }
      
      addLog('Test order created successfully');
      
      // Create order history
      addLog('Creating order history...');
      
      // Try with user ID first
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Test order created',
          created_at: new Date().toISOString(),
          updated_by: userId
        });
      
      if (historyError) {
        addLog(`Error creating order history: ${historyError.message}`);
        
        // Try with a hardcoded shop owner ID
        const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59'; // Sampath
        
        addLog('Trying with hardcoded shop owner ID...');
        
        const { error: fallbackError } = await supabase
          .from('order_history')
          .insert({
            order_id: order.id,
            status: 'pending',
            notes: 'Test order created (fallback)',
            created_at: new Date().toISOString(),
            updated_by: shopOwnerId
          });
          
        if (fallbackError) {
          addLog(`Error creating order history with fallback: ${fallbackError.message}`);
          return;
        }
      }
      
      addLog('Order history created successfully');
      addLog('Test order creation completed successfully');
      
      // Update results
      setResults(prev => ({ 
        ...prev, 
        testOrder: { 
          success: true, 
          order: order,
          customer: customer
        } 
      }));
      
      // Refresh orders count
      await checkTable(supabase, 'orders', userId);
      
    } catch (error: any) {
      addLog(`Error creating test order: ${error.message}`);
      setResults(prev => ({ ...prev, testOrder: { success: false, error: error.message } }));
    }
  };

  const loginRedirect = () => {
    window.location.href = '/login';
  };

  const dashboardRedirect = () => {
    window.location.href = '/dashboard';
  };

  const shopDashboardRedirect = () => {
    window.location.href = '/shop-dashboard';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Direct Database Check</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool directly checks your Supabase database and automatically creates a test order if needed.
          No button clicks required - everything runs automatically when the page loads.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
          {results.auth ? (
            results.auth.success ? (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <p className="text-green-700">
                  <span className="font-bold">Logged in as:</span> {results.auth.user.email}
                </p>
                <p className="text-green-700">
                  <span className="font-bold">User ID:</span> {results.auth.user.id}
                </p>
                <p className="text-green-700">
                  <span className="font-bold">Role:</span> {results.auth.user.role}
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-700">
                  <span className="font-bold">Not logged in:</span> {results.auth.error}
                </p>
                <button
                  onClick={loginRedirect}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Go to Login Page
                </button>
              </div>
            )
          ) : (
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Database Tables</h2>
          <div className="space-y-2">
            {['profiles', 'orders', 'customers', 'order_history'].map(table => (
              <div key={table} className="flex items-center">
                <div className="w-32 font-medium">{table}:</div>
                {results[table] ? (
                  results[table].success ? (
                    <div className="text-green-600">
                      {results[table].count} records found
                    </div>
                  ) : (
                    <div className="text-red-600">
                      Error: {results[table].error}
                    </div>
                  )
                ) : (
                  <div className="text-gray-500">Checking...</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Order</h2>
        {results.testOrder ? (
          results.testOrder.success ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-green-700">
                <span className="font-bold">Test order created successfully!</span>
              </p>
              <p className="text-green-700">
                <span className="font-bold">Tracking Number:</span> {results.testOrder.order.tracking_number}
              </p>
              <p className="text-green-700">
                <span className="font-bold">Customer:</span> {results.testOrder.customer.name}
              </p>
              <div className="mt-4">
                <button
                  onClick={dashboardRedirect}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={shopDashboardRedirect}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Go to Shop Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-red-700">
                <span className="font-bold">Error creating test order:</span> {results.testOrder.error}
              </p>
            </div>
          )
        ) : results.orders && results.orders.count > 0 ? (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-blue-700">
              You already have {results.orders.count} orders in the database. No test order needed.
            </p>
            <div className="mt-4">
              <button
                onClick={dashboardRedirect}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
              >
                Go to Dashboard
              </button>
              <button
                onClick={shopDashboardRedirect}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Go to Shop Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-gray-600">Checking if test order is needed...</p>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Debug Logs</h2>
          <div className="text-sm text-gray-500">
            {isRunning ? 'Running checks...' : 'Checks completed'}
          </div>
        </div>
        <div className="bg-gray-100 p-3 rounded-lg h-60 overflow-y-auto text-xs font-mono">
          {logs.length === 0 ? (
            <p className="text-gray-500">Starting checks...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
      
      {results.orders && results.orders.sample && results.orders.sample.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Sample Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.orders.sample.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.tracking_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
