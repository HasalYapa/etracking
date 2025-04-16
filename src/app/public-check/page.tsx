'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

export default function PublicCheckPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState<'none' | 'success' | 'error'>('none');
  const [loginError, setLoginError] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>({});

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Check if we can connect to Supabase
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      addLog('Checking Supabase connection...');
      
      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Try a simple query to check connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        addLog(`Connection error: ${error.message}`);
        setDbStatus({ connected: false, error: error.message });
      } else {
        addLog('Successfully connected to Supabase');
        setDbStatus({ connected: true });
        
        // Check if already logged in
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          addLog(`Already logged in as ${sessionData.session.user.email}`);
          setLoginStatus('success');
          setUserData(sessionData.session.user);
          
          // Check database tables
          await checkTables(supabase, sessionData.session.user.id);
        }
      }
    } catch (error: any) {
      addLog(`Error checking connection: ${error.message}`);
      setDbStatus({ connected: false, error: error.message });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRunning) return;
    setIsRunning(true);
    setLoginStatus('none');
    setLoginError('');
    
    try {
      addLog(`Attempting to log in with email: ${email}`);
      
      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        addLog(`Login error: ${error.message}`);
        setLoginStatus('error');
        setLoginError(error.message);
      } else if (data.user) {
        addLog(`Successfully logged in as ${data.user.email}`);
        setLoginStatus('success');
        setUserData(data.user);
        
        // Check database tables
        await checkTables(supabase, data.user.id);
      }
    } catch (error: any) {
      addLog(`Error during login: ${error.message}`);
      setLoginStatus('error');
      setLoginError(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const checkTables = async (supabase: any, userId: string) => {
    try {
      addLog('Checking database tables...');
      
      // Check profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      setDbStatus(prev => ({
        ...prev,
        profiles: profilesError ? { error: profilesError.message } : { success: true }
      }));
      
      // Check orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', userId);
      
      setDbStatus(prev => ({
        ...prev,
        orders: ordersError 
          ? { error: ordersError.message } 
          : { success: true, count: orders?.length || 0 }
      }));
      
      if (!ordersError && orders) {
        addLog(`Found ${orders.length} orders for user ${userId}`);
      }
      
      // Check customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('count')
        .eq('shop_id', userId);
      
      setDbStatus(prev => ({
        ...prev,
        customers: customersError 
          ? { error: customersError.message } 
          : { success: true }
      }));
      
      // Check order_history
      const { data: history, error: historyError } = await supabase
        .from('order_history')
        .select('count')
        .limit(1);
      
      setDbStatus(prev => ({
        ...prev,
        order_history: historyError 
          ? { error: historyError.message } 
          : { success: true }
      }));
      
      addLog('Database tables check completed');
      
    } catch (error: any) {
      addLog(`Error checking tables: ${error.message}`);
    }
  };

  const createTestOrder = async () => {
    if (!userData || isRunning) return;
    
    setIsRunning(true);
    
    try {
      addLog('Creating test order...');
      
      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Create a test customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: 'Test Customer',
          phone: '123-456-7890',
          email: 'test@example.com',
          address: 'Test Address',
          shop_id: userData.id
        })
        .select()
        .single();
      
      if (customerError) {
        addLog(`Error creating customer: ${customerError.message}`);
        throw customerError;
      }
      
      addLog('Customer created successfully');
      
      // Generate a tracking number
      const trackingNumber = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Create a test order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          shop_id: userData.id,
          customer_id: customer.id,
          status: 'pending',
          delivery_address: 'Test Delivery Address',
          delivery_notes: 'Test order created from public check tool',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) {
        addLog(`Error creating order: ${orderError.message}`);
        throw orderError;
      }
      
      addLog('Order created successfully');
      
      // Create order history
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Test order created',
          created_at: new Date().toISOString(),
          updated_by: userData.id
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
          throw fallbackError;
        }
      }
      
      addLog('Order history created successfully');
      addLog('Test order creation completed');
      
      // Refresh orders count
      await checkTables(supabase, userData.id);
      
    } catch (error: any) {
      addLog(`Error creating test order: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const applyShopDashboardFix = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    
    try {
      addLog('Applying fix to shop dashboard...');
      
      const response = await fetch('/api/fix-shop-dashboard', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        addLog(`Error applying fix: ${errorData.error || 'Unknown error'}`);
        throw new Error(`Error applying fix: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      addLog(`Fix applied successfully: ${data.message}`);
      
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Public Database Check</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool helps diagnose issues with your shop dashboard by checking your database connection and data.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Database Connection</h2>
          
          {dbStatus.connected === true ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-green-700">
                <span className="font-bold">Connection Status:</span> Connected to Supabase
              </p>
            </div>
          ) : dbStatus.connected === false ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-red-700">
                <span className="font-bold">Connection Status:</span> Failed to connect
              </p>
              {dbStatus.error && (
                <p className="text-red-700 mt-2">
                  <span className="font-bold">Error:</span> {dbStatus.error}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-600">Checking connection...</p>
            </div>
          )}
          
          {dbStatus.connected && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Table Status:</h3>
              <ul className="space-y-2">
                {['profiles', 'orders', 'customers', 'order_history'].map(table => (
                  <li key={table} className="flex items-center">
                    <span className="w-32">{table}:</span>
                    {dbStatus[table]?.success ? (
                      <span className="text-green-600">
                        OK {dbStatus[table].count !== undefined && `(${dbStatus[table].count} records)`}
                      </span>
                    ) : dbStatus[table]?.error ? (
                      <span className="text-red-600">Error: {dbStatus[table].error}</span>
                    ) : (
                      <span className="text-gray-500">Not checked</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Authentication</h2>
          
          {loginStatus === 'success' ? (
            <div>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <p className="text-green-700">
                  <span className="font-bold">Logged in as:</span> {userData?.email}
                </p>
                <p className="text-green-700">
                  <span className="font-bold">User ID:</span> {userData?.id}
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={createTestOrder}
                  disabled={isRunning}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isRunning ? 'Working...' : 'Create Test Order'}
                </button>
                
                <button
                  onClick={applyShopDashboardFix}
                  disabled={isRunning}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
                >
                  {isRunning ? 'Working...' : 'Fix Shop Dashboard'}
                </button>
              </div>
              
              <div className="mt-4">
                <a 
                  href="/shop-dashboard" 
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Go to Shop Dashboard
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              {loginStatus === 'error' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <p className="text-red-700">
                    <span className="font-bold">Login Error:</span> {loginError}
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isRunning}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isRunning ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Debug Logs</h2>
          <div className="text-sm text-gray-500">
            {isRunning ? 'Running...' : 'Idle'}
          </div>
        </div>
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
      
      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Check if you can connect to the Supabase database</li>
          <li>Log in with your credentials</li>
          <li>Check if your tables have data</li>
          <li>Create a test order if needed</li>
          <li>Apply the fix to your shop dashboard</li>
          <li>Go to your shop dashboard to see if it works</li>
        </ol>
      </div>
    </div>
  );
}
