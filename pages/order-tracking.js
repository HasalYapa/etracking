'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase-singleton';
import Link from 'next/link';

export default function OrderTracking() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Get tracking number from URL query if available
  useEffect(() => {
    if (router.query.tracking) {
      setTrackingNumber(router.query.tracking);
      handleTrackOrder(router.query.tracking);
    }
  }, [router.query]);

  const handleTrackOrder = async (tracking = trackingNumber) => {
    if (!tracking) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if order exists
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_number', tracking)
        .limit(1);

      if (orderError) throw orderError;

      if (!orders || orders.length === 0) {
        setError('Order not found. Please check the tracking number and try again.');
        setLoading(false);
        setOrder(null);
        return;
      }

      const orderData = orders[0];
      setOrder(orderData);

      // Get order history
      const { data: history, error: historyError } = await supabase
        .from('order_history')
        .select('*')
        .eq('order_id', orderData.id)
        .order('created_at', { ascending: true });

      if (historyError) throw historyError;
      setOrderHistory(history || []);
      
      // Update URL with tracking number for sharing
      if (router.query.tracking !== tracking) {
        router.push({
          pathname: '/order-tracking',
          query: { tracking }
        }, undefined, { shallow: true });
      }
      
      // Set up real-time listener for this order
      const orderSubscription = supabase
        .channel(`order-${orderData.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderData.id}`
        }, (payload) => {
          setOrder(payload.new);
          
          // Refresh order history
          fetchOrderHistory(orderData.id);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(orderSubscription);
      };
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order information. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOrderHistory = async (orderId) => {
    try {
      const { data: history, error: historyError } = await supabase
        .from('order_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (historyError) throw historyError;
      setOrderHistory(history || []);
    } catch (err) {
      console.error("Error fetching order history:", err);
    }
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'processing', 'ready_for_pickup', 'assigned_to_driver', 'out_for_delivery', 'delivered'];
    const index = steps.indexOf(status);
    return index >= 0 ? index + 1 : 1;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'processing':
        return 'Processing';
      case 'ready_for_pickup':
        return 'Ready for Pickup';
      case 'assigned_to_driver':
        return 'Driver Assigned';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Order Tracking</h1>
            
            {/* Search form */}
            <div className="flex flex-col sm:flex-row sm:space-x-3">
              <div className="flex-grow">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mt-3 sm:mt-0">
                <button
                  onClick={() => handleTrackOrder()}
                  disabled={loading}
                  className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Searching...' : 'Track Order'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order details */}
            {order && (
              <div className="mt-6">
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Order #{order.tracking_number || order.id.slice(-6)}</h2>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {order.status !== 'cancelled' && (
                    <div className="relative">
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div 
                          style={{ width: `${(getStatusStep(order.status) / 6) * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        ></div>
                      </div>
                      
                      {/* Progress steps */}
                      <div className="flex justify-between text-xs text-gray-600">
                        <div className={`${order.status === 'pending' ? 'text-blue-600 font-semibold' : ''}`}>
                          Order Placed
                        </div>
                        <div className={`${order.status === 'processing' ? 'text-blue-600 font-semibold' : ''}`}>
                          Processing
                        </div>
                        <div className={`${order.status === 'ready_for_pickup' ? 'text-blue-600 font-semibold' : ''}`}>
                          Ready
                        </div>
                        <div className={`${order.status === 'assigned_to_driver' ? 'text-blue-600 font-semibold' : ''}`}>
                          Assigned
                        </div>
                        <div className={`${order.status === 'out_for_delivery' ? 'text-blue-600 font-semibold' : ''}`}>
                          Out for Delivery
                        </div>
                        <div className={`${order.status === 'delivered' ? 'text-blue-600 font-semibold' : ''}`}>
                          Delivered
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order info */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-md">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Shop ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">{order.shop_id || 'Not available'}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Delivery Address</dt>
                        <dd className="mt-1 text-sm text-gray-900">{order.delivery_address || 'Not available'}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Created At</dt>
                        <dd className="mt-1 text-sm text-gray-900">{new Date(order.created_at).toLocaleString()}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="mt-1 text-sm text-gray-900">{new Date(order.updated_at).toLocaleString()}</dd>
                      </div>
                      
                      {order.driver_id && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Driver ID</dt>
                          <dd className="mt-1 text-sm text-gray-900">{order.driver_id}</dd>
                        </div>
                      )}
                      
                      {order.delivery_notes && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Delivery Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900">{order.delivery_notes}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Order history */}
                  {orderHistory.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-md font-medium text-gray-900">Order History</h3>
                      <div className="mt-2 flow-root">
                        <ul className="-mb-8">
                          {orderHistory.map((historyItem, index) => (
                            <li key={historyItem.id}>
                              <div className="relative pb-8">
                                {index < orderHistory.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                      <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Status changed to <span className="font-medium text-gray-900">{getStatusLabel(historyItem.status)}</span>
                                      </p>
                                      {historyItem.notes && (
                                        <p className="text-sm text-gray-500">{historyItem.notes}</p>
                                      )}
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                      <time dateTime={historyItem.created_at}>
                                        {new Date(historyItem.created_at).toLocaleString()}
                                      </time>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Navigation links */}
                  <div className="mt-6 flex justify-between">
                    <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Back to Home
                    </Link>
                    {order.status === 'delivered' && (
                      <button
                        className="text-sm font-medium text-green-600 hover:text-green-500"
                        onClick={() => {
                          // Here you could implement functionality to place a new order
                          router.push('/');
                        }}
                      >
                        Place New Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
