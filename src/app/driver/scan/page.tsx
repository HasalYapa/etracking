'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QRCodeScanner from '@/components/qr-code-scanner';

export default function ScanQRCodePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // Check authentication and get user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/driver-login');
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile && profile.role !== 'driver') {
          router.push('/dashboard');
          return;
        }

        setUser(profile);
      } catch (err: any) {
        console.error('Error checking auth:', err);
        setError('Authentication error. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    // Get current location
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (err) => {
            console.error('Error getting location:', err);
            setError('Unable to get your current location. Please enable location services.');
          }
        );
      } else {
        setError('Geolocation is not supported by your browser.');
      }
    };

    checkAuth();
    getCurrentLocation();
  }, [router]);

  // Handle QR code scan
  const handleScan = async (data: { trackingNumber: string; location: string; driverPhone?: string }) => {
    try {
      console.log('QR code scanned with data:', data);
      setScanResult(data);
      setError(null);
      setSuccess(null);

      if (!user) {
        setError('You must be logged in to update order status.');
        return;
      }

      // Get current location if available
      let latitude = null;
      let longitude = null;
      if (currentLocation) {
        latitude = currentLocation.lat;
        longitude = currentLocation.lng;
      }

      // Show processing message
      setSuccess('Processing scan... Please wait.');

      // Update dispatch location
      const response = await fetch('/api/update-dispatch-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: data.trackingNumber,
          dispatch_location: data.location,
          driver_id: user.id,
          timestamp: new Date().toISOString(),
          latitude,
          longitude,
        }),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update dispatch location');
      }

      // Update success message
      setSuccess(`Successfully updated order status for tracking number: ${data.trackingNumber}`);

      // Redirect to order details after a delay
      setTimeout(() => {
        router.push(`/driver/orders/${data.trackingNumber}`);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating dispatch location:', err);
      setError(err.message || 'An error occurred while updating the order status');
    }
  };

  // Handle scan error
  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
    setScanResult(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Scan Order QR Code</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <QRCodeScanner
            onScan={handleScan}
            onError={handleScanError}
          />

          {scanResult && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg shadow-md">
              <h3 className="font-medium text-blue-800 mb-2">Scan Result:</h3>
              <div className="space-y-2">
                <p><strong>Order ID:</strong> {scanResult.trackingNumber}</p>
                <p><strong>Dispatch Location:</strong> {scanResult.location}</p>
                {scanResult.driverPhone && (
                  <p><strong>Driver Contact:</strong> {scanResult.driverPhone}</p>
                )}
                {currentLocation && (
                  <p><strong>Your Current Location:</strong> {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Scan Instructions</h2>

            <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-6">
              <li>Position the QR code within the scanner frame</li>
              <li>Hold steady until the code is recognized</li>
              <li>Once scanned, the order status will be updated automatically</li>
              <li>You'll be redirected to the order details page</li>
            </ol>
          </div>

          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Why Use QR Codes?</h2>

            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Faster and more accurate than manual entry</li>
              <li>Automatically updates order status and location</li>
              <li>Provides real-time tracking for customers</li>
              <li>Reduces errors in the delivery process</li>
            </ul>
          </div>

          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Troubleshooting</h2>

            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Make sure the QR code is well-lit and clearly visible</li>
              <li>If scanning fails, try a different camera or angle</li>
              <li>Ensure you have a stable internet connection</li>
              <li>If problems persist, contact support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
