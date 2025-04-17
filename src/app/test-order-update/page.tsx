'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function TestOrderUpdatePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, tracking_number, status')
        .limit(10);
      
      if (error) throw error;
      
      setOrders(data || []);
      
      if (data && data.length > 0) {
        setSelectedOrderId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'driver')
        .limit(10);
      
      if (error) throw error;
      
      setDrivers(data || []);
      
      if (data && data.length > 0) {
        setSelectedDriverId(data[0].id);
      } else {
        // If no drivers found, fetch any profile to use as a driver
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .limit(10);
        
        if (profilesError) throw profilesError;
        
        setDrivers(profiles || []);
        
        if (profiles && profiles.length > 0) {
          setSelectedDriverId(profiles[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      setError(err.message);
    }
  };

  const testOrderUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch(`/api/test-order-update?orderId=${selectedOrderId}&driverId=${selectedDriverId}`);
      const data = await response.json();
      
      console.log('Test order update response:', data);
      
      setResult(data);
      
      if (!data.success) {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error testing order update:', err);
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
            <h1 className="text-2xl font-bold text-gray-900">Test Order Update</h1>
            <div className="flex space-x-4">
              <Link 
                href="/qr-test" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                QR Test
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
            This page allows you to test the order update functionality directly.
          </p>
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
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
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Order and Driver</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.tracking_number || order.id} ({order.status})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.email} ({driver.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={testOrderUpdate}
              disabled={loading || !selectedOrderId || !selectedDriverId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Testing...' : 'Test Order Update'}
            </button>
          </div>
          
          {result && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Result</h2>
              
              <div className={`p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-medium mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Success' : 'Error'}
                </h3>
                
                <pre className="bg-white p-3 rounded-md text-xs overflow-x-auto max-h-96 overflow-y-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Debugging Information</h2>
            
            <div className="space-y-3 text-sm text-blue-800">
              <p>
                This page tests the order update functionality directly, bypassing the QR code scanning process.
                It helps identify if the issue is with the QR code scanning or with the order update API.
              </p>
              
              <p>
                If the test succeeds here but fails in the QR code test page, the issue is likely with the QR code scanning process.
                If it fails here as well, the issue is with the order update API itself.
              </p>
              
              <p>
                Check the browser console for detailed logs about what's happening during the test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
