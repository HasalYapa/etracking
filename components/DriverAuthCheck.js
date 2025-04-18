'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase-singleton';

export default function DriverAuthCheck({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        console.log("DriverAuthCheck - Current session:", session);

        if (!session) {
          // No session, redirect to login
          console.log("DriverAuthCheck - No session found, redirecting to login");
          router.push('/driver-login');
          return;
        }

        // Check if user is a driver
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        console.log("DriverAuthCheck - User profile:", profile);

        if (error) {
          console.error("DriverAuthCheck - Error fetching profile:", error);
          router.push('/driver-login');
          return;
        }

        if (profile.role !== 'driver') {
          console.log("DriverAuthCheck - Not a driver, redirecting");
          router.push('/driver-login');
          return;
        }

        // Store the driver ID in localStorage if not already set
        if (typeof window !== 'undefined') {
          if (!localStorage.getItem('currentDriverId')) {
            localStorage.setItem('currentDriverId', session.user.id);
          }
        }

        // User is authenticated and is a driver
        setAuthenticated(true);
      } catch (err) {
        console.error("DriverAuthCheck - Authentication error:", err);
        router.push('/driver-login');
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
