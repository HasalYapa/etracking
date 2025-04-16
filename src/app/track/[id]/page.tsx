'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderWithRelations, OrderHistory } from '../../../types';
import { QRCodeSVG } from 'qrcode.react';

export default function TrackOrder({ params }: { params: { id: string } }) {
  const { id } = params;

  const [order, setOrder] = useState<OrderWithRelations & { history?: OrderHistory[] }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

    fetchOrderDetails();
  }, [id]);

  const getStatusPercentage = (status: string) => {
    switch(status) {
      case 'pending': return 0;
      case 'assigned': return 25;
      case 'picked_up': return 50;
      case 'in_transit': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-center mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm overflow-hidden p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error || 'Order not found'}</span>
          </div>
          <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Order #{order.tracking_number}</h1>
            <Link href="/" className="text-white hover:text-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
          </div>
          <p className="mt-2">Thank you for your order, {order.customers?.name}!</p>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Delivery Status</h2>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    {order.status === 'pending' ? 'Order Placed' :
                     order.status === 'assigned' ? 'Assigned to Driver' :
                     order.status === 'picked_up' ? 'Picked Up' :
                     order.status === 'in_transit' ? 'On the Way' :
                     order.status === 'delivered' ? 'Delivered' :
                     'Cancelled'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {getStatusPercentage(order.status)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div style={{ width: `${getStatusPercentage(order.status)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"></div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Delivery Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <div className="flex">
                  <span className="font-medium w-32">Delivery To:</span>
                  <span>{order.delivery_address}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-32">Shop:</span>
                  <span>{order.shops?.business_name || order.shops?.name}</span>
                </div>
                {order.drivers && (
                  <div className="flex">
                    <span className="font-medium w-32">Driver:</span>
                    <span>{order.drivers.name}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="font-medium w-32">Order Date:</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg">
                <div className="mb-2">
                  <QRCodeSVG
                    value={`/track/${order.tracking_number}`}
                    size={120}
                    level="H"
                    includeMargin={true}
                    bgColor={"#FFFFFF"}
                    fgColor={"#000000"}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">Share this QR code to track this order</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.shops?.phone && (
                <a href={`tel:${order.shops.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Shop
                </a>
              )}
              {order.drivers?.phone && order.status !== 'pending' && (
                <a href={`tel:${order.drivers.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Driver
                </a>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {order.history && order.history.length > 0 ? (
                order.history.map((event, index) => (
                  <div key={event.id} className="flex">
                    <div className="mr-4 flex flex-col items-center">
                      <div className={`rounded-full h-4 w-4 ${event.status === order.status ? 'bg-blue-600' : 'bg-blue-200'}`}></div>
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
                <p className="text-gray-500">No timeline events available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
