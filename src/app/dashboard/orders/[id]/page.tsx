'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import { OrderWithRelations, OrderHistory, Profile } from '../../../../types';
import QRCodeGenerator from '@/components/qr-code-generator';

export default function OrderDetails({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderWithRelations & { history?: OrderHistory[] }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Fetch order details
  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/orders/${id}`);
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setOrder(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchOrderDetails();
    }
  }, [id, authLoading]);

  // Fetch drivers when assign modal is opened
  useEffect(() => {
    async function fetchDrivers() {
      try {
        const response = await fetch('/api/drivers');
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setDrivers(data.data || []);
      } catch (err: any) {
        console.error('Error fetching drivers:', err.message);
      }
    }

    if (showAssignModal) {
      fetchDrivers();
    }
  }, [showAssignModal]);

  const handleAssignDriver = async () => {
    if (!selectedDriver) {
      setAssignError('Please select a driver');
      return;
    }

    setIsAssigning(true);
    setAssignError('');

    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'assigned',
          driver_id: selectedDriver,
          notes: 'Order assigned to driver'
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update the order with the new data
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          ...data.data,
          drivers: drivers.find(d => d.id === selectedDriver)
        };
      });

      setShowAssignModal(false);
    } catch (err: any) {
      setAssignError(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-orange-100 text-orange-800';
      case 'picked_up':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <p className="text-gray-500">Order not found.</p>
            <div className="mt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Order #{order.tracking_number}</h1>
          </div>
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            {order.status === 'pending' && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Assign Driver
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm md:col-span-2">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Order ID</p>
                <p className="font-medium">{order.tracking_number}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Date Created</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Status</p>
                <p className="font-medium">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Last Updated</p>
                <p className="font-medium">{formatDate(order.updated_at)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 text-sm">Name</p>
                <p className="font-medium">{order.customers?.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Phone</p>
                <p className="font-medium">{order.customers?.phone}</p>
              </div>
              {order.customers?.email && (
                <div>
                  <p className="text-gray-500 text-sm">Email</p>
                  <p className="font-medium">{order.customers.email}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 text-sm">Address</p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm md:col-span-2">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Delivery Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Delivery Address</p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>
              {order.delivery_notes && (
                <div>
                  <p className="text-gray-500 text-sm">Delivery Notes</p>
                  <p className="font-medium">{order.delivery_notes}</p>
                </div>
              )}
              {order.estimated_delivery && (
                <div>
                  <p className="text-gray-500 text-sm">Estimated Delivery</p>
                  <p className="font-medium">{formatDate(order.estimated_delivery)}</p>
                </div>
              )}
              {order.drivers && (
                <div>
                  <p className="text-gray-500 text-sm">Driver</p>
                  <p className="font-medium">{order.drivers.name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Tracking Link</h2>
            <p className="text-gray-500 text-sm mb-2">Share this link with your customer:</p>
            <div className="flex items-center bg-gray-100 p-2 rounded">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/track/${order.tracking_number}`}
                className="bg-transparent flex-grow outline-none text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/track/${order.tracking_number}`);
                  alert('Tracking link copied to clipboard!');
                }}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">QR Code Tracking</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <QRCodeGenerator
                trackingNumber={order.id}
                location={order.dispatch_location || order.shops?.business_name || ''}
                includeDriverInfo={!!order.drivers}
                driverPhone={order.drivers?.phone}
              />
            </div>
            <div className="flex-grow">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-800 mb-2">How to use this QR code:</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Print or share this QR code with your delivery driver</li>
                  <li>The driver can scan this code at pickup and delivery locations</li>
                  <li>Scanning updates the order status and location automatically</li>
                  <li>Customers can track their order in real-time</li>
                </ol>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/tracking?id=${order.tracking_number}`}
                  target="_blank"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Tracking Page
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Order Timeline</h2>
          <div className="space-y-4">
            {order.history && order.history.length > 0 ? (
              order.history.map((event, index) => (
                <div key={event.id} className="flex">
                  <div className="mr-4 flex flex-col items-center">
                    <div className={`rounded-full h-4 w-4 ${index === 0 ? 'bg-blue-600' : 'bg-blue-200'}`}></div>
                    {index < order.history!.length - 1 && <div className="h-full w-0.5 bg-blue-200"></div>}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-gray-500">{formatDate(event.created_at)}</p>
                    <p className="font-medium">{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</p>
                    {event.notes && <p className="text-gray-600">{event.notes}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No timeline events found.</p>
            )}
          </div>
        </div>

        {/* Assign Driver Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex justify-between items-center p-5 border-b">
                <h3 className="text-xl font-medium text-gray-900">Assign Driver</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                {assignError && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{assignError}</span>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="driverId" className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
                  <select
                    id="driverId"
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a driver</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignDriver}
                    disabled={isAssigning}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isAssigning ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Assigning...
                      </>
                    ) : 'Assign Driver'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
