'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import supabase from '@/utils/supabase-client';

export default function DriverLogin() {
  const [email, setEmail] = useState('dimanthayapa2001@gmail.com');
  const [password, setPassword] = useState('Yapa@2006');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    async function checkSession() {
      try {
        console.log('DriverLogin: Checking for existing session...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('DriverLogin: Session found, checking user role...');

          // Get user profile to check role
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('DriverLogin: Error fetching profile:', profileError);
            return;
          }

          if (profileData.role === 'driver') {
            console.log('DriverLogin: User is a driver, redirecting to driver dashboard');
            window.location.href = '/minimal-driver';
          } else {
            console.log(`DriverLogin: User is not a driver (${profileData.role}), staying on login page`);
          }
        } else {
          console.log('DriverLogin: No active session found');
        }
      } catch (err) {
        console.error('DriverLogin: Error checking session:', err);
      }
    }

    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('DriverLogin: Attempting to sign in with:', email);

      // Try using the API route first
      try {
        console.log('DriverLogin: Using API route for login...');
        const response = await fetch('/api/driver-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('DriverLogin: API login error:', result.error);
          throw new Error(result.error || 'Login failed');
        }

        console.log('DriverLogin: API login successful');
        setSuccess('Login successful! Redirecting...');

        // Store the session in localStorage to ensure it's available
        if (result.session) {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            currentSession: result.session,
            expiresAt: Math.floor(Date.now() / 1000) + 3600
          }));
        }

        // Force a delay to ensure session is properly established
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Redirect to minimal driver dashboard
        console.log('DriverLogin: Redirecting to driver dashboard');
        try {
          // Try multiple approaches to ensure redirection works
          window.location.href = '/minimal-driver';

          // Fallback: try after a short delay
          setTimeout(() => {
            window.location.replace('/minimal-driver');
          }, 100);
        } catch (redirectErr) {
          console.error('DriverLogin: Error during redirect:', redirectErr);
          // Last resort: create and click a link
          const link = document.createElement('a');
          link.href = '/minimal-driver';
          link.click();
        }
        return;
      } catch (apiError: any) {
        console.error('DriverLogin: API route failed, falling back to direct Supabase call:', apiError);
        // Continue to fallback method
      }

      // Fallback: Use direct Supabase client
      console.log('DriverLogin: Falling back to direct Supabase login');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('DriverLogin: Login error:', error);
        setError(error.message);
        return;
      }

      console.log('DriverLogin: Sign in successful');
      setSuccess('Login successful! Redirecting...');

      // Get user profile to check role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('DriverLogin: Error fetching profile:', profileError);
        setError('Error verifying user role. Please try again.');
        return;
      }

      if (profileData.role !== 'driver') {
        console.log(`DriverLogin: User is not a driver (${profileData.role})`);
        setError('Access denied. This login is for drivers only.');
        await supabase.auth.signOut();
        return;
      }

      // Force a delay to ensure session is properly established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to minimal driver dashboard
      console.log('DriverLogin: Redirecting to driver dashboard');
      try {
        // Try multiple approaches to ensure redirection works
        window.location.href = '/minimal-driver';

        // Fallback: try after a short delay
        setTimeout(() => {
          window.location.replace('/minimal-driver');
        }, 100);
      } catch (redirectErr) {
        console.error('DriverLogin: Error during redirect:', redirectErr);
        // Last resort: create and click a link
        const link = document.createElement('a');
        link.href = '/minimal-driver';
        link.click();
      }
    } catch (err: any) {
      console.error('DriverLogin: Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Driver Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your driver dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                handleLogin(e);
              }}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </>
              ) : 'Sign In'}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/driver-signup" className="font-medium text-green-600 hover:text-green-500">
                Sign up
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Having trouble signing in?{' '}
              <Link href="/minimal-driver" className="font-medium text-blue-600 hover:text-blue-500">
                Go to driver dashboard directly
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
