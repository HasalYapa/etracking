'use client';

import React from 'react';
import QRCodeGenerator from './qr-code-generator';

interface OrderDetailsModalProps {
  order: any;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-medium text-gray-900">Order Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-lg font-semibold mb-4 border-b pb-2">Order Information</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 text-sm">Tracking Number</p>
                  <p className="font-medium">#{order.tracking_number}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Status</p>
                  <p className="font-medium">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'assigned' || order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                      {order.status === 'pending' ? 'Pending' :
                        order.status === 'assigned' ? 'Assigned' :
                        order.status === 'in_transit' ? 'In Transit' :
                        order.status === 'delivered' ? 'Delivered' :
                        'Unknown'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Date Created</p>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Items</p>
                  <p className="font-medium">{order.items}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 border-b pb-2">Customer Information</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 text-sm">Name</p>
                  <p className="font-medium">{order.customer?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Phone</p>
                  <p className="font-medium">{order.customer?.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Delivery Address</p>
                  <p className="font-medium">{order.delivery_address}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Driver</p>
                  <p className="font-medium">{order.driver ? order.driver.name : 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold mb-4 border-b pb-2">QR Code Tracking</h4>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <QRCodeGenerator
                  trackingNumber={order.id}
                  location={order.dispatch_location || 'Shop Location'}
                  includeDriverInfo={!!order.driver}
                  driverPhone={order.driver?.phone}
                />
              </div>
              <div className="flex-grow">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h5 className="font-medium text-blue-800 mb-2">How to use this QR code:</h5>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Print or share this QR code with your delivery driver</li>
                    <li>The driver can scan this code at pickup and delivery locations</li>
                    <li>Scanning updates the order status and location automatically</li>
                    <li>Customers can track their order in real-time</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
