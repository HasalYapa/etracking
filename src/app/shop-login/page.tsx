'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-singleton';

export default function ShopLogin() {
  const [email, setEmail] = useState('sampathyt1973@gmail.com');
  const [password, setPassword] = useState('Yapa@234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    async function checkSession() {
      try {
        console.log('ShopLogin: Checking for existing session...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('ShopLogin: Found existing session, checking role...');

          // Verify that the user has the correct role
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('ShopLogin: Error fetching profile:', profileError);
            return;
          }

          if (profileData.role === 'shop_owner') {
            console.log('ShopLogin: User is a shop owner, redirecting to shop dashboard');
            // Show loading state during redirect
            setLoading(true);
            setSuccess('Already logged in! Redirecting to dashboard...');

            // Use router.push with replace option to avoid keeping login page in history
            router.push('/minimal-shop', { replace: true });

            // If for some reason the redirect doesn't happen, reset loading state after 3 seconds
            setTimeout(() => {
              setLoading(false);
            }, 3000);
          } else {
            console.log(`ShopLogin: User is not a shop owner (${profileData.role}), staying on login page`);
          }
        } else {
          console.log('ShopLogin: No active session found');
        }
      } catch (err) {
        console.error('ShopLogin: Error checking session:', err);
      }
    }

    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Attempting to sign in with:', email);

      // Sign in directly with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        setError(error.message || 'Login failed');
        return;
      }

      if (!data.user) {
        console.error('No user returned from authentication');
        setError('Authentication failed. Please try again.');
        return;
      }

      console.log('Sign in successful:', data);

      // Verify that the user has the correct role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, name, email')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Error verifying user role. Please try again.');
        return;
      }

      if (profile.role !== 'shop_owner') {
        console.error(`User is not a shop owner (${profile.role})`);
        setError('Access denied. This login is for shop owners only.');
        await supabase.auth.signOut();
        return;
      }

      setSuccess(`Login successful! Welcome, ${profile.name}. Redirecting...`);

      // Set a redirecting state to show a better loading indicator
      setLoading(true);
      setSuccess('Login successful! Redirecting to dashboard...');

      // Use the Next.js router for redirection
      console.log('Redirecting to minimal shop dashboard...');

      // Use router.push for navigation within Next.js
      // The replace: true option ensures we don't keep the login page in history
      router.push('/minimal-shop', { replace: true });

      // If for some reason the redirect doesn't happen, reset loading state after 3 seconds
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    } catch (err: any) {
      console.error('Unexpected error:', err);
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
            Shop Owner Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your shop dashboard
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
              <Link href="/shop-signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
