'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
};

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, profile, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;
    
    // If no user is logged in, redirect to login
    if (!user) {
      console.log('ProtectedRoute: No user found, redirecting to', redirectTo);
      router.push(redirectTo);
      return;
    }
    
    // If role check is required
    if (requiredRole && profile) {
      const userRole = profile.role;
      
      // Check if user has the required role
      const hasRequiredRole = Array.isArray(requiredRole)
        ? requiredRole.includes(userRole)
        : userRole === requiredRole;
      
      if (!hasRequiredRole) {
        console.log(`ProtectedRoute: User role (${userRole}) doesn't match required role(s)`, requiredRole);
        
        // Redirect based on user role
        if (userRole === 'shop_owner') {
          router.push('/minimal-shop');
        } else if (userRole === 'driver') {
          router.push('/minimal-driver');
        } else if (userRole === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, profile, isLoading, requiredRole, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full">
          <div className="text-red-600 text-xl font-semibold mb-4">Authentication Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  // If user is authenticated and has the required role, render children
  if (user && (!requiredRole || (profile && (
    Array.isArray(requiredRole) 
      ? requiredRole.includes(profile.role) 
      : profile.role === requiredRole
  )))) {
    return <>{children}</>;
  }
  
  // Default loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
