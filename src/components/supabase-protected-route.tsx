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
        console.log('SupabaseProtectedRoute: Starting auth check for', requiredRole);

        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('SupabaseProtectedRoute: Session check result:', session ? 'Session found' : 'No session');

        if (!session || !session.user) {
          console.log('SupabaseProtectedRoute: No session or user found, redirecting to', redirectTo);
          router.push(redirectTo);
          return;
        }

        console.log('SupabaseProtectedRoute: User ID:', session.user.id);

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

        console.log('SupabaseProtectedRoute: Profile query result:', profile ? `Role: ${profile.role}` : 'No profile', error ? `Error: ${error.message}` : 'No error');

        if (error) {
          console.error('SupabaseProtectedRoute: Error fetching profile:', error);
          router.push(redirectTo);
          return;
        }

        // Check if user has the required role
        const userRole = profile.role;
        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

        console.log(`SupabaseProtectedRoute: Checking if user role ${userRole} matches required roles ${requiredRoles.join(', ')}`);

        if (requiredRoles.includes(userRole)) {
          console.log('SupabaseProtectedRoute: Role match found, user is authorized');
          setIsAuthorized(true);
        } else {
          console.log(`SupabaseProtectedRoute: User role ${userRole} does not match required roles ${requiredRoles.join(', ')}`);
          console.log('SupabaseProtectedRoute: Redirecting to', redirectTo);
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
