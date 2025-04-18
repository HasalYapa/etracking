'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase-singleton';

export default function ShopAuthCheck({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        console.log("ShopAuthCheck - Current session:", session);

        if (!session) {
          // No session, redirect to login
          console.log("ShopAuthCheck - No session found, redirecting to login");
          router.push('/shop-login');
          return;
        }

        // Check if user is a shop owner
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('ShopAuthCheck - Error fetching profile:', error);
          router.push('/shop-login');
          return;
        }

        if (!profile) {
          console.log('ShopAuthCheck - No profile found, creating one');
          // Create a profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              role: 'shop_owner', // Default role
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('ShopAuthCheck - Error creating profile:', insertError);
            router.push('/shop-login');
            return;
          }

          // Fetch the profile again
          const { data: newProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (fetchError || !newProfile) {
            console.error('ShopAuthCheck - Error fetching new profile:', fetchError);
            router.push('/shop-login');
            return;
          }

          profile = newProfile;
        }

        console.log("ShopAuthCheck - User profile:", profile);

        if (profile.role !== 'shop_owner') {
          console.log("ShopAuthCheck - Not a shop owner, redirecting");
          router.push('/shop-login');
          return;
        }

        // Store the shop owner ID in localStorage if not already set
        if (typeof window !== 'undefined') {
          if (!localStorage.getItem('currentShopId')) {
            localStorage.setItem('currentShopId', session.user.id);
          }
        }

        // User is authenticated and is a shop owner
        setAuthenticated(true);
      } catch (err) {
        console.error("ShopAuthCheck - Authentication error:", err);
        router.push('/shop-login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only render children if authenticated
  return authenticated ? children : null;
}
