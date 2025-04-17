'use client';

import { useState } from 'react';
import Link from 'next/link';
import QRCodeGenerator from '@/components/qr-code-generator';
import Html5QRScanner from '@/components/Html5QrScanner';
import { supabase } from '@/lib/supabase';

export default function QRTestPage() {
  const [testOrderId, setTestOrderId] = useState('');
  const [testLocation, setTestLocation] = useState('Test Location');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Create a test order
  const createTestOrder = async () => {
    setLoading(true);
    setScanError(null);
    setScanSuccess(null);
    try {
      // First, get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScanError('You must be logged in to create a test order.');
        return;
      }

      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        throw new Error('Could not get user profile: ' + profileError.message);
      }

      // Determine shop ID based on user role
      let shopId = profile.id;
      if (profile.role !== 'shop_owner') {
        // If not a shop owner, find a shop owner
        const { data: shopOwners, error: shopOwnersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'shop_owner')
          .limit(1);

        if (shopOwnersError || !shopOwners || shopOwners.length === 0) {
          throw new Error('Could not find a shop owner to create a test order');
        }

        shopId = shopOwners[0].id;
      }

      // Create a test customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: 'Test Customer',
          phone: '+94760000000',
          email: 'test@example.com',
          address: 'Test Address',
          shop_id: shopId
        })
        .select()
        .single();

      if (customerError) {
        throw new Error('Could not create test customer: ' + customerError.message);
      }

      // Generate a random tracking number
      const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const trackingNumber = `TEST-${randomNum}`;

      // Create a test order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          shop_id: shopId,
          customer_id: customer.id,
          status: 'pending',
          delivery_address: 'Test Delivery Address',
          delivery_notes: 'Test order created from QR Test page',
          tracking_number: trackingNumber
        })
        .select()
        .single();

      if (orderError) {
        throw new Error('Could not create test order: ' + orderError.message);
      }

      // Create an order history entry
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Test order created',
          updated_by: session.user.id
        });

      if (historyError) {
        console.error('Could not create order history entry:', historyError);
        // Continue anyway
      }

      setScanSuccess(`Test order created successfully with tracking number: ${trackingNumber}`);

      // Now fetch the orders including the new one
      fetchSampleOrder();
    } catch (err: any) {
      console.error('Error creating test order:', err);
      setScanError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a sample order to test with
  const fetchSampleOrder = async () => {
    setLoading(true);
    setScanError(null);
    setScanSuccess(null);
    try {
      // Add console log to see what's happening
      console.log('Fetching sample orders...');

      // Use a simpler query to avoid any potential issues
      const { data, error } = await supabase
        .from('orders')
        .select('id, tracking_number')
        .limit(5);

      console.log('Fetch result:', { data, error });

      if (error) throw error;

      // If we got data, use it
      if (data && data.length > 0) {
        setOrders(data);
        setTestOrderId(data[0].id);
        console.log('Setting test order ID:', data[0].id);
      } else {
        // If no orders found, show an error
        setScanError('No orders found. Please create a test order first.');
      }
    } catch (err: any) {
      console.error('Error fetching sample order:', err);
      setScanError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle QR code scan
  const handleScan = async (data: { trackingNumber: string; location: string; driverPhone?: string; orderId?: string }) => {
    console.log('QR code scanned with data:', data);
    try {
      setScanResult(data);
      setScanError(null);
      setScanSuccess(null);

      // Get current user profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScanError('You must be logged in to update order status.');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(profileData);

      if (!profileData) {
        setScanError('Profile not found.');
        return;
      }

      // Get current location if available
      let latitude = null;
      let longitude = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (err) {
        console.log('Geolocation not available or denied');
      }

      // Show processing message
      setScanSuccess('Processing scan... Please wait.');

      // Try to find the order by ID first (if it's a UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(data.trackingNumber) || data.orderId) {
        const orderId = data.orderId || data.trackingNumber;

        // Use .eq() without .single() to avoid the "JSON object requested" error
        const { data: orderByIdData, error: orderByIdError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId);

        console.log('Order by ID query result:', { orderByIdData, orderByIdError });

        if (!orderByIdError && orderByIdData && orderByIdData.length > 0) {
          const orderData = orderByIdData[0]; // Take the first matching order
          console.log('Found order by ID from QR code:', orderData);

          // Update the order status to in_transit
          // Make sure we have a valid driver ID
          const driverId = profileData?.id || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e'; // Default driver ID

          const requestBody = {
            orderId: orderData.id,
            status: 'in_transit',
            driverId: driverId,
            latitude,
            longitude,
          };

          console.log('Sending update request with data:', requestBody);

          const response = await fetch('/api/update-order-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const result = await response.json();
          console.log('Update response:', { status: response.status, result });

          if (!response.ok) {
            throw new Error(result.error || 'Failed to update order status');
          }

          // Update success message with more details
          setScanSuccess(`Successfully updated order status for order ${orderData.tracking_number} from ${result.previousStatus} to in_transit`);
          return;
        } else {
          console.error('Error finding order by ID from QR code:', orderByIdError || 'No matching order found');
          // Continue to try by tracking number
        }
      }

      // Try to find the order by tracking number
      const { data: ordersByTracking, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_number', data.trackingNumber);

      console.log('Order by tracking number query result:', { ordersByTracking, orderError });

      if (orderError || !ordersByTracking || ordersByTracking.length === 0) {
        throw new Error(`Order with tracking number ${data.trackingNumber} not found`);
      }

      const orderData = ordersByTracking[0]; // Take the first matching order
      console.log('Found order by tracking number:', orderData);

      // Update the order status to in_transit
      // Make sure we have a valid driver ID
      const driverId = profileData?.id || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e'; // Default driver ID

      const requestBody = {
        orderId: orderData.id,
        status: 'in_transit',
        driverId: driverId,
        latitude,
        longitude,
      };

      console.log('Sending update request with data (tracking number lookup):', requestBody);

      const response = await fetch('/api/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('Update response (tracking number lookup):', { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update order status');
      }

      // Update success message with more details
      setScanSuccess(`Successfully updated order status for order ${orderData.tracking_number} from ${result.previousStatus} to in_transit`);
    } catch (err: any) {
      console.error('Error processing QR code:', err);
      setScanError(err.message || 'An error occurred while updating the order status');
    }
  };

  // Handle scan error
  const handleScanError = (errorMessage: string) => {
    setScanError(errorMessage);
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">QR Code Test Page</h1>
            <div className="flex space-x-4">
              <Link
                href="/database-manager"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Database Manager
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            This page allows you to test QR code generation and scanning functionality.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* QR Code Generator Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate QR Code</h2>

              <div className="mb-4 flex space-x-2">
                <button
                  onClick={fetchSampleOrder}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Fetch Sample Order'}
                </button>

                <button
                  onClick={createTestOrder}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Create Test Order'}
                </button>

                <button
                  onClick={() => {
                    // Use a hardcoded UUID for testing
                    setTestOrderId('00000000-0000-0000-0000-000000000000');
                    setScanSuccess('Using test order ID for QR code generation');
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Use Test ID
                </button>
              </div>

              {orders.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Order
                  </label>
                  <select
                    value={testOrderId}
                    onChange={(e) => setTestOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.tracking_number} (ID: {order.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={testLocation}
                  onChange={(e) => setTestLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {scanError && (
                <div className="mt-4 mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{scanError}</p>
                    </div>
                  </div>
                </div>
              )}

              {scanSuccess && (
                <div className="mt-4 mb-4 bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{scanSuccess}</p>
                    </div>
                  </div>
                </div>
              )}

              {testOrderId && (
                <div className="flex justify-center">
                  <QRCodeGenerator
                    trackingNumber={testOrderId}
                    location={testLocation}
                  />
                </div>
              )}
            </div>

            {/* QR Code Scanner Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h2>

              {!showScanner ? (
                <button
                  onClick={() => {
                    setShowScanner(true);
                    setScanError(null);
                    setScanSuccess(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Open Scanner
                </button>
              ) : (
                <div>
                  <button
                    onClick={() => {
                      setShowScanner(false);
                      // Give time for the scanner to clean up
                      setTimeout(() => {
                        console.log('Scanner cleanup complete');
                      }, 500);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mb-4"
                  >
                    Close Scanner
                  </button>

                  <Html5QRScanner
                    key={`scanner-instance-${Date.now()}`} // Force new instance each time
                    onScan={handleScan}
                    onError={handleScanError}
                  />
                </div>
              )}

              {/* Error and success messages are now shown in the QR Code Generator section */}

              {scanResult && (
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Scan Result:</h3>
                  <pre className="text-xs bg-white p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(scanResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-blue-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">How QR Code Functionality Works</h2>

            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <h3 className="font-medium mb-1">1. QR Code Generation</h3>
                <p>
                  QR codes are generated with order information (ID, location, etc.) and can be printed or shared with drivers.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">2. QR Code Scanning</h3>
                <p>
                  Drivers scan QR codes using their mobile devices to update order status.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">3. Order Status Updates</h3>
                <p>
                  When a QR code is scanned, the order status is updated in the database and an order history entry is created.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">4. Real-time Updates</h3>
                <p>
                  Status updates are reflected in real-time across shop and driver dashboards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
