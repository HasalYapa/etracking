'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError(null);
    setOrderData(null);

    try {
      // Fetch order data
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          shops:profiles!orders_shop_id_fkey(name, business_name),
          drivers:profiles!orders_driver_id_fkey(name, phone)
        `)
        .eq('tracking_number', trackingNumber)
        .single();

      if (orderError) {
        throw new Error('Order not found. Please check your tracking number and try again.');
      }

      if (!orderData) {
        throw new Error('Order not found. Please check your tracking number and try again.');
      }

      // Fetch order history
      const { data: historyData, error: historyError } = await supabase
        .from('order_history')
        .select('*')
        .eq('order_id', orderData.id)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error('Error fetching order history:', historyError);
      }

      setOrderData({
        ...orderData,
        history: historyData || []
      });
    } catch (err: any) {
      console.error('Error tracking order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-blue-600">Track Your Delivery</h1>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Enter Tracking Number</h2>
                <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <input
                    type="text"
                    className="flex-grow px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., ORD-123456"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Tracking...' : 'Track'}
                  </button>
                </form>
                {error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
              </div>

              {/* Real Tracking Result */}
              {orderData && (
                <div className="border-t border-gray-200 pt-8">
                  <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold text-gray-800">Tracking #{orderData.tracking_number}</h3>
                      <span className={`text-sm font-medium px-3 py-1 rounded-full
                        ${orderData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        orderData.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        orderData.status === 'picked_up' ? 'bg-orange-100 text-orange-800' :
                        orderData.status === 'in_transit' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-green-100 text-green-800'}`}
                      >
                        {orderData.status === 'pending' ? 'Order Placed' :
                        orderData.status === 'assigned' ? 'Driver Assigned' :
                        orderData.status === 'picked_up' ? 'Picked Up' :
                        orderData.status === 'in_transit' ? 'In Transit' :
                        'Delivered'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-gray-600"><span className="font-medium">Customer:</span> {orderData.customer_name}</p>
                        <p className="text-gray-600"><span className="font-medium">Shop:</span> {orderData.shops?.business_name || 'N/A'}</p>
                        {orderData.drivers && (
                          <p className="text-gray-600"><span className="font-medium">Driver:</span> {orderData.drivers?.name || 'Not assigned yet'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-600"><span className="font-medium">Delivery Address:</span> {orderData.delivery_address}</p>
                        <p className="text-gray-600"><span className="font-medium">Last Updated:</span> {formatDate(orderData.last_updated)}</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Tracking History</h3>

                  {orderData.history && orderData.history.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                      {orderData.history.map((event: any, index: number) => (
                        <div key={index} className="relative flex items-start mb-6">
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center z-10
                            ${event.status === 'delivered' ? 'bg-green-500' :
                            event.status === 'in_transit' ? 'bg-blue-500' :
                            event.status === 'picked_up' ? 'bg-orange-500' :
                            event.status === 'assigned' ? 'bg-indigo-500' :
                            'bg-yellow-500'}`}
                          >
                            {event.status === 'delivered' && (
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {event.status === 'in_transit' && (
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                            {event.status === 'picked_up' && (
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                              </svg>
                            )}
                            {event.status === 'assigned' && (
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            )}
                            {event.status === 'pending' && (
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-6">
                            <h4 className="text-md font-medium text-gray-900">
                              {event.status === 'pending' ? 'Order Placed' :
                              event.status === 'assigned' ? 'Driver Assigned' :
                              event.status === 'picked_up' ? 'Order Picked Up' :
                              event.status === 'in_transit' ? 'In Transit' :
                              'Order Delivered'}
                            </h4>
                            <p className="text-sm text-gray-500">{formatDate(event.created_at)}</p>
                            {event.notes && (
                              <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                            )}
                            {event.location && (
                              <p className="text-sm text-gray-600 mt-1">Location: {event.location}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No tracking history available yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Tracking FAQ</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">How do I track my order?</h3>
                  <p className="text-gray-600">
                    Enter your tracking number in the field above and click "Track". Your tracking number was provided
                    in your order confirmation email or SMS.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">What if I lost my tracking number?</h3>
                  <p className="text-gray-600">
                    Contact the shop where you placed your order. They can provide your tracking number or track
                    the order for you.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">How often is tracking updated?</h3>
                  <p className="text-gray-600">
                    Tracking information is updated in real-time as your order progresses through the delivery process.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Who do I contact if there's an issue with my delivery?</h3>
                  <p className="text-gray-600">
                    Please contact the shop where you placed your order first. If they can't resolve the issue,
                    you can contact our support team at support@etracking.store.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
