'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Hardcoded shop owner ID (Sampath)
const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59';

export default function MinimalShopPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

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
                <button
                  onClick={createTestOrder}
                  disabled={loading}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-green-300"
                >
                  Create Test Order
                </button>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
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
        
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link 
              href="/shop-dashboard" 
              className="block text-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Full Dashboard
            </Link>
            <Link 
              href="/direct-shop" 
              className="block text-center px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              Direct Shop
            </Link>
            <Link 
              href="/simple-shop-dashboard" 
              className="block text-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Simple Dashboard
            </Link>
            <Link 
              href="/login" 
              className="block text-center px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
