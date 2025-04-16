'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

// Hardcoded shop owner ID (Sampath)
const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59';

// Generate ET tracking number
const generateTrackingNumber = () => {
  const randomPart = Math.floor(10000000 + Math.random() * 90000000);
  return `ET${randomPart}`;
};

export default function MinimalShopPage() {
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
    delivered: 0,
    inTransit: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '+94',
    delivery_address: '',
    tracking_number: generateTrackingNumber()
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the direct API endpoint to get orders
      const response = await fetch(`/api/direct-shop-orders?shopId=${shopOwnerId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.orders || []);

      // Calculate order statistics
      const stats = {
        total: data.orders.length,
        pending: data.orders.filter(o => o.status === 'pending').length,
        delivered: data.orders.filter(o => o.status === 'delivered').length,
        inTransit: data.orders.filter(o => ['picked_up', 'in_transit', 'assigned'].includes(o.status)).length
      };

      setOrderStats(stats);

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

      // Generate QR code for the driver
      const qrData = JSON.stringify({
        tracking_number: formData.tracking_number,
        customer_name: formData.customer_name,
        delivery_address: formData.delivery_address,
        order_id: data.order.id
      });

      setQRCodeData(qrData);
      setShowQRCode(true);

      // Reset form
      setFormData({
        customer_name: '',
        customer_phone: '+94',
        delivery_address: '',
        tracking_number: generateTrackingNumber()
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const generateQRCode = (order: any) => {
    const qrData = JSON.stringify({
      tracking_number: order.tracking_number,
      customer_name: order.customer_name,
      delivery_address: order.delivery_address,
      order_id: order.id
    });

    setQRCodeData(qrData);
    setShowQRCode(true);
  };

  const closeQRCode = () => {
    setShowQRCode(false);
  };

  const exportToCSV = () => {
    try {
      addLog('Exporting orders to CSV...');

      // Filter orders if needed
      const ordersToExport = statusFilter === 'all'
        ? orders
        : orders.filter(order => order.status === statusFilter);

      // Create CSV content
      const headers = ['Tracking Number', 'Customer Name', 'Phone', 'Delivery Address', 'Status', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...ordersToExport.map(order => [
          order.tracking_number,
          `"${order.customer_name || ''}"`,
          `"${order.customer_phone || ''}"`,
          `"${order.delivery_address || ''}"`,
          order.status,
          new Date(order.created_at).toLocaleString()
        ].join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addLog('CSV export completed');
    } catch (err: any) {
      console.error('Error exporting to CSV:', err);
      addLog(`Error exporting to CSV: ${err.message}`);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white shadow-md rounded-xl p-5 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-800">Shop Dashboard</h1>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowOrderForm(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Order
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
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
                <p className="text-2xl font-bold text-gray-800">{orderStats.total}</p>
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
                <p className="text-2xl font-bold text-gray-800">{orderStats.pending}</p>
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
                <p className="text-2xl font-bold text-gray-800">{orderStats.inTransit}</p>
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
                <p className="text-2xl font-bold text-gray-800">{orderStats.delivered}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-white shadow-md rounded-xl p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h2 className="text-xl font-semibold text-gray-800">Orders</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={createTestOrder}
                  disabled={loading}
                  className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Test Order
                </button>
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
          </div>


        </div>

        {/* Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Create New Order</h2>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
                <button
                  onClick={closeOrderDetails}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

              <div className="flex justify-center">
                <button
                  onClick={closeQRCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
