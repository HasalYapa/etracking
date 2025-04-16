'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ReactQRScanner from '@/components/react-qr-scanner';

// Create a Supabase client
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  },
});

export default function DriverDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_transit: 0,
    delivered: 0
  });

  // Get current location
  useEffect(() => {
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
        }
      );
    }
  }, []);

  useEffect(() => {
    async function getSession() {
      try {
        setLoading(true);

        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          setError('No active session. Please log in.');
          return;
        }

        console.log('Session found:', session);
        setUser(session.user);

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Error fetching profile. Please try again.');
          return;
        } else {
          console.log('Profile fetched:', profileData);
          setProfile(profileData);

          // Verify this is a driver
          if (profileData.role !== 'driver') {
            setError('Access denied. This dashboard is for drivers only.');
            return;
          }

          // Load assignments for this driver
          await loadDriverAssignments(profileData.id);
        }
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    getSession();
  }, []);

  const loadDriverAssignments = async (driverId) => {
    try {
      console.log('Loading assignments for driver ID:', driverId);

      // In a real implementation, we would fetch assignments from Supabase
      // For now, we'll use mock data but filter it by driver ID

      // This would be the actual query in production:
      // const { data: assignmentsData, error } = await supabase
      //   .from('orders')
      //   .select('*, shop:profiles!shop_id(*)')
      //   .eq('driver_id', driverId);

      // Mock data for now, but with driver_id added
      const allMockAssignments = [
        {
          id: '1',
          tracking_number: 'TRK12345',
          driver_id: '35fbcf81-5f57-4267-a7af-9d52602761d1', // Dimantha's ID
          shop: { name: 'Shop A', id: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59' },
          customer: { name: 'John Doe', phone: '123-456-7890' },
          delivery_address: '123 Main St, City',
          status: 'assigned',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          tracking_number: 'TRK67890',
          driver_id: '35fbcf81-5f57-4267-a7af-9d52602761d1', // Dimantha's ID
          shop: { name: 'Shop B', id: '74622a48-0f62-43a1-a330-e82ac4f4e34d' },
          customer: { name: 'Jane Smith', phone: '987-654-3210' },
          delivery_address: '456 Oak Ave, Town',
          status: 'in_transit',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          tracking_number: 'TRK24680',
          driver_id: '9155a1e2-84d0-44ec-8174-f27f8b9cc03e', // Another driver's ID
          shop: { name: 'Shop C', id: '9939c3f3-e3fc-4af7-9ecd-31ab535bce59' },
          customer: { name: 'Bob Johnson', phone: '555-123-4567' },
          delivery_address: '789 Pine St, Village',
          status: 'in_transit',
          created_at: new Date().toISOString()
        }
      ];

      // Filter assignments by driver ID
      const driverAssignments = allMockAssignments.filter(assignment => assignment.driver_id === driverId);
      console.log(`Found ${driverAssignments.length} assignments for driver ID ${driverId}`);

      setAssignments(driverAssignments);

      // Calculate stats
      setStats({
        total: driverAssignments.length,
        pending: driverAssignments.filter(order => order.status === 'assigned').length,
        in_transit: driverAssignments.filter(order => order.status === 'in_transit').length,
        delivered: driverAssignments.filter(order => order.status === 'delivered').length
      });
    } catch (err) {
      console.error('Error loading driver assignments:', err);
    }
  };

  // Handle QR code scan
  const handleScan = async (data: { trackingNumber: string; location: string; driverPhone?: string }) => {
    try {
      console.log('QR code scanned with data:', data);
      setScanResult(data);
      setScanError(null);
      setScanSuccess(null);

      if (!profile) {
        setScanError('You must be logged in to update order status.');
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
      setScanSuccess('Processing scan... Please wait.');

      // Update dispatch location
      const response = await fetch('/api/update-dispatch-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: data.trackingNumber,
          dispatch_location: data.location,
          driver_id: profile.id,
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
      setScanSuccess(`Successfully updated order status for tracking number: ${data.trackingNumber}`);

      // Refresh the assignments list
      await loadDriverAssignments(profile.id);

      // Close the scanner after a delay
      setTimeout(() => {
        setScannerOpen(false);
        setScanSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating dispatch location:', err);
      setScanError(err.message || 'An error occurred while updating the order status');
    }
  };

  // Handle scan error
  const handleScanError = (errorMessage: string) => {
    setScanError(errorMessage);
    setScanResult(null);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/driver-login';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleUpdateStatus = (assignmentId: string, newStatus: string) => {
    // Update the assignment in local state
    setAssignments(prev => prev.map(assignment => {
      if (assignment.id === assignmentId) {
        return {
          ...assignment,
          status: newStatus
        };
      }
      return assignment;
    }));

    // Update stats
    setStats(prev => {
      const updatedStats = { ...prev };

      // Decrement previous status count
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        if (assignment.status === 'assigned') {
          updatedStats.pending = Math.max(0, updatedStats.pending - 1);
        } else if (assignment.status === 'in_transit') {
          updatedStats.in_transit = Math.max(0, updatedStats.in_transit - 1);
        }
      }

      // Increment new status count
      if (newStatus === 'in_transit') {
        updatedStats.in_transit += 1;
      } else if (newStatus === 'delivered') {
        updatedStats.delivered += 1;
      }

      return updatedStats;
    });

    alert(`Delivery status updated to ${newStatus}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Driver Dashboard
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Authentication Error
            </p>
          </div>

          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>

          <div className="mt-8">
            <Link href="/driver-login" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {profile?.name || user?.user_metadata?.name || 'Driver'}</span>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Assignments</p>
                <h2 className="text-3xl font-bold">{stats.total}</h2>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Pickup</p>
                <h2 className="text-3xl font-bold">{stats.pending}</h2>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">In Transit</p>
                <h2 className="text-3xl font-bold">{stats.in_transit}</h2>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Delivered</p>
                <h2 className="text-3xl font-bold">{stats.delivered}</h2>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Scanner Section */}
        <div className="mb-8">
          <button
            onClick={() => setScannerOpen(!scannerOpen)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 mb-4"
          >
            {scannerOpen ? 'Hide QR Scanner' : 'Scan QR Code'}
          </button>

          {scannerOpen && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <h2 className="text-xl font-bold mb-4">Scan Order QR Code</h2>

              {scanError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {scanError}
                </div>
              )}

              {scanSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {scanSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {/* Only render the scanner component when the scanner is open */}
                  {scannerOpen && (
                    <ReactQRScanner
                      onScan={handleScan}
                      onError={handleScanError}
                    />
                  )}
                </div>

                <div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Scan Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Position the QR code within the scanner frame</li>
                      <li>Hold steady until the code is recognized</li>
                      <li>Once scanned, the order status will update automatically</li>
                    </ol>
                  </div>

                  {scanResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-800 mb-2">Scan Result:</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Order ID:</strong> {scanResult.trackingNumber}</p>
                        <p><strong>Dispatch Location:</strong> {scanResult.location}</p>
                        {scanResult.driverPhone && (
                          <p><strong>Driver Contact:</strong> {scanResult.driverPhone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-6">My Assignments</h2>

          {assignments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">No assignments found. Check back later for new deliveries.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shop
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{assignment.tracking_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.shop?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.customer?.name}<br />
                        <span className="text-xs">{assignment.customer?.phone}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.delivery_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${assignment.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                            assignment.status === 'picked_up' || assignment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                            assignment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'}`}>
                          {assignment.status === 'assigned' ? 'Assigned' :
                            assignment.status === 'picked_up' ? 'Picked Up' :
                            assignment.status === 'in_transit' ? 'In Transit' :
                            assignment.status === 'delivered' ? 'Delivered' :
                            'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {assignment.status === 'assigned' && (
                          <button
                            onClick={() => handleUpdateStatus(assignment.id, 'in_transit')}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Pick Up
                          </button>
                        )}
                        {assignment.status === 'in_transit' && (
                          <button
                            onClick={() => handleUpdateStatus(assignment.id, 'delivered')}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Mark Delivered
                          </button>
                        )}
                        <button
                          onClick={() => {
                            alert(`
                              Delivery Details:

                              Tracking Number: ${assignment.tracking_number}
                              Shop: ${assignment.shop?.name}
                              Customer: ${assignment.customer?.name}
                              Phone: ${assignment.customer?.phone}
                              Address: ${assignment.delivery_address}
                              Status: ${assignment.status}
                              Date: ${new Date(assignment.created_at).toLocaleDateString()}
                            `);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
