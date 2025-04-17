'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import RealTimeClock from '@/components/real-time-clock';
import LogoPlaceholder from '@/components/logo-placeholder';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Import CSS in globals.css instead

// Dynamically import the MapContainer component to avoid SSR issues with Leaflet
const MapComponent = dynamic(
  () => import('@/components/simple-map-component'),
  { ssr: false }
);

export default function MapAssignmentPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Supabase client
  const supabase = createClientComponentClient();

  // Check authentication on component mount
  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('MapAssignmentPage: Starting authentication check...');

        // Get session using auth helpers
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('MapAssignmentPage: No active session found');
          setError('No active session. Please log in.');
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('MapAssignmentPage: Error fetching profile:', profileError);
          setError('Error fetching profile. Please try again.');
        } else {
          setProfile(profileData);
        }
      } catch (err: any) {
        console.error('MapAssignmentPage: Error in authentication flow:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <LogoPlaceholder />
                <span className="ml-2 text-xl font-bold text-gray-900">etracking.store</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {profile && (
                <span className="text-sm font-medium text-gray-700">
                  {profile.name} ({profile.role})
                </span>
              )}

              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
              <div className="mt-4">
                <Link href="/" className="text-red-700 underline">
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Order Assignment Map</h1>
                <div className="flex space-x-4">
                  <Link
                    href="/minimal-shop"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Shop Dashboard
                  </Link>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                  <p className="text-gray-700 mb-6">
                    Drag and drop orders onto driver markers to assign them. The system will calculate the distance and estimated cost automatically.
                  </p>

                  {/* Map Component */}
                  <div style={{ height: "500px", width: "100%" }}>
                    <MapComponent />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 mt-auto w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center">
            <div className="flex justify-center md:justify-start mb-3 md:mb-0">
              <LogoPlaceholder />
            </div>
            <div className="flex justify-center mb-3 md:mb-0">
              <span className="text-sm text-gray-600">© {new Date().getFullYear()} etracking.store. All rights reserved.</span>
            </div>
            <div className="flex justify-center md:justify-end">
              <RealTimeClock />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
