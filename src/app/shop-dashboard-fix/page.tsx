'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function ShopDashboardFixPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [mockData, setMockData] = useState<boolean>(false);
  const [fixApplied, setFixApplied] = useState<boolean>(false);
  const [shopDashboardCode, setShopDashboardCode] = useState<string>('');

  useEffect(() => {
    checkCurrentSetup();
  }, []);

  const checkCurrentSetup = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setUserData(user);

      // Check if shop-dashboard page is using mock data
      const response = await fetch('/shop-dashboard');
      const html = await response.text();
      
      // Look for indicators of mock data
      const hasMockData = html.includes('allMockOrders') || 
                          html.includes('mockOrders') || 
                          html.includes('John Doe') ||
                          html.includes('Jane Smith') ||
                          html.includes('Alice Brown');
      
      setMockData(hasMockData);
      
      // Get the shop dashboard code
      try {
        const codeResponse = await fetch('/api/get-file-content?path=src/app/shop-dashboard/page.tsx');
        const codeData = await codeResponse.json();
        if (codeData.content) {
          setShopDashboardCode(codeData.content);
        }
      } catch (codeErr) {
        console.error('Could not fetch shop dashboard code:', codeErr);
      }

    } catch (err: any) {
      console.error('Error checking setup:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFix = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the API to apply the fix
      const response = await fetch('/api/fix-shop-dashboard', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply fix');
      }

      setFixApplied(true);
      await checkCurrentSetup();

    } catch (err: any) {
      console.error('Error applying fix:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Create a test customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: 'Test Customer',
          phone: '123-456-7890',
          email: 'test@example.com',
          address: 'Test Address',
          shop_id: user.id
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Generate a tracking number
      const trackingNumber = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;

      // Create a test order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          shop_id: user.id,
          customer_id: customer.id,
          status: 'pending',
          delivery_address: 'Test Delivery Address',
          delivery_notes: 'Test order created from shop dashboard fix tool',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order history
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Test order created',
          created_at: new Date().toISOString(),
          updated_by: user.id
        });

      if (historyError) {
        // Try with a hardcoded shop owner ID if the first attempt fails
        const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59'; // Sampath
        
        const { error: fallbackError } = await supabase
          .from('order_history')
          .insert({
            order_id: order.id,
            status: 'pending',
            notes: 'Test order created (fallback)',
            created_at: new Date().toISOString(),
            updated_by: shopOwnerId
          });
          
        if (fallbackError) throw fallbackError;
      }

      alert('Test order created successfully! Please go to the shop dashboard to check if it appears.');
    } catch (err: any) {
      console.error('Error creating test order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shop Dashboard Fix Tool</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool helps diagnose and fix issues with the shop dashboard, particularly when it's showing mock data instead of real data from the database.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Current Status</h2>
          <button
            onClick={checkCurrentSetup}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Checking...' : 'Check Again'}
          </button>
        </div>

        {userData ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Diagnostic Information</h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userData.id}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userData.email}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Using Mock Data</dt>
                  <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    {mockData ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Yes - Shop dashboard is using mock data
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        No - Shop dashboard is using real data
                      </span>
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Fix Status</dt>
                  <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    {fixApplied ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Fix has been applied
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Fix not yet applied
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <p className="text-yellow-700">No user data available. Are you logged in?</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Fix Shop Dashboard</h2>
          <p className="text-gray-600 mb-4">
            If your shop dashboard is showing mock data (John Doe, Jane Smith, etc.) instead of your actual orders, 
            click the button below to fix it. This will update the shop dashboard to use real data from your Supabase database.
          </p>
          <button
            onClick={applyFix}
            disabled={loading || !mockData}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? 'Applying Fix...' : 'Apply Fix to Shop Dashboard'}
          </button>
          {!mockData && (
            <p className="text-sm text-gray-500 mt-2">
              The shop dashboard appears to be using real data already. No fix needed.
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Create Test Order</h2>
          <p className="text-gray-600 mb-4">
            Create a test order to verify that the shop dashboard can display real data from the database.
            After creating the test order, go to the shop dashboard to see if it appears.
          </p>
          <button
            onClick={createTestOrder}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Creating Order...' : 'Create Test Order'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            This will create a test customer and order in your database.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Check if your shop dashboard is using mock data or real data</li>
          <li>If it's using mock data, apply the fix using the button above</li>
          <li>Create a test order to verify that the fix worked</li>
          <li>Go to the <a href="/shop-dashboard" className="text-blue-600 hover:underline">Shop Dashboard</a> and check if your test order appears</li>
          <li>If the test order doesn't appear, try refreshing the page</li>
          <li>If you still have issues, check the <a href="/data-verify" className="text-blue-600 hover:underline">Data Verification Tool</a> to see what's in your database</li>
        </ol>
      </div>

      {shopDashboardCode && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Current Shop Dashboard Code</h2>
          <div className="bg-gray-800 text-white p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-sm">
              {shopDashboardCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
