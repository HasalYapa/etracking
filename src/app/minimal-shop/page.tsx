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
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '+94',
    delivery_address: '',
    tracking_number: generateTrackingNumber(),
    notes: ''
  });

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    addLog('Minimal Shop Dashboard loaded');
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      addLog('Fetching orders...');

      // Use the direct API endpoint to get orders
      const response = await fetch(`/api/direct-shop-orders?shopId=${shopOwnerId}`);

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`API error: ${response.status} ${response.statusText}`);
        addLog(`Error details: ${errorText}`);
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        addLog(`API returned error: ${data.error || 'Unknown error'}`);
        throw new Error(data.error || 'Failed to fetch orders');
      }

      addLog(`Successfully fetched ${data.orders?.length || 0} orders`);
      setOrders(data.orders || []);

    } catch (err: any) {
      console.error('Error fetching orders:', err);
      addLog(`Error: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      addLog('Creating test order...');

      const response = await fetch('/api/create-test-order');
      const data = await response.json();

      if (!response.ok || !data.success) {
        addLog(`Error creating test order: ${data.error || 'Unknown error'}`);
        throw new Error(data.error || 'Failed to create test order');
      }

      addLog('Test order created successfully');
      addLog(`Order ID: ${data.order.id}`);

      // Refresh orders
      fetchOrders();

    } catch (err: any) {
      console.error('Error creating test order:', err);
      addLog(`Error: ${err.message}`);
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
      addLog('Creating custom order...');

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
        addLog(`Error creating order: ${data.error || 'Unknown error'}`);
        throw new Error(data.error || 'Failed to create order');
      }

      addLog('Order created successfully');
      addLog(`Order ID: ${data.order.id}`);

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
        tracking_number: generateTrackingNumber(),
        notes: ''
      });

      setShowOrderForm(false);

      // Refresh orders
      fetchOrders();

    } catch (err: any) {
      console.error('Error creating order:', err);
      addLog(`Error: ${err.message}`);
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Minimal Shop Dashboard</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowOrderForm(true)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                New Order
              </button>
              <button
                onClick={exportToCSV}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
              >
                Export CSV
              </button>
              <Link
                href="/"
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="col-span-3">
            <div className="bg-white shadow rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Orders</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
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
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-green-300"
                  >
                    Create Test Order
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading orders...</p>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders
                        .filter(order => statusFilter === 'all' || order.status === statusFilter)
                        .map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{order.tracking_number}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{order.customer_name || 'Unknown'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'assigned' ? 'bg-orange-100 text-orange-800' :
                                order.status === 'picked_up' || order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              View
                            </button>
                            <button
                              onClick={() => generateQRCode(order)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              QR Code
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
            <div className="bg-gray-50 p-2 rounded h-80 overflow-y-auto text-xs font-mono">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create New Order</h2>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (+94xxxxxxxxx)</label>
                  <input
                    type="text"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="+94XXXXXXXXX"
                    required
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    name="tracking_number"
                    value={formData.tracking_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    readOnly
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createCustomOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Order Details</h2>
                <button
                  onClick={closeOrderDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tracking Number</p>
                  <p className="text-lg">{selectedOrder.tracking_number}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-lg">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedOrder.status === 'assigned' ? 'bg-orange-100 text-orange-800' :
                        selectedOrder.status === 'picked_up' || selectedOrder.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                      {selectedOrder.status}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Name</p>
                  <p className="text-lg">{selectedOrder.customer_name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="text-lg">{selectedOrder.customer_phone || 'N/A'}</p>
                </div>



                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Delivery Address</p>
                  <p className="text-lg">{selectedOrder.delivery_address || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p className="text-lg">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Updated At</p>
                  <p className="text-lg">{new Date(selectedOrder.updated_at).toLocaleString()}</p>
                </div>

                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-lg">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={closeOrderDetails}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    generateQRCode(selectedOrder);
                    closeOrderDetails();
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Generate QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">QR Code for Driver</h2>
                <button
                  onClick={closeQRCode}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col items-center justify-center mb-4">
                <div className="border border-gray-300 p-4 rounded-lg mb-4">
                  <QRCodeSVG
                    value={qrCodeData}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center mb-2">
                  This QR code contains order information for the driver.
                </p>
                <p className="text-sm text-gray-600 text-center">
                  Scan with the driver app to update order status and location.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={closeQRCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
