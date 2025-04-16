'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import QRCodeGenerator from '../../../../../components/qr-code-generator';

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [shopLocation, setShopLocation] = useState('');
  const [newOrderId, setNewOrderId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    deliveryNotes: '',
    driverId: '',
  });

  // Fetch drivers on component mount
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Get shop location from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name, address')
          .eq('id', user.id)
          .single();

        if (profile) {
          setShopLocation(`${profile.business_name}, ${profile.address}`);
        }

        // Fetch drivers
        const { data: driversData, error: driversError } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .eq('role', 'driver')
          .eq('shop_id', user.id);

        if (driversError) {
          throw driversError;
        }

        setDrivers(driversData || []);
      } catch (err: any) {
        console.error('Error fetching drivers:', err);
        setError(err.message);
      }
    };

    fetchDrivers();
  }, [router]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Generate tracking number
      const trackingNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          shop_id: user.id,
          driver_id: formData.driverId || null,
          status: 'pending',
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail || null,
          delivery_address: formData.deliveryAddress,
          delivery_notes: formData.deliveryNotes || null,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          dispatch_location: shopLocation,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create customer if doesn't exist
      const { error: customerError } = await supabase
        .from('customers')
        .upsert({
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail || null,
          shop_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (customerError) {
        console.error('Error creating customer:', customerError);
      }

      // Create order history entry
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: orderData.id,
          status: 'pending',
          notes: 'Order created',
          created_at: new Date().toISOString(),
        });

      if (historyError) {
        console.error('Error creating order history:', historyError);
      }

      setSuccess(true);
      setOrderCreated(true);
      setNewOrderId(orderData.id);

      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        deliveryAddress: '',
        deliveryNotes: '',
        driverId: '',
      });

    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Order</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && !orderCreated && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Order created successfully!
        </div>
      )}

      {orderCreated && newOrderId ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-600">Order Created Successfully!</h2>

          <div className="mb-6">
            <p className="text-gray-700 mb-2">Your order has been created. You can now:</p>
            <ul className="list-disc list-inside text-gray-600 ml-4">
              <li>Print or share the QR code with your driver</li>
              <li>Track the order status</li>
              <li>Update the order details if needed</li>
            </ul>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <QRCodeGenerator
                trackingNumber={newOrderId}
                location={shopLocation}
                size={200}
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Next Steps:</h3>
                <p className="text-gray-600 mb-4">
                  Share this QR code with your driver. When they arrive at the pickup location,
                  they can scan this code to update the order status.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => router.push(`/dashboard/orders/${newOrderId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Order Details
                </button>

                <button
                  onClick={() => {
                    setOrderCreated(false);
                    setNewOrderId(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Create Another Order
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Customer Information</h2>

              <div className="mb-4">
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Delivery Information</h2>

              <div className="mb-4">
                <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  id="deliveryAddress"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="deliveryNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Notes
                </label>
                <textarea
                  id="deliveryNotes"
                  name="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Driver Assignment */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Driver Assignment</h2>

            <div className="mb-4">
              <label htmlFor="driverId" className="block text-sm font-medium text-gray-700 mb-1">
                Assign Driver (Optional)
              </label>
              <select
                id="driverId"
                name="driverId"
                value={formData.driverId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a driver</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.phone})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                You can assign a driver now or later from the order details page.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
