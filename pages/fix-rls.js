import { useState } from 'react';
import { supabase } from '../lib/supabase-singleton';
import { useRouter } from 'next/router';

export default function FixRLSPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const createPolicyFunctions = async () => {
    try {
      setLoading(true);
      setMessage('');
      setError('');

      const response = await fetch('/api/create-policy-functions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create policy functions');
      }

      setMessage('Policy functions created successfully!');
    } catch (err) {
      console.error('Error creating policy functions:', err);
      setError(err.message || 'An error occurred while creating policy functions');
    } finally {
      setLoading(false);
    }
  };

  const fixProfilesPolicies = async () => {
    try {
      setLoading(true);
      setMessage('');
      setError('');

      const response = await fetch('/api/fix-profiles-policy');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix profiles policies');
      }

      setMessage('Profiles policies fixed successfully!');
    } catch (err) {
      console.error('Error fixing profiles policies:', err);
      setError(err.message || 'An error occurred while fixing profiles policies');
    } finally {
      setLoading(false);
    }
  };

  const fixDirectly = async () => {
    try {
      setLoading(true);
      setMessage('');
      setError('');

      // First, drop all existing policies on the profiles table
      const { error: dropError } = await supabase.query(`
        DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
        DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
        DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON profiles;
        DROP POLICY IF EXISTS "Profiles are editable by users who created them." ON profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles." ON profiles;
        DROP POLICY IF EXISTS "Admins can edit all profiles." ON profiles;
        DROP POLICY IF EXISTS "Shop owners can view their own profile." ON profiles;
        DROP POLICY IF EXISTS "Shop owners can edit their own profile." ON profiles;
        DROP POLICY IF EXISTS "Drivers can view their own profile." ON profiles;
        DROP POLICY IF EXISTS "Drivers can edit their own profile." ON profiles;
      `);

      if (dropError) {
        throw new Error(`Failed to drop policies: ${dropError.message}`);
      }

      // Create new, simple policies
      const { error: createError } = await supabase.query(`
        -- Enable RLS on profiles table
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create simple policies that won't cause recursion
        CREATE POLICY "Public profiles are viewable by everyone."
          ON profiles FOR SELECT
          USING (true);
          
        CREATE POLICY "Users can update own profile."
          ON profiles FOR UPDATE
          USING (auth.uid() = id);
          
        CREATE POLICY "Users can insert own profile."
          ON profiles FOR INSERT
          WITH CHECK (auth.uid() = id);
      `);

      if (createError) {
        throw new Error(`Failed to create policies: ${createError.message}`);
      }

      setMessage('Profiles policies fixed successfully!');
    } catch (err) {
      console.error('Error fixing profiles policies directly:', err);
      setError(err.message || 'An error occurred while fixing profiles policies directly');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-lg font-medium text-gray-900">Fix RLS Policies</h1>
          <p className="mt-1 text-sm text-gray-500">
            This page helps fix the infinite recursion issue in the profiles table RLS policies.
          </p>

          {message && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <button
              onClick={createPolicyFunctions}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? 'Creating...' : 'Step 1: Create Policy Functions'}
            </button>

            <button
              onClick={fixProfilesPolicies}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
            >
              {loading ? 'Fixing...' : 'Step 2: Fix Profiles Policies'}
            </button>

            <button
              onClick={fixDirectly}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300"
            >
              {loading ? 'Fixing...' : 'Alternative: Fix Directly'}
            </button>

            <button
              onClick={() => router.push('/')}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
