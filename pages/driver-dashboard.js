'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase-singleton';
import DriverAuthCheck from '../components/DriverAuthCheck';
import Link from 'next/link';

export default function DriverDashboardPage() {
  return (
    <DriverAuthCheck>
      <DriverDashboard />
    </DriverAuthCheck>
  );
}

function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get driver details
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) throw profileError;
          
          setUser({
            ...session.user,
            ...profileData
          });
        } catch (err) {
          console.error("Error fetching driver details:", err);
          setError("Failed to load your profile information.");
        }
      }
    };
    
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        if (activeTab === 'available') {
          // Fetch available orders (ready for pickup)
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'ready_for_pickup')
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          setOrders(data || []);
        } else {
          // Fetch orders assigned to this driver
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('driver_id', user.id)
            .in('status', ['assigned_to_driver', 'out_for_delivery', 'delivered'])
            .order('updated_at', { ascending: false });
            
          if (error) throw error;
          setOrders(data || []);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    
    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, () => {
        fetchOrders();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [user, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleAcceptOrder = async (orderId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'assigned_to_driver',
          driver_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Add to order history
      await supabase
        .from('order_history')
        .insert({
          order_id: orderId,
          status: 'assigned_to_driver',
          notes: `Order assigned to driver ${user.name || user.email}`,
          updated_by: user.id
        });
      
      // Switch to "My Orders" tab after accepting
      setActiveTab('my_orders');
    } catch (err) {
      console.error("Error accepting order:", err);
      setError("Failed to accept order. Please try again.");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Add to order history
      await supabase
        .from('order_history')
        .insert({
          order_id: orderId,
          status: newStatus,
          notes: `Order status updated to ${newStatus} by driver ${user.name || user.email}`,
          updated_by: user.id
        });
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order status. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/driver-login');
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Failed to sign out. Please try again.");
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready_for_pickup':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned_to_driver':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'ready_for_pickup':
        return 'Ready for Pickup';
      case 'assigned_to_driver':
        return 'Assigned to Driver';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Driver Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 mr-4">
                {user.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('available')}
              className={`${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
            >
              Available Orders
            </button>
            <button
              onClick={() => handleTabChange('my_orders')}
              className={`${
                activeTab === 'my_orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Orders
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {activeTab === 'available' 
                  ? 'No available orders at the moment.'
                  : 'You have no orders yet.'}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <li key={order.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-blue-600 truncate">
                            Order #{order.tracking_number || order.id.slice(-6)}
                          </div>
                          <div className="flex items-center mt-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          {activeTab === 'available' ? (
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Accept Order
                            </button>
                          ) : (
                            <div className="flex space-x-2">
                              {order.status === 'assigned_to_driver' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                                >
                                  Start Delivery
                                </button>
                              )}
                              {order.status === 'out_for_delivery' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                  Mark Delivered
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {order.delivery_address || 'No address provided'}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>Created: {new Date(order.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">Shop:</span> {order.shop_id || 'Unknown shop'}
                        </div>
                        {order.customer_phone && (
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Customer Phone:</span> {order.customer_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
