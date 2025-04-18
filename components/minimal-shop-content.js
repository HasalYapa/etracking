'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import RealTimeClock from '@/components/real-time-clock';
import LogoPlaceholder from '@/components/logo-placeholder';
import { supabase } from '@/lib/supabase-singleton';
import ShopAuthCheck from '@/components/shop-auth-check';

export default function MinimalShop() {
  return (
    <ShopAuthCheck>
      <MinimalShopContent />
    </ShopAuthCheck>
  );
}

function MinimalShopContent() {
  // Get shopOwnerId from localStorage or from user session
  const [shopOwnerId, setShopOwnerId] = useState('');
  
  useEffect(() => {
    // Get shop owner ID from localStorage or current user session
    const getShopId = async () => {
      if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem('currentShopId');
        if (storedId) {
          setShopOwnerId(storedId);
        } else {
          // Fallback to getting from session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            setShopOwnerId(session.user.id);
            localStorage.setItem('currentShopId', session.user.id);
          }
        }
      }
    };
    
    getShopId();
  }, []);
  
  // The rest of your component stays the same
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '+94',
    delivery_address: '',
    tracking_number: generateTrackingNumber(),
    autoAssignDriver: false
  });
  
  // Generate ET tracking number
  function generateTrackingNumber() {
    const randomPart = Math.floor(10000000 + Math.random() * 90000000);
    return `ET${randomPart}`;
  }
  
  useEffect(() => {
    if (!shopOwnerId) return;
    
    fetchOrders();
    fetchAvailableDrivers();
    
    // Set up real-time subscription to orders table
    const subscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `shop_id=eq.${shopOwnerId}`,
      }, (payload) => {
        console.log('Real-time update received:', payload);
        fetchOrders();
      })
      .subscribe();
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [shopOwnerId]); // Make this dependent on shopOwnerId
  
  // Fetch available drivers
  const fetchAvailableDrivers = async () => {
    if (!shopOwnerId) return;
    
    try {
      setLoadingDrivers(true);
      const response = await fetch(`/api/driver/find-available?shopOwnerId=${shopOwnerId}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching available drivers:', data.error);
        return;
      }
      
      setAvailableDrivers(data.data || []);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
    } finally {
      setLoadingDrivers(false);
    }
  };
  
  // Use shopOwnerId in your fetch requests
  const fetchOrders = async () => {
    if (!shopOwnerId) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/direct-shop-orders?shopId=${shopOwnerId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders');
      }
      
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'An error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  };
  
  const createCustomOrder = async () => {
    try {
      // Validate phone number
      if (!formData.customer_phone.startsWith('+94') || formData.customer_phone.length !== 12) {
        throw new Error('Phone number must start with +94 and contain 10 digits after that');
      }
      
      setLoading(true);
      setError(null);
      
      const orderData = {
        ...formData,
        shop_id: shopOwnerId,
        status: 'pending'
      };
      
      const response = await fetch('/api/create-custom-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create order');
      }
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_phone: '+94',
        delivery_address: '',
        tracking_number: generateTrackingNumber(),
        autoAssignDriver: false
      });
      
      setShowOrderForm(false);
      
      // Refresh orders
      fetchOrders();
      
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message || 'An error occurred while creating the order');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <header className="bg-white shadow-md rounded-xl p-5 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Shop Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowOrderForm(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Order
              </button>
              
              <Link
                href="/"
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
                </svg>
                Home
              </Link>
            </div>
          </div>
        </header>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Order Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">In Transit</p>
                <p className="text-2xl font-bold text-gray-800">{orders.filter(o => ['picked_up', 'in_transit', 'assigned'].includes(o.status)).length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'delivered').length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Orders List */}
        <div className="bg-white shadow-md rounded-xl p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Orders</h2>
            <div className="relative">
              <select
                value={statusFilter || 'all'}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-500">Loading orders...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 mt-1">Create a new order to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders
                    .filter(order => statusFilter === 'all' || order.status === statusFilter)
                    .map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">{order.tracking_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{order.customer_name || 'Unknown'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'assigned' ? 'bg-orange-100 text-orange-800' :
                            order.status === 'picked_up' || order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'}`}>
                          {order.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* New Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Order</h3>
                  <button 
                    onClick={() => setShowOrderForm(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); createCustomOrder(); }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                      <input
                        type="text"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="text"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Format: +94XXXXXXXXX</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                      <textarea
                        name="delivery_address"
                        value={formData.delivery_address}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                      <input
                        type="text"
                        name="tracking_number"
                        value={formData.tracking_number}
                        onChange={handleInputChange}
                        required
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="autoAssignDriver"
                        name="autoAssignDriver"
                        checked={formData.autoAssignDriver}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="autoAssignDriver" className="ml-2 block text-sm text-gray-700">
                        Auto-assign to nearest available driver
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowOrderForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                    >
                      {loading ? 'Creating...' : 'Create Order'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
