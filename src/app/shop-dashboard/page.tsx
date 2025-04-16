'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import OrderDetailsModal from '../../components/order-details-modal';

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

export default function ShopDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_transit: 0,
    delivered: 0
  });
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    items: ''
  });

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

          // Verify this is a shop owner
          if (profileData.role !== 'shop_owner') {
            setError('Access denied. This dashboard is for shop owners only.');
            return;
          }

          // Load orders for this shop owner
          await loadShopOrders(profileData.id);
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

  const loadShopOrders = async (shopId) => {
    try {
      console.log('Loading orders for shop ID:', shopId);

      // In a real implementation, we would fetch orders from Supabase
      // For now, we'll use mock data but filter it by shop ID

      // This would be the actual query in production:
      // const { data: ordersData, error } = await supabase
      //   .from('orders')
      //   .select('*, driver:drivers(*)')
      //   .eq('shop_id', shopId);

      // Mock data for now, but with shop_id added
      const allMockOrders = [
        {
          id: '1',
          tracking_number: 'TRK12345',
          shop_id: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59', // Sampath's ID
          customer: { name: 'John Doe', phone: '123-456-7890' },
          delivery_address: '123 Main St, City',
          items: 'Laptop, Mouse',
          status: 'pending',
          driver: null,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          tracking_number: 'TRK67890',
          shop_id: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59', // Sampath's ID
          customer: { name: 'Jane Smith', phone: '987-654-3210' },
          delivery_address: '456 Oak Ave, Town',
          items: 'Headphones, Keyboard',
          status: 'assigned',
          driver: { name: 'Driver 1', id: '35fbcf81-5f57-4267-a7af-9d52602761d1' },
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          tracking_number: 'TRK24680',
          shop_id: '74622a48-0f62-43a1-a330-e82ac4f4e34d', // Another shop owner's ID
          customer: { name: 'Bob Johnson', phone: '555-123-4567' },
          delivery_address: '789 Pine St, Village',
          items: 'Monitor, Speakers',
          status: 'in_transit',
          driver: { name: 'Driver 2', id: '9155a1e2-84d0-44ec-8174-f27f8b9cc03e' },
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          tracking_number: 'TRK13579',
          shop_id: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59', // Sampath's ID
          customer: { name: 'Alice Brown', phone: '555-987-6543' },
          delivery_address: '321 Elm St, County',
          items: 'Printer, Scanner',
          status: 'delivered',
          driver: { name: 'Driver 1', id: '35fbcf81-5f57-4267-a7af-9d52602761d1' },
          created_at: new Date().toISOString()
        }
      ];

      // Filter orders by shop ID
      const shopOrders = allMockOrders.filter(order => order.shop_id === shopId);
      console.log(`Found ${shopOrders.length} orders for shop ID ${shopId}`);

      setOrders(shopOrders);

      // Calculate stats
      setStats({
        total: shopOrders.length,
        pending: shopOrders.filter(order => order.status === 'pending').length,
        in_transit: shopOrders.filter(order => order.status === 'in_transit' || order.status === 'assigned').length,
        delivered: shopOrders.filter(order => order.status === 'delivered').length
      });
    } catch (err) {
      console.error('Error loading shop orders:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/shop-login';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleNewOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile || !profile.id) {
      setError('You must be logged in to create orders.');
      return;
    }

    // Create new order
    const newOrderData = {
      id: Math.random().toString(36).substring(2, 9),
      tracking_number: 'TRK' + Math.floor(Math.random() * 100000),
      shop_id: profile.id, // Add shop_id to link order to this shop owner
      customer: {
        name: newOrder.customer_name,
        phone: newOrder.customer_phone
      },
      delivery_address: newOrder.delivery_address,
      items: newOrder.items,
      status: 'pending',
      driver: null,
      created_at: new Date().toISOString()
    };

    // In a real implementation, we would save to Supabase:
    // const { data, error } = await supabase
    //   .from('orders')
    //   .insert({
    //     tracking_number: newOrderData.tracking_number,
    //     shop_id: profile.id,
    //     customer_name: newOrder.customer_name,
    //     customer_phone: newOrder.customer_phone,
    //     delivery_address: newOrder.delivery_address,
    //     items: newOrder.items,
    //     status: 'pending',
    //     created_at: new Date().toISOString()
    //   });

    // Add to orders
    setOrders(prev => [newOrderData, ...prev]);

    // Update stats
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      pending: prev.pending + 1
    }));

    // Reset form
    setNewOrder({
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      items: ''
    });

    // Hide form
    setShowNewOrderForm(false);

    alert('New order created successfully!');
  };

  const handleAssignDriver = (orderId: string) => {
    // In a real app, you would show a driver selection UI
    // For now, we'll just assign a mock driver

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'assigned',
          driver: { name: 'Driver ' + Math.floor(Math.random() * 3 + 1) }
        };
      }
      return order;
    }));

    // Update stats
    setStats(prev => ({
      ...prev,
      pending: prev.pending - 1,
      in_transit: prev.in_transit + 1
    }));

    alert('Driver assigned successfully!');
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
              Shop Dashboard
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Authentication Error
            </p>
          </div>

          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>

          <div className="mt-8">
            <Link href="/shop-login" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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
          <h1 className="text-2xl font-bold text-gray-800">Shop Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, {profile?.name || user?.user_metadata?.name || 'Shop Owner'}
              {profile?.business_name && (
                <span className="ml-2 text-sm text-gray-500">({profile.business_name})</span>
              )}
            </span>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <h2 className="text-3xl font-bold">{stats.total}</h2>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending</p>
                <h2 className="text-3xl font-bold">{stats.pending}</h2>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">In Transit</p>
                <h2 className="text-3xl font-bold">{stats.in_transit}</h2>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Delivered</p>
                <h2 className="text-3xl font-bold">{stats.delivered}</h2>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">My Orders</h2>
            <button
              onClick={() => setShowNewOrderForm(!showNewOrderForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {showNewOrderForm ? 'Cancel' : 'New Order'}
            </button>
          </div>

          {showNewOrderForm && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Create New Order</h3>
              <form onSubmit={handleNewOrderSubmit}>
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Create Order
                  </button>
                </div>
              </form>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">No orders found. Create a new order to get started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
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
                        {order.customer?.name}<br />
                        <span className="text-xs">{order.customer?.phone}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {order.items}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleAssignDriver(order.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Assign Driver
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
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
          )}
        </div>
      </main>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}
