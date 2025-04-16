'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Create a Supabase client
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ShopDebugPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: 'Test Customer',
    customer_phone: '123-456-7890',
    customer_email: 'test@example.com',
    customer_address: 'Test Address',
    delivery_address: 'Test Delivery Address',
    items: 'Test Items'
  });

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      addLog('Checking authentication...');
      setLoading(true);
      
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        addLog(`Auth error: ${authError.message}`);
        throw authError;
      }
      
      if (!session) {
        addLog('No active session found');
        setError('You are not logged in. Please log in to view your shop dashboard.');
        setLoading(false);
        return;
      }
      
      addLog(`Authenticated as ${session.user.email}`);
      setUser(session.user);
      
      // Check if user is a shop owner
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        addLog(`Profile error: ${profileError.message}`);
        throw profileError;
      }
      
      addLog(`Profile loaded: ${JSON.stringify(profileData)}`);
      
      if (profileData.role !== 'shop_owner') {
        addLog(`User is not a shop owner (role: ${profileData.role})`);
        setError('Access denied. This dashboard is for shop owners only.');
        setLoading(false);
        return;
      }
      
      // Fetch raw data directly
      fetchRawData(session.user.id);
      
    } catch (err: any) {
      addLog(`Error in checkAuth: ${err.message}`);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchRawData = async (userId: string) => {
    try {
      addLog('Fetching raw data from Supabase...');
      
      // 1. Check orders table
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', userId);
      
      if (ordersError) {
        addLog(`Orders error: ${ordersError.message}`);
        throw ordersError;
      }
      
      addLog(`Found ${ordersData?.length || 0} orders for user ${userId}`);
      
      // 2. Check customers table
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', userId);
      
      if (customersError) {
        addLog(`Customers error: ${customersError.message}`);
        throw customersError;
      }
      
      addLog(`Found ${customersData?.length || 0} customers for user ${userId}`);
      
      // 3. Check order history
      const { data: historyData, error: historyError } = await supabase
        .from('order_history')
        .select('*')
        .limit(10);
      
      if (historyError) {
        addLog(`History error: ${historyError.message}`);
        throw historyError;
      }
      
      addLog(`Found ${historyData?.length || 0} order history entries`);
      
      // Set raw data
      setRawData({
        orders: ordersData || [],
        customers: customersData || [],
        history: historyData || []
      });
      
      setLoading(false);
      addLog('Raw data fetched successfully');
      
    } catch (err: any) {
      addLog(`Error fetching raw data: ${err.message}`);
      setError(err.message);
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      if (!user) {
        throw new Error('You must be logged in to create an order');
      }
      
      addLog('Creating test order...');
      setLoading(true);
      
      // Create a test customer
      addLog('Creating customer...');
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: newOrder.customer_name,
          phone: newOrder.customer_phone,
          email: newOrder.customer_email,
          address: newOrder.customer_address,
          shop_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (customerError) {
        addLog(`Customer error: ${customerError.message}`);
        throw customerError;
      }
      
      addLog(`Customer created with ID: ${customer.id}`);
      
      // Generate a tracking number
      const trackingNumber = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Create a test order
      addLog('Creating order...');
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          shop_id: user.id,
          customer_id: customer.id,
          status: 'pending',
          delivery_address: newOrder.delivery_address,
          delivery_notes: newOrder.items,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) {
        addLog(`Order error: ${orderError.message}`);
        throw orderError;
      }
      
      addLog(`Order created with ID: ${order.id}`);
      
      // Create order history
      addLog('Creating order history...');
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Test order created',
          created_at: new Date().toISOString(),
          updated_by: user.id
        });
      
      if (historyError) {
        addLog(`History error: ${historyError.message}`);
        
        // Try with a hardcoded shop owner ID if the first attempt fails
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
          addLog(`Fallback history error: ${fallbackError.message}`);
          throw fallbackError;
        }
      }
      
      addLog('Order history created successfully');
      
      // Refresh data
      fetchRawData(user.id);
      
      // Hide form
      setShowCreateForm(false);
      
    } catch (err: any) {
      addLog(`Error creating test order: ${err.message}`);
      setError(err.message);
      setLoading(false);
    }
  };

  const fixShopDashboard = async () => {
    try {
      addLog('Applying fix to shop dashboard...');
      setLoading(true);
      
      const response = await fetch('/api/fix-shop-dashboard', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        addLog(`Error applying fix: ${errorData.error || 'Unknown error'}`);
        throw new Error(errorData.error || 'Unknown error');
      }
      
      const data = await response.json();
      addLog(`Fix applied successfully: ${data.message}`);
      
      setLoading(false);
      
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shop Dashboard Debug Tool</h1>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.email}</span>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool helps diagnose issues with your shop dashboard by directly accessing your Supabase database.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : user ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Database Status</h2>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-32 font-medium">Orders:</div>
                <div className="text-green-600">
                  {rawData?.orders?.length || 0} records found
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-32 font-medium">Customers:</div>
                <div className="text-green-600">
                  {rawData?.customers?.length || 0} records found
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-32 font-medium">Order History:</div>
                <div className="text-green-600">
                  {rawData?.history?.length || 0} records found
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {showCreateForm ? 'Hide Form' : 'Create Test Order'}
              </button>
              
              <button
                onClick={fixShopDashboard}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Fix Shop Dashboard
              </button>
              
              <Link href="/shop-dashboard" className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Go to Shop Dashboard
              </Link>
            </div>
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
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">Please log in to use the debug tool.</p>
          <Link href="/login" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      )}
      
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Test Order</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            createTestOrder();
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={newOrder.customer_name}
                  onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  value={newOrder.customer_phone}
                  onChange={(e) => setNewOrder({...newOrder, customer_phone: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={newOrder.customer_email}
                  onChange={(e) => setNewOrder({...newOrder, customer_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Address
                </label>
                <input
                  type="text"
                  value={newOrder.customer_address}
                  onChange={(e) => setNewOrder({...newOrder, customer_address: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address
              </label>
              <input
                type="text"
                value={newOrder.delivery_address}
                onChange={(e) => setNewOrder({...newOrder, delivery_address: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items
              </label>
              <textarea
                value={newOrder.items}
                onChange={(e) => setNewOrder({...newOrder, items: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Order
              </button>
            </div>
          </form>
        </div>
      )}
      
      {rawData && rawData.orders && rawData.orders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Raw Orders Data</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rawData.orders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.tracking_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer_id}</td>
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
