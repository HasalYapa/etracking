'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Create a Supabase client
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  },
});

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_orders: 0,
    total_shops: 0,
    total_drivers: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    async function getSession() {
      try {
        setLoading(true);

        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          setError('No active session. Please log in.');
          return;
        }

        console.log('Session found:', session);
        setUser(session.user);

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Error fetching profile. Please try again.');
          return;
        } else {
          console.log('Profile fetched:', profileData);
          setProfile(profileData);

          // Verify this is an admin
          if (profileData.role !== 'admin') {
            setError('Access denied. This dashboard is for administrators only.');
            return;
          }

          // Load admin data
          await loadAdminData();
        }
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    getSession();
  }, []);

  const loadAdminData = async () => {
    try {
      // In a real implementation, we would fetch data from Supabase
      // For now, we'll use mock data

      // This would be the actual queries in production:
      // const { data: usersData, error: usersError } = await supabase
      //   .from('profiles')
      //   .select('*');
      //
      // const { data: ordersData, error: ordersError } = await supabase
      //   .from('orders')
      //   .select('*, shop:profiles!shop_id(*), driver:profiles!driver_id(*)');

      // Mock users with real IDs
      const mockUsers = [
        {
          id: 'e630fa7d-50dc-40c9-bbe5-5791d465c83f',
          name: 'Admin User',
          email: 'admin@etracking.store',
          role: 'admin',
          created_at: new Date().toISOString()
        },
        {
          id: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59',
          name: 'Sampath',
          email: 'sampathyt1973@gmail.com',
          role: 'shop_owner',
          business_name: 'Sampath Shop',
          created_at: new Date().toISOString()
        },
        {
          id: '74622a48-0f62-43a1-a330-e82ac4f4e34d',
          name: 'Chenitha',
          email: 'dimanthayapa2001@outlook.com',
          role: 'shop_owner',
          business_name: 'Chenitha Shop',
          created_at: new Date().toISOString()
        },
        {
          id: '35fbcf81-5f57-4267-a7af-9d52602761d1',
          name: 'Dimantha Yapa',
          email: 'dimanthayapa2001@gmail.com',
          role: 'driver',
          created_at: new Date().toISOString()
        },
        {
          id: '9155a1e2-84d0-44ec-8174-f27f8b9cc03e',
          name: 'Driver User',
          email: 'driver@etracking.store',
          role: 'driver',
          created_at: new Date().toISOString()
        }
      ];

      setUsers(mockUsers);

      // Mock orders with shop_id and driver_id
      const mockOrders = [
        {
          id: '1',
          tracking_number: 'TRK12345',
          shop_id: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59', // Sampath's ID
          shop: {
            name: 'Sampath',
            email: 'sampathyt1973@gmail.com',
            business_name: 'Sampath Shop'
          },
          customer: { name: 'John Doe', phone: '123-456-7890' },
          delivery_address: '123 Main St, City',
          items: 'Laptop, Mouse',
          status: 'pending',
          driver_id: null,
          driver: null,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          tracking_number: 'TRK67890',
          shop_id: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59', // Sampath's ID
          shop: {
            name: 'Sampath',
            email: 'sampathyt1973@gmail.com',
            business_name: 'Sampath Shop'
          },
          customer: { name: 'Jane Smith', phone: '987-654-3210' },
          delivery_address: '456 Oak Ave, Town',
          items: 'Headphones, Keyboard',
          status: 'assigned',
          driver_id: '35fbcf81-5f57-4267-a7af-9d52602761d1', // Dimantha's ID
          driver: { name: 'Dimantha Yapa', email: 'dimanthayapa2001@gmail.com' },
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          tracking_number: 'TRK24680',
          shop_id: '74622a48-0f62-43a1-a330-e82ac4f4e34d', // Chenitha's ID
          shop: {
            name: 'Chenitha',
            email: 'dimanthayapa2001@outlook.com',
            business_name: 'Chenitha Shop'
          },
          customer: { name: 'Bob Johnson', phone: '555-123-4567' },
          delivery_address: '789 Pine St, Village',
          items: 'Monitor, Speakers',
          status: 'in_transit',
          driver_id: '9155a1e2-84d0-44ec-8174-f27f8b9cc03e', // Driver User's ID
          driver: { name: 'Driver User', email: 'driver@etracking.store' },
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          tracking_number: 'TRK13579',
          shop_id: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59', // Sampath's ID
          shop: {
            name: 'Sampath',
            email: 'sampathyt1973@gmail.com',
            business_name: 'Sampath Shop'
          },
          customer: { name: 'Alice Brown', phone: '555-987-6543' },
          delivery_address: '321 Elm St, County',
          items: 'Printer, Scanner',
          status: 'delivered',
          driver_id: '35fbcf81-5f57-4267-a7af-9d52602761d1', // Dimantha's ID
          driver: { name: 'Dimantha Yapa', email: 'dimanthayapa2001@gmail.com' },
          created_at: new Date().toISOString()
        }
      ];

      setOrders(mockOrders);

      // Calculate stats
      setStats({
        total_users: mockUsers.length,
        total_orders: mockOrders.length,
        total_shops: mockUsers.filter(user => user.role === 'shop_owner').length,
        total_drivers: mockUsers.filter(user => user.role === 'driver').length
      });
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/admin-login';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Admin Dashboard
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Authentication Error
            </p>
          </div>

          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>

          <div className="mt-8">
            <Link href="/admin-login" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {profile?.name || user?.user_metadata?.name || 'Admin'}</span>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Orders
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-xl font-bold mb-6">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-800 text-sm font-medium">Total Users</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total_users}</h3>
                      </div>
                      <div className="bg-purple-200 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-800 text-sm font-medium">Total Orders</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total_orders}</h3>
                      </div>
                      <div className="bg-blue-200 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-800 text-sm font-medium">Shop Owners</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total_shops}</h3>
                      </div>
                      <div className="bg-green-200 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-800 text-sm font-medium">Drivers</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total_drivers}</h3>
                      </div>
                      <div className="bg-yellow-200 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Recent Orders</h3>
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tracking #
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Shop
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.slice(0, 5).map((order) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.tracking_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.shop?.business_name || order.shop?.name}
                              <br />
                              <span className="text-xs">{order.shop?.email}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.customer?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'assigned' || order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'}`}>
                                {order.status === 'pending' ? 'Pending' :
                                  order.status === 'assigned' ? 'Assigned' :
                                  order.status === 'in_transit' ? 'In Transit' :
                                  order.status === 'delivered' ? 'Delivered' :
                                  'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Users</h2>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add User
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'shop_owner' ? 'bg-green-100 text-green-800' :
                                user.role === 'driver' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {user.role === 'admin' ? 'Admin' :
                                user.role === 'shop_owner' ? 'Shop Owner' :
                                user.role === 'driver' ? 'Driver' :
                                'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-bold mb-6">All Orders</h2>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tracking #
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shop
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Driver
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.tracking_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.shop?.business_name || order.shop?.name}
                            <br />
                            <span className="text-xs">{order.shop?.email}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customer?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'assigned' || order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'}`}>
                              {order.status === 'pending' ? 'Pending' :
                                order.status === 'assigned' ? 'Assigned' :
                                order.status === 'in_transit' ? 'In Transit' :
                                order.status === 'delivered' ? 'Delivered' :
                                'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.driver ? order.driver.name : 'Not assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                alert(`
                                  Order Details:

                                  Tracking Number: ${order.tracking_number}
                                  Shop: ${order.shop?.business_name || order.shop?.name} (${order.shop?.email})
                                  Customer: ${order.customer?.name}
                                  Phone: ${order.customer?.phone}
                                  Address: ${order.delivery_address}
                                  Items: ${order.items}
                                  Status: ${order.status}
                                  Driver: ${order.driver ? order.driver.name : 'Not assigned'}
                                  Date: ${new Date(order.created_at).toLocaleDateString()}
                                `);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
