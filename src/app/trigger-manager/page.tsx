'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TriggerManagerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('orders');
  const [tables, setTables] = useState<string[]>(['profiles', 'customers', 'orders', 'order_history']);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  useEffect(() => {
    checkTriggers();
  }, [selectedTable]);

  const checkTriggers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/check-triggers?table=${selectedTable}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to check triggers');
      }
      
      setTriggers(data.triggers || []);
    } catch (err: any) {
      console.error('Error checking triggers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrigger = async (triggerName: string, enable: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/disable-trigger?table=${selectedTable}&trigger=${triggerName}&action=${enable ? 'enable' : 'disable'}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || `Failed to ${enable ? 'enable' : 'disable'} trigger`);
      }
      
      // Refresh the triggers
      checkTriggers();
    } catch (err: any) {
      console.error(`Error ${enable ? 'enabling' : 'disabling'} trigger:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeSql = async () => {
    try {
      setSqlLoading(true);
      setSqlResult(null);
      setError(null);
      
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: sqlQuery,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute SQL');
      }
      
      setSqlResult(data.result);
      
      // Refresh the triggers if the SQL might have affected them
      if (sqlQuery.toLowerCase().includes('trigger') || 
          sqlQuery.toLowerCase().includes('function')) {
        checkTriggers();
      }
    } catch (err: any) {
      console.error('Error executing SQL:', err);
      setError(err.message);
    } finally {
      setSqlLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Database Trigger Manager</h1>
            <div className="flex space-x-4">
              <Link 
                href="/schema-check" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Schema Check
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
            This page allows you to manage database triggers.
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
                onClick={checkTriggers}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Checking...' : 'Check Triggers'}
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
          ) : (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Triggers for {selectedTable}</h2>
              
              {triggers.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-md text-gray-500">
                  No triggers found for this table.
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timing</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Function</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enabled</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {triggers.map((trigger: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trigger.trigger_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trigger.trigger_timing}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trigger.trigger_event}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trigger.trigger_function}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {trigger.enabled === 'O' ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => toggleTrigger(trigger.trigger_name, trigger.enabled !== 'O')}
                              className={`px-3 py-1 text-xs font-medium rounded-md ${
                                trigger.enabled === 'O' 
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {trigger.enabled === 'O' ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Execute Custom SQL</h2>
                
                <div className="mb-4">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter SQL query here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={executeSql}
                    disabled={sqlLoading || !sqlQuery.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {sqlLoading ? 'Executing...' : 'Execute SQL'}
                  </button>
                </div>
                
                {sqlResult && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <h3 className="text-md font-medium text-gray-800 mb-2">SQL Result</h3>
                    <pre className="text-xs text-gray-700 overflow-x-auto">{JSON.stringify(sqlResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-8 bg-blue-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Debugging Information</h2>
            
            <div className="space-y-3 text-sm text-blue-800">
              <p>
                This page helps diagnose and fix issues with database triggers. It allows you to:
              </p>
              
              <ol className="list-decimal list-inside space-y-2">
                <li>View all triggers for a table</li>
                <li>Enable or disable triggers</li>
                <li>Execute custom SQL queries</li>
              </ol>
              
              <p>
                If you're seeing errors about not-null constraints in the order_history table,
                you can try disabling the trigger that automatically creates order history entries.
              </p>
              
              <div className="bg-white p-3 rounded-md border border-blue-200 mt-2">
                <p className="font-medium mb-1">Common SQL Commands:</p>
                <pre className="text-xs overflow-x-auto">
{`-- Disable a trigger
ALTER TABLE orders DISABLE TRIGGER create_order_history_trigger;

-- Enable a trigger
ALTER TABLE orders ENABLE TRIGGER create_order_history_trigger;

-- Create a function to handle order history
CREATE OR REPLACE FUNCTION create_order_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_history (
    order_id, 
    status, 
    notes, 
    updated_by, 
    created_at
  ) VALUES (
    NEW.id, 
    NEW.status, 
    'Status updated to ' || NEW.status, 
    COALESCE(NEW.updated_by, '9155a1e2-84d0-44ec-8174-f27f8b9cc03e'), 
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
