'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-singleton';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
};

export default function SupabaseProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session || !session.user) {
          console.log('ProtectedRoute: No session or user found, redirecting to', redirectTo);
          router.push(redirectTo);
          return;
        }

        // If no role check is required, user is authorized
        if (!requiredRole) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // Get the user's profile to check role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('ProtectedRoute: Error fetching profile:', error);
          router.push(redirectTo);
          return;
        }

        // Check if user has the required role
        const userRole = profile.role;
        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

        if (requiredRoles.includes(userRole)) {
          setIsAuthorized(true);
        } else {
          console.log(`ProtectedRoute: User role ${userRole} does not match required roles ${requiredRoles.join(', ')}`);
          router.push(redirectTo);
        }
      } catch (err) {
        console.error('ProtectedRoute: Error checking auth:', err);
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [requiredRole, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show children if authorized
  return isAuthorized ? <>{children}</> : null;
}
