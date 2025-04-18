'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import RealTimeClock from '@/components/real-time-clock';
import LogoPlaceholder from '@/components/logo-placeholder';
import ShopAuthCheck from '@/components/shop-auth-check';
import { supabase } from '@/lib/supabase-singleton';

// Hardcoded shop owner ID (Sampath)
const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59';

// Store the shop ID in localStorage for QR code generation
if (typeof window !== 'undefined') {
  localStorage.setItem('currentShopId', shopOwnerId);
}

// Generate ET tracking number
const generateTrackingNumber = () => {
  const randomPart = Math.floor(10000000 + Math.random() * 90000000);
  return `ET${randomPart}`;
};

export default function MinimalShop() {
  return (
    <ShopAuthCheck>
      <MinimalShopContent />
    </ShopAuthCheck>
  );
}

function MinimalShopContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '+94',
    delivery_address: '',
    tracking_number: generateTrackingNumber(),
    autoAssignDriver: false
  });

  // Available drivers state
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  useEffect(() => {
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

        // Refresh orders when any change happens
        fetchOrders();

        // Show notification for status changes
        if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;

          if (oldStatus !== newStatus) {
            // Create a notification
            const notification = new Notification('Order Status Updated', {
              body: `Order ${payload.new.tracking_number} status changed from ${oldStatus} to ${newStatus}`,
              icon: '/favicon.ico'
            });

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);
          }
        }
      })
      .subscribe();

    // Set up real-time subscription to driver availability
    const driverSubscription = supabase
      .channel('driver-availability')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_availability',
      }, (payload) => {
        console.log('Driver availability update received:', payload);
        fetchAvailableDrivers();
      })
      .subscribe();

    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    return () => {
      // Clean up subscriptions when component unmounts
      subscription.unsubscribe();
      driverSubscription.unsubscribe();
    };

  }, []);

  // Fetch available drivers
  const fetchAvailableDrivers = async () => {
    try {
      if (!shopOwnerId) return;

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

  const fetchOrders = async () => {
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

    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/create-test-order');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create test order');
      }

      // Refresh orders
      fetchOrders();

    } catch (err: any) {
      console.error('Error creating test order:', err);
      setError(err.message);
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

      // If auto-assign is enabled, include it in the request
      if (formData.autoAssignDriver) {
        orderData.autoAssignDriver = true;
      }

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

      // Generate QR code for the driver using JSON format with all necessary information
      const qrData = JSON.stringify({
        trackingNumber: formData.tracking_number,
        location: formData.delivery_address || 'Unknown',
        orderId: data.order.id,
        shopId: shopOwnerId,  // Include the shop ID
        timestamp: new Date().toISOString()
      });
      console.log('Generated QR code data for new order:', qrData);

      setQRCodeData(qrData);
      setShowQRCode(true);

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

    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Handle checkbox separately
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
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

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const generateQRCode = (order: any) => {
    // Use JSON format with all necessary information
    const qrData = JSON.stringify({
      trackingNumber: order.tracking_number,
      location: order.delivery_address || 'Unknown',
      orderId: order.id,
      shopId: shopOwnerId,  // Include the shop ID
      timestamp: new Date().toISOString()
    });
    console.log('Generated QR code data:', qrData);

    setQRCodeData(qrData);
    setShowQRCode(true);
  };

  const closeQRCode = () => {
    setShowQRCode(false);
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

              <div className="flex space-x-2">
                <Link
                  href="/map-assignment"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Map Assignment
                </Link>

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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => generateQRCode(order)}
                            className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                            title="Generate QR Code"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Create New Order</h2>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="+94XXXXXXXXX"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Must start with +94 followed by 10 digits</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                  <input
                    type="text"
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter delivery address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
                  <input
                    type="text"
                    name="tracking_number"
                    value={formData.tracking_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-mono"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated tracking number</p>
                </div>

                <div>
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
                      Auto-assign available driver
                    </label>
                  </div>
                  {formData.autoAssignDriver && (
                    <div className="mt-2 text-sm text-gray-500">
                      {loadingDrivers ? (
                        <p>Checking for available drivers...</p>
                      ) : availableDrivers.length > 0 ? (
                        <p className="text-green-600">{availableDrivers.length} driver(s) available for assignment</p>
                      ) : (
                        <p className="text-yellow-600">No drivers currently available. Order will be created as pending.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={createCustomOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
                <button
                  onClick={closeOrderDetails}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Tracking Number</p>
                  <p className="text-lg font-mono font-medium text-blue-600">{selectedOrder.tracking_number}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full
                    ${selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'assigned' ? 'bg-orange-100 text-orange-800' :
                      selectedOrder.status === 'picked_up' || selectedOrder.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'}`}>
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Customer Name</p>
                  <p className="text-lg">{selectedOrder.customer_name || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                  <p className="text-lg">{selectedOrder.customer_phone || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg col-span-1 md:col-span-2">
                  <p className="text-sm font-medium text-gray-500 mb-1">Delivery Address</p>
                  <p className="text-lg">{selectedOrder.delivery_address || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Created At</p>
                  <p className="text-lg">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Updated At</p>
                  <p className="text-lg">{new Date(selectedOrder.updated_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeOrderDetails}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    generateQRCode(selectedOrder);
                    closeOrderDetails();
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Generate QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">QR Code for Driver</h2>
                <button
                  onClick={closeQRCode}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col items-center justify-center mb-6">
                <div className="border-2 border-gray-200 p-6 rounded-xl mb-6 bg-white shadow-sm">
                  <QRCodeSVG
                    id="shop-qr-code"
                    value={qrCodeData}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg w-full">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    Driver Instructions:
                  </p>
                  <p className="text-sm text-blue-600 mb-2">
                    1. Scan this QR code before picking up the order
                  </p>
                  <p className="text-sm text-blue-600">
                    2. Update status as you progress with the delivery
                  </p>
                </div>
              </div>

              <div className="flex justify-between gap-3 mb-4">
                <button
                  onClick={() => {
                    // Download QR code as image
                    try {
                      console.log('Attempting to download QR code...');
                      // First try to get the canvas directly
                      let canvas = document.getElementById('shop-qr-code')?.querySelector('canvas');

                      // If that fails, try to create a canvas from the SVG
                      if (!canvas) {
                        console.log('Canvas not found directly, creating from SVG...');
                        const svg = document.getElementById('shop-qr-code');
                        if (svg) {
                          // Create a canvas and draw the SVG on it
                          canvas = document.createElement('canvas');
                          canvas.width = 500;
                          canvas.height = 500;
                          const ctx = canvas.getContext('2d');

                          // Create a temporary image from the SVG
                          const img = new Image();
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
                          const url = URL.createObjectURL(svgBlob);

                          // When the image loads, draw it on the canvas and trigger download
                          img.onload = () => {
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, 500, 500);
                              const pngUrl = canvas.toDataURL('image/png');

                              // Create a temporary link and trigger download
                              const downloadLink = document.createElement('a');
                              downloadLink.href = pngUrl;
                              downloadLink.download = `tracking-qr-code.png`;
                              document.body.appendChild(downloadLink);
                              downloadLink.click();
                              document.body.removeChild(downloadLink);

                              // Clean up
                              URL.revokeObjectURL(url);
                            }
                          };
                          img.src = url;
                          return; // Exit early as we're handling download in the onload callback
                        }
                      }

                      // If we have a canvas (either found or created), use it
                      if (canvas) {
                        console.log('Canvas found, generating download...');
                        const pngUrl = canvas
                          .toDataURL('image/png')
                          .replace('image/png', 'image/octet-stream');

                        // Create a temporary link and trigger download
                        const downloadLink = document.createElement('a');
                        downloadLink.href = pngUrl;
                        downloadLink.download = `tracking-qr-code.png`;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                      } else {
                        console.error('No canvas or SVG element found');
                        alert('Could not generate download. Please try again.');
                      }
                    } catch (err) {
                      console.error('Error downloading QR code:', err);
                      alert('Error downloading QR code. Please try again.');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => {
                    // Print QR code
                    try {
                      console.log('Attempting to print QR code...');
                      const printWindow = window.open('', '_blank');
                      if (!printWindow) {
                        alert('Could not open print window. Please check your popup blocker settings.');
                        return;
                      }

                      // First try to get the canvas directly
                      let pngUrl = '';
                      let canvas = document.getElementById('shop-qr-code')?.querySelector('canvas');

                      // If that fails, try to create a canvas from the SVG
                      if (!canvas) {
                        console.log('Canvas not found directly for printing, creating from SVG...');
                        const svg = document.getElementById('shop-qr-code');
                        if (svg) {
                          // Get SVG data as a data URL
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
                          pngUrl = URL.createObjectURL(svgBlob);

                          // Write the print document
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Print QR Code</title>
                                <style>
                                  body {
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                    padding: 20px;
                                  }
                                  .container {
                                    max-width: 400px;
                                    margin: 0 auto;
                                    border: 1px solid #ccc;
                                    padding: 20px;
                                  }
                                  .qr-image {
                                    width: 250px;
                                    height: 250px;
                                    margin: 0 auto;
                                  }
                                  .instructions {
                                    margin-top: 20px;
                                    font-size: 14px;
                                    text-align: left;
                                    padding: 10px;
                                    background-color: #f0f7ff;
                                    border-radius: 5px;
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="container">
                                  <h2>Driver QR Code</h2>
                                  <img src="${pngUrl}" class="qr-image" />
                                  <div class="instructions">
                                    <p><strong>Driver Instructions:</strong></p>
                                    <p>1. Scan this QR code before picking up the order</p>
                                    <p>2. Update status as you progress with the delivery</p>
                                  </div>
                                </div>
                              </body>
                            </html>
                          `);

                          printWindow.document.close();
                          printWindow.focus();

                          // Add a slight delay to ensure the image is loaded
                          setTimeout(() => {
                            printWindow.print();
                            printWindow.close();
                            URL.revokeObjectURL(pngUrl);
                          }, 500);
                          return;
                        }
                      }

                      // If we have a canvas, use it
                      if (canvas) {
                        console.log('Canvas found, generating print view...');
                        pngUrl = canvas.toDataURL('image/png');

                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Print QR Code</title>
                              <style>
                                body {
                                  font-family: Arial, sans-serif;
                                  text-align: center;
                                  padding: 20px;
                                }
                                .container {
                                  max-width: 400px;
                                  margin: 0 auto;
                                  border: 1px solid #ccc;
                                  padding: 20px;
                                }
                                .qr-image {
                                  width: 250px;
                                  height: 250px;
                                  margin: 0 auto;
                                }
                                .instructions {
                                  margin-top: 20px;
                                  font-size: 14px;
                                  text-align: left;
                                  padding: 10px;
                                  background-color: #f0f7ff;
                                  border-radius: 5px;
                                }
                              </style>
                            </head>
                            <body>
                              <div class="container">
                                <h2>Driver QR Code</h2>
                                <img src="${pngUrl}" class="qr-image" />
                                <div class="instructions">
                                  <p><strong>Driver Instructions:</strong></p>
                                  <p>1. Scan this QR code before picking up the order</p>
                                  <p>2. Update status as you progress with the delivery</p>
                                </div>
                              </div>
                            </body>
                          </html>
                        `);

                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                        printWindow.close();
                      } else {
                        console.error('No canvas or SVG element found for printing');
                        alert('Could not generate print view. Please try again.');
                      }
                    } catch (err) {
                      console.error('Error printing QR code:', err);
                      alert('Error printing QR code. Please try again.');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={closeQRCode}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center">
            <div className="flex justify-center md:justify-start mb-3 md:mb-0">
              <LogoPlaceholder />
            </div>
            <div className="flex justify-center mb-3 md:mb-0">
              <span className="text-sm text-gray-600">© {new Date().getFullYear()} etracking.store. All rights reserved.</span>
            </div>
            <div className="flex justify-center md:justify-end">
              <RealTimeClock />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// We're now using ShopAuthCheck instead of SupabaseProtectedRoute
