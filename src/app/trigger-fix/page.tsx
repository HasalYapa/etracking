'use client';

import { useState } from 'react';

export default function TriggerFixPage() {
  const [sqlScript, setSqlScript] = useState<string>(`
-- SQL Script to fix the create_initial_order_history trigger
-- Run this in the Supabase SQL Editor

-- 1. First, let's examine the current trigger function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'create_initial_order_history';

-- 2. Drop the existing trigger function
DROP FUNCTION IF EXISTS create_initial_order_history() CASCADE;

-- 3. Create a new version of the trigger function that uses a specific user ID
CREATE OR REPLACE FUNCTION create_initial_order_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into order_history with a specific user ID instead of auth.uid()
  INSERT INTO public.order_history (order_id, status, notes, created_at, updated_by)
  VALUES (NEW.id, NEW.status, 'Order created', NOW(), '9939c3f3-e3fc-4af7-9ecd-31ab535bce59');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'create_order_history_trigger'
  ) THEN
    CREATE TRIGGER create_order_history_trigger
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_order_history();
  END IF;
END
$$;

-- 5. Fix existing order history entries with null updated_by
UPDATE order_history
SET updated_by = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59'
WHERE updated_by IS NULL;

-- 6. Verify the results
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
  `);

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
      <h1 className="text-2xl font-bold mb-6">Database Trigger Fix</h1>
      
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This tool provides a SQL script to fix the database trigger that's causing the issue. Use with extreme caution.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Root Cause:</strong> The error message reveals that there's a database trigger function called <code>create_initial_order_history()</code> that's trying to use <code>auth.uid()</code> for the <code>updated_by</code> field. This function is automatically called when a new order is created, but <code>auth.uid()</code> is returning null in this context.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">SQL Script to Fix Trigger:</h2>
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
        
        <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
          <h3 className="font-semibold mb-2">What This Fix Does:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Examines the current trigger function to understand its structure</li>
            <li>Drops the existing trigger function</li>
            <li>Creates a new version that uses a specific user ID (Sampath's ID) instead of <code>auth.uid()</code></li>
            <li>Creates the trigger if it doesn't exist</li>
            <li>Fixes any existing order history entries with null <code>updated_by</code> values</li>
            <li>Verifies the results</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
