'use client';

import { useState } from 'react';

export default function DirectCreateOrderPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    deliveryNotes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/direct-create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      setResult(data);
      
      if (!data.success) {
        setError(data.error || 'Unknown error occurred');
      } else {
        // Clear form on success
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          deliveryAddress: '',
          deliveryNotes: ''
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      console.error('Error creating order:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Direct Order Creation</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> This tool creates orders directly in the database, bypassing normal application logic.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Order</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Phone *
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address *
              </label>
              <input
                type="text"
                id="deliveryAddress"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="deliveryNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Notes
              </label>
              <textarea
                id="deliveryNotes"
                name="deliveryNotes"
                value={formData.deliveryNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
        
        <div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
              {result?.details && (
                <pre className="mt-2 text-sm overflow-auto max-h-40">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
              {result?.sdkError && (
                <div className="mt-2">
                  <p>SDK Error:</p>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(result.sdkError, null, 2)}
                  </pre>
                </div>
              )}
              {result?.restError && (
                <div className="mt-2">
                  <p>REST Error:</p>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                    {result.restError}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {result && result.success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Success!</p>
              <p>{result.message}</p>
              
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Order Details:</h2>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(result.order, null, 2)}
                </pre>
                
                <h2 className="text-lg font-semibold mt-4 mb-2">Customer Details:</h2>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(result.customer, null, 2)}
                </pre>
                
                <h2 className="text-lg font-semibold mt-4 mb-2">Order History:</h2>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(result.history, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
