'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Hardcoded shop owner ID (Sampath)
const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59';

export default function DirectShopPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_transit: 0,
    delivered: 0
  });
  const [logs, setLogs] = useState<string[]>([]);

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    addLog('Direct Shop Dashboard loaded');
    addLog('Fetching orders directly without authentication...');
    fetchOrdersDirectly();
  }, []);

  const fetchOrdersDirectly = async () => {
    try {
      setLoading(true);
      addLog('Fetching orders via direct API call...');
      
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
      
      // Calculate stats
      const total = data.orders?.length || 0;
      const pending = data.orders?.filter((order: any) => order.status === 'pending').length || 0;
      const inTransit = data.orders?.filter((order: any) => 
        order.status === 'in_transit' || order.status === 'assigned' || order.status === 'picked_up'
      ).length || 0;
      const delivered = data.orders?.filter((order: any) => order.status === 'delivered').length || 0;
      
      setStats({
        total,
        pending,
        in_transit: inTransit,
        delivered
      });
      
      addLog('Order statistics calculated');
      
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
      fetchOrdersDirectly();
      
    } catch (err: any) {
      console.error('Error creating test order:', err);
      addLog(`Error: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Direct Shop Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link 
              href="/shop-dashboard" 
              className="text-blue-600 hover:text-blue-800"
            >
              Go to Full Dashboard
            </Link>
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <button 
              onClick={() => fetchOrdersDirectly()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Orders</p>
                    <h2 className="text-2xl font-bold">{stats.total}</h2>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Pending</p>
                    <h2 className="text-2xl font-bold">{stats.pending}</h2>
                  </div>
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">In Transit</p>
                    <h2 className="text-2xl font-bold">{stats.in_transit}</h2>
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Delivered</p>
                    <h2 className="text-2xl font-bold">{stats.delivered}</h2>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Orders</h2>
              <button
                onClick={createTestOrder}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Test Order
              </button>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-sm p-8 flex justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No orders found. Create your first order to get started.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tracking #
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.tracking_number}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {order.customer_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'assigned' ? 'bg-orange-100 text-orange-800' :
                              order.status === 'picked_up' || order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'}`}>
                            {order.status}
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
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
            <div className="bg-gray-100 p-3 rounded-lg h-96 overflow-y-auto text-xs font-mono">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
            
            <div className="mt-4 space-y-2">
              <button
                onClick={fetchOrdersDirectly}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 text-sm"
              >
                Refresh Orders
              </button>
              
              <Link 
                href="/shop-dashboard" 
                className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                Go to Shop Dashboard
              </Link>
              
              <Link 
                href="/login" 
                className="block w-full text-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
