'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function DataVerifyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setUserData(user);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (customersError) throw customersError;
      setCustomers(customersData || []);

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch order history
      const { data: historyData, error: historyError } = await supabase
        .from('order_history')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (historyError) throw historyError;
      setOrderHistory(historyData || []);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Create a test customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: 'Test Customer',
          phone: '123-456-7890',
          email: 'test@example.com',
          address: 'Test Address',
          shop_id: user.id
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Generate a tracking number
      const trackingNumber = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;

      // Create a test order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          shop_id: user.id,
          customer_id: customer.id,
          status: 'pending',
          delivery_address: 'Test Delivery Address',
          delivery_notes: 'Test order created from data verification tool',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order history
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
        // Try with a hardcoded shop owner ID if the first attempt fails
        const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59'; // Sampath
        
        const { error: fallbackError } = await supabase
          .from('order_history')
          .insert({
            order_id: order.id,
            status: 'pending',
            notes: 'Test order created (fallback)',
            created_at: new Date().toISOString(),
            updated_by: shopOwnerId
          });
          
        if (fallbackError) throw fallbackError;
      }

      // Refresh data
      await fetchData();

      alert('Test order created successfully!');
    } catch (err: any) {
      console.error('Error creating test order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data: any[], title: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700">No {title.toLowerCase()} found in the database.</p>
        </div>
      );
    }

    const columns = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th 
                  key={column}
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map(column => (
                  <td key={`${rowIndex}-${column}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Data Verification Tool</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool helps you verify what data is actually in your Supabase database and compare it with what's being displayed in the dashboard.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Current User</h2>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {userData ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userData.id}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userData.email}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userData.user_metadata?.role || 'Not specified'}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <p className="text-yellow-700">No user data available. Are you logged in?</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Database Data</h2>
          <button
            onClick={createTestOrder}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? 'Creating...' : 'Create Test Order'}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg mt-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('orders')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'customers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Customers ({customers.length})
              </button>
              <button
                onClick={() => setActiveTab('profiles')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'profiles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profiles ({profiles.length})
              </button>
              <button
                onClick={() => setActiveTab('orderHistory')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'orderHistory'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Order History ({orderHistory.length})
              </button>
            </nav>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <>
                {activeTab === 'orders' && (
                  <>
                    <h3 className="text-lg font-medium mb-4">Orders</h3>
                    {renderTable(orders, 'Orders')}
                  </>
                )}
                {activeTab === 'customers' && (
                  <>
                    <h3 className="text-lg font-medium mb-4">Customers</h3>
                    {renderTable(customers, 'Customers')}
                  </>
                )}
                {activeTab === 'profiles' && (
                  <>
                    <h3 className="text-lg font-medium mb-4">Profiles</h3>
                    {renderTable(profiles, 'Profiles')}
                  </>
                )}
                {activeTab === 'orderHistory' && (
                  <>
                    <h3 className="text-lg font-medium mb-4">Order History</h3>
                    {renderTable(orderHistory, 'Order History')}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Check if there are any orders in the database (Orders tab)</li>
          <li>Verify that the orders are associated with your user ID (shop_id should match your User ID)</li>
          <li>Check if the customers exist and are properly linked to orders</li>
          <li>Verify that order history entries exist for each order</li>
          <li>Try creating a test order using the "Create Test Order" button</li>
          <li>After creating a test order, go back to the dashboard and refresh the page</li>
          <li>If the test order appears, the issue might be with how you're creating orders manually</li>
          <li>If the test order doesn't appear, there might be an issue with the dashboard's data fetching</li>
        </ol>
      </div>
    </div>
  );
}
