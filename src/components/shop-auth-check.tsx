'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-singleton';

type ShopAuthCheckProps = {
  children: ReactNode;
};

export default function ShopAuthCheck({ children }: ShopAuthCheckProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('ShopAuthCheck: Checking authentication...');
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('ShopAuthCheck: No session found, redirecting to login');
          router.push('/shop-login');
          return;
        }

        // Verify that the user has the correct role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('ShopAuthCheck: Error fetching profile:', profileError);
          setError('Error verifying user role. Please try again.');
          setIsLoading(false);
          return;
        }

        if (profile.role !== 'shop_owner') {
          console.error(`ShopAuthCheck: User is not a shop owner (${profile.role})`);
          setError('Access denied. This page is for shop owners only.');
          setIsLoading(false);
          
          // Sign out and redirect to login
          await supabase.auth.signOut();
          router.push('/shop-login');
          return;
        }

        console.log('ShopAuthCheck: User is authenticated as shop owner');
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error('ShopAuthCheck: Error checking authentication:', err);
        setError(err.message || 'Authentication error');
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full">
          <div className="text-red-600 text-xl font-semibold mb-4">Authentication Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/shop-login')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Default loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
