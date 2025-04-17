'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SchemaCheckPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaData, setSchemaData] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<string>('orders');
  const [tables, setTables] = useState<string[]>(['profiles', 'customers', 'orders', 'order_history']);

  useEffect(() => {
    checkSchema();
  }, [selectedTable]);

  const checkSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/check-schema?table=${selectedTable}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to check schema');
      }
      
      setSchemaData(data);
    } catch (err: any) {
      console.error('Error checking schema:', err);
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
            <h1 className="text-2xl font-bold text-gray-900">Database Schema Check</h1>
            <div className="flex space-x-4">
              <Link 
                href="/diagnostic" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Diagnostic Tool
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
            This page checks the database schema to help diagnose issues.
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Table
            </label>
            <div className="flex space-x-2">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
              <button
                onClick={checkSchema}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Checking...' : 'Check Schema'}
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : schemaData && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Schema for {selectedTable}</h2>
              
              {schemaData.tables[selectedTable] && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-2">Columns</h3>
                    <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {schemaData.tables[selectedTable].columns?.map((column: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{column.column_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.data_type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.is_nullable}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-2">Sample Data</h3>
                    <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                      <pre className="text-xs text-gray-700">{JSON.stringify(schemaData.tables[selectedTable].sample, null, 2)}</pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-2">RLS Policies</h3>
                    <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                      <pre className="text-xs text-gray-700">{JSON.stringify(schemaData.tables[selectedTable].policies, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-8 bg-blue-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Debugging Information</h2>
            
            <div className="space-y-3 text-sm text-blue-800">
              <p>
                This page helps diagnose issues with the database schema. It shows:
              </p>
              
              <ol className="list-decimal list-inside space-y-2">
                <li>Column definitions for each table</li>
                <li>Sample data from each table</li>
                <li>RLS policies applied to each table</li>
              </ol>
              
              <p>
                If you're seeing errors about missing columns, check the column definitions
                to confirm if the column exists in the table.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
