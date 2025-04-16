'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SqlFixPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sqlScript, setSqlScript] = useState<string>('');

  // Generate SQL script
  const generateScript = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create a Supabase client
      const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Get a valid user ID
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .limit(10);

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        throw new Error('No profiles found in the database');
      }

      // Use the known shop owner ID
      const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59'; // Sampath
      const adminId = 'e630fa7d-50dc-40c9-bbe5-5791d465c83f'; // Admin User

      // Find these users in the profiles
      const shopOwner = profiles.find(p => p.id === shopOwnerId);
      const admin = profiles.find(p => p.id === adminId);

      if (!shopOwner && !admin) {
        throw new Error('Could not find the known user IDs in the profiles');
      }

      // Use the found user or fallback to the hardcoded ID
      const userId = (shopOwner || admin)?.id || shopOwnerId;

      // Generate SQL script
      const script = `
-- SQL Script to fix order history issues
-- Run this in the Supabase SQL Editor

-- 1. Create a test order and order history

-- First, get a valid customer ID
WITH customer_data AS (
  SELECT id FROM customers LIMIT 1
)
-- Then create a test order
, test_order AS (
  INSERT INTO orders (
    tracking_number,
    shop_id,
    customer_id,
    status,
    delivery_address,
    delivery_notes,
    created_at,
    updated_at
  )
  SELECT
    'SQL-' || floor(random() * 900000 + 100000)::text,
    '${userId}',
    id,
    'pending',
    'SQL Test Delivery Address',
    'Created by SQL script',
    now(),
    now()
  FROM customer_data
  RETURNING id
)
-- Finally, create order history with explicit updated_by
INSERT INTO order_history (
  order_id,
  status,
  notes,
  created_at,
  updated_by
)
SELECT
  id,
  'pending',
  'Created by SQL script',
  now(),
  '${userId}'
FROM test_order;

-- 2. Fix existing orders without history

-- Find orders without history
WITH orders_without_history AS (
  SELECT o.id
  FROM orders o
  LEFT JOIN order_history oh ON o.id = oh.order_id
  WHERE oh.id IS NULL
  LIMIT 50
)
-- Create history entries for them
INSERT INTO order_history (
  order_id,
  status,
  notes,
  created_at,
  updated_by
)
SELECT
  id,
  'pending',
  'Automatically created by SQL script',
  now(),
  '${userId}'
FROM orders_without_history;

-- 3. Fix order history entries with null updated_by

UPDATE order_history
SET updated_by = '${userId}'
WHERE updated_by IS NULL;

-- 4. Verify the results

-- Count orders
SELECT 'Total orders' as description, count(*) FROM orders
UNION ALL
-- Count order history entries
SELECT 'Total order history entries', count(*) FROM order_history
UNION ALL
-- Count orders without history
SELECT 'Orders without history', count(*)
FROM orders o
LEFT JOIN order_history oh ON o.id = oh.order_id
WHERE oh.id IS NULL
UNION ALL
-- Count order history entries with null updated_by
SELECT 'Order history entries with null updated_by', count(*)
FROM order_history
WHERE updated_by IS NULL;
      `;

      setSqlScript(script);
      setResult({
        success: true,
        message: 'SQL script generated successfully',
        shopOwner: shopOwner || admin,
        userId,
        knownIds: {
          shopOwnerId,
          adminId
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate SQL script');
      console.error('Error generating SQL script:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
      .then(() => {
        alert('SQL script copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please select and copy manually.');
      });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">SQL Fix for Order History Issues</h1>

      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This tool generates a SQL script that directly modifies the database. Use with extreme caution.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={generateScript}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300"
        >
          {loading ? 'Generating...' : 'Generate SQL Fix Script'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && result.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Success!</p>
          <p>{result.message}</p>

          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">User ID Used for Fixing:</h2>
            <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
              <p className="font-mono">{result.userId}</p>
              {result.shopOwner && (
                <p className="mt-2">User: {result.shopOwner.name || 'Unknown'} (Role: {result.shopOwner.role || 'Unknown'})</p>
              )}
            </div>

            <h3 className="text-md font-semibold mt-3 mb-1">Known User IDs:</h3>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p className="font-mono">Shop Owner (Sampath): {result.knownIds.shopOwnerId}</p>
              <p className="font-mono mt-1">Admin User: {result.knownIds.adminId}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">SQL Script:</h2>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-gray-800 text-white p-4 rounded-lg">
              <pre className="overflow-auto max-h-96 text-sm">
                {sqlScript}
              </pre>
            </div>

            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Copy the SQL script above</li>
                <li>Go to the <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                <li>Select your project</li>
                <li>Go to the SQL Editor</li>
                <li>Paste the script</li>
                <li>Click "Run" to execute the script</li>
                <li>Check the results to verify the fix worked</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
