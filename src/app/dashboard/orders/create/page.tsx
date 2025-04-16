'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import QRCodeGenerator from '../../../../components/qr-code-generator';

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

      // Create customer first
      // Check if customer already exists by phone number
      const { data: existingCustomers, error: customerCheckError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', formData.customerPhone)
        .eq('shop_id', user.id);

      if (customerCheckError) {
        console.error('Error checking for existing customer:', customerCheckError);
        throw customerCheckError;
      }

      let customerData;

      if (existingCustomers && existingCustomers.length > 0) {
        // Use existing customer
        console.log('Using existing customer:', existingCustomers[0]);
        customerData = existingCustomers[0];
      } else {
        // Create new customer
        console.log('Creating new customer with shop_id:', user.id);

        const { data: newCustomer, error: customerCreateError } = await supabase
          .from('customers')
          .insert({
            name: formData.customerName,
            phone: formData.customerPhone,
            email: formData.customerEmail || null,
            address: formData.deliveryAddress, // Using delivery address as customer address
            shop_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (customerCreateError) {
          console.error('Error creating customer:', customerCreateError);
          throw customerCreateError;
        }

        customerData = newCustomer;
      }

      console.log('Customer data for order:', customerData);

      // Create order with customer_id
      // First, let's verify the customer exists
      if (!customerData || !customerData.id) {
        console.error('Customer data is invalid:', customerData);
        throw new Error('Invalid customer data. Please create a customer first.');
      }

      // Get all customers to find a valid one if needed
      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('id')
        .limit(10);

      if (customersError) {
        console.error('Error fetching customers:', customersError);
      }

      // Use a fallback customer ID if needed
      const fallbackCustomerId = allCustomers && allCustomers.length > 0
        ? allCustomers[0].id
        : '3fd56aed-bd9d-44e9-b6ba-8f85a9c0610b'; // Hardcoded ID from a known customer

      const orderInsertData = {
        tracking_number: trackingNumber,
        shop_id: user.id,
        customer_id: customerData.id || fallbackCustomerId, // Use fallback if needed
        driver_id: formData.driverId || null,
        status: 'pending',
        delivery_address: formData.deliveryAddress,
        delivery_notes: formData.deliveryNotes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Creating order with data:', orderInsertData);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();

      console.log('Order creation result:', { orderData, orderError });

      if (orderError) {
        throw orderError;
      }

      // Customer already created above

      // Make sure we have a valid user ID for the order history
      // Get all profiles to find a valid user ID
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .limit(10);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw new Error('Failed to fetch profiles for order history');
      }

      if (!allProfiles || allProfiles.length === 0) {
        console.error('No profiles found in the database');
        throw new Error('No profiles found for order history');
      }

      // Find a shop owner or use the first profile
      const shopOwner = allProfiles.find(p => p.role === 'shop_owner') || allProfiles[0];
      const updatedById = (user && user.id) ? user.id : shopOwner.id;

      console.log('Using updated_by ID:', updatedById, 'from user:', shopOwner);

      // Create order history entry with explicit updated_by field
      const historyData = {
        order_id: orderData.id,
        status: 'pending',
        notes: 'Order created',
        created_at: new Date().toISOString(),
        updated_by: updatedById // This MUST NOT be null
      };

      console.log('Creating order history with data:', historyData);

      // Try multiple approaches to create order history
      let historySuccess = false;

      // Attempt 1: Use the API endpoint
      try {
        const historyResponse = await fetch('/api/create-order-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(historyData),
        });

        const historyResult = await historyResponse.json();

        if (!historyResult.success) {
          console.error('Error creating order history via API:', historyResult);
          throw new Error(historyResult.error || 'Failed to create order history');
        }

        console.log('Order history created successfully via API:', historyResult);
        historySuccess = true;
      } catch (apiError: any) {
        console.error('API approach failed:', apiError);

        // Attempt 2: Direct insert
        try {
          const { error: directError } = await supabase
            .from('order_history')
            .insert({
              order_id: orderData.id,
              status: 'pending',
              notes: 'Order created (direct insert)',
              created_at: new Date().toISOString(),
              updated_by: updatedById
            });

          if (directError) {
            console.error('Direct insert failed:', directError);
            throw directError;
          }

          console.log('Order history created successfully via direct insert');
          historySuccess = true;
        } catch (directError: any) {
          console.error('Direct insert failed:', directError);

          // Attempt 3: Minimal insert
          try {
            const { error: minimalError } = await supabase
              .from('order_history')
              .insert({
                order_id: orderData.id,
                status: 'pending',
                updated_by: updatedById
              });

            if (minimalError) {
              console.error('Minimal insert failed:', minimalError);
              throw minimalError;
            }

            console.log('Order history created successfully via minimal insert');
            historySuccess = true;
          } catch (minimalError: any) {
            console.error('All attempts failed:', apiError, directError, minimalError);
            throw new Error(`Failed to create order history after multiple attempts`);
          }
        }
      }

      // Order history is now created via API call above

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
