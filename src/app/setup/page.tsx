'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Setup() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const createAdminUser = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // Sign up the admin user
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@etracking.store',
        password: 'Yapa@2001',
        options: {
          data: {
            name: 'Admin User',
            role: 'admin'
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessage(`Admin user created successfully! User ID: ${data.user?.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Setup Admin User
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This page will create an admin user with the following credentials:
          </p>
          <div className="mt-4 bg-gray-100 p-4 rounded-md">
            <p><strong>Email:</strong> admin@etracking.store</p>
            <p><strong>Password:</strong> Yapa@2001</p>
          </div>
        </div>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div>
          <button
            onClick={createAdminUser}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Admin User...
              </>
            ) : 'Create Admin User'}
          </button>
        </div>
      </div>
    </div>
  );
}
