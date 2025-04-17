'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getOrdersWithRelations, getCustomersWithRelations, getOrderHistoryWithRelations } from '@/utils/supabase-helpers';

export default function DataVerificationPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<string>('orders');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [shopId, setShopId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [includeRelations, setIncludeRelations] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (session) {
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) throw profileError;
        
        setProfile(profileData);
        
        // Set default shop ID if the user is a shop owner
        if (profileData.role === 'shop_owner') {
          setShopId(profileData.id);
        }
      }
    } catch (err: any) {
      console.error('Error checking session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      setQueryResults(null);
      
      let result;
      
      if (selectedTable === 'orders') {
        result = await getOrdersWithRelations({
          shopId: shopId || undefined,
          driverId: driverId || undefined,
          customerId: customerId || undefined,
          includeCustomer: includeRelations,
          includeShop: includeRelations,
          includeDriver: includeRelations,
          includeHistory: includeRelations,
          limit: 10
        });
      } else if (selectedTable === 'customers') {
        result = await getCustomersWithRelations({
          shopId: shopId || undefined,
          customerId: customerId || undefined,
          includeShop: includeRelations,
          includeOrders: includeRelations,
          limit: 10
        });
      } else if (selectedTable === 'order_history') {
        result = await getOrderHistoryWithRelations({
          orderId: orderId || undefined,
          updatedBy: shopId || undefined,
          includeOrder: includeRelations,
          includeUpdatedBy: includeRelations,
          limit: 10
        });
      } else {
        // Fallback to a simple query
        result = await supabase
          .from(selectedTable)
          .select('*')
          .limit(10);
      }
      
      if (result.error) throw result.error;
      
      setQueryResults({
        data: result.data,
        count: result.data?.length || 0
      });
    } catch (err: any) {
      console.error('Error running query:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!shopId) {
        throw new Error('Shop ID is required to create a test order');
      }
      
      // First, create a test customer
      const { data: customerData, error: customerError } = await supabase
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
      
      if (customerError) throw customerError;
      
      // Generate a random tracking number
      const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const trackingNumber = `TEST-${randomNum}`;
      
      // Create a test order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          shop_id: shopId,
          customer_id: customerData.id,
          status: 'pending',
          delivery_address: 'Test Delivery Address',
          delivery_notes: 'Test order created from data verification tool',
          tracking_number: trackingNumber
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create an order history entry
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: orderData.id,
          status: 'pending',
          notes: 'Test order created',
          updated_by: shopId
        });
      
      if (historyError) throw historyError;
      
      // Run the query to show the new order
      setSelectedTable('orders');
      setOrderId(orderData.id);
      await runQuery();
      
      alert(`Test order created successfully with tracking number: ${trackingNumber}`);
    } catch (err: any) {
      console.error('Error creating test order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Data Verification Tool</h1>
            <div className="flex space-x-4">
              <Link 
                href="/database-manager" 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Database Manager
              </Link>
              <Link 
                href="/supabase-analyzer" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Supabase Analyzer
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
            This tool helps verify your data relationships and test queries using explicit joins.
          </p>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* User Profile */}
          {profile && (
            <div className="mb-6 bg-blue-50 p-4 rounded-md">
              <h2 className="text-md font-medium text-blue-900 mb-2">Logged in as:</h2>
              <div className="text-sm text-blue-800">
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                <p><strong>ID:</strong> {profile.id}</p>
              </div>
            </div>
          )}
          
          {/* Query Builder */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Query Builder</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="orders">Orders</option>
                    <option value="customers">Customers</option>
                    <option value="order_history">Order History</option>
                    <option value="profiles">Profiles</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include Relations
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeRelations}
                      onChange={(e) => setIncludeRelations(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Include related tables in the query
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shop ID
                  </label>
                  <input
                    type="text"
                    value={shopId}
                    onChange={(e) => setShopId(e.target.value)}
                    placeholder="Enter shop ID (UUID)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="Enter customer ID (UUID)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter order ID (UUID)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver ID
                  </label>
                  <input
                    type="text"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    placeholder="Enter driver ID (UUID)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={runQuery}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Running...' : 'Run Query'}
                </button>
                
                <button
                  onClick={createTestOrder}
                  disabled={loading || !shopId}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  Create Test Order
                </button>
              </div>
            </div>
          </div>
          
          {/* Query Results */}
          {queryResults && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Query Results</h2>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Rows returned:</strong> {queryResults.count}
                </p>
                <div className="overflow-x-auto">
                  <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded-md max-h-96 overflow-y-auto">
                    {JSON.stringify(queryResults.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Using Explicit Joins</h2>
            
            <div className="space-y-3 text-sm text-blue-800">
              <p>
                This tool uses helper functions that implement explicit joins to avoid the "Could not find a relationship" error.
                You can find these functions in <code className="bg-blue-100 px-1">src/utils/supabase-helpers.ts</code>.
              </p>
              
              <p>
                Example of using explicit joins:
              </p>
              
              <pre className="bg-blue-100 p-2 rounded-md">
                <code className="text-xs font-mono">
{`// Get orders with related data
const { data, error } = await getOrdersWithRelations({
  shopId: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59',
  includeCustomer: true,
  includeShop: true,
  includeDriver: true,
  includeHistory: true
});`}
                </code>
              </pre>
              
              <p>
                These helper functions use the correct syntax for joins and handle the relationship errors gracefully.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
