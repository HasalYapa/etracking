'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RealTimeClock from '@/components/real-time-clock';
import LogoPlaceholder from '@/components/logo-placeholder';
import Html5QRScanner from '@/components/Html5QrScanner';
import DriverNotifications from '@/components/driver-notifications';
import supabase from '@/utils/supabase-client';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default function MinimalDriverPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_transit: 0,
    delivered: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Set a timeout to handle stuck loading state
  useEffect(() => {
    // If still loading after 20 seconds, show a timeout error
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('MinimalDriverPage: Loading timeout reached');
        setError('Loading timeout. Please try refreshing the page or return to login.');
        setLoading(false);

        // Force a sign out to clear any problematic session state
        try {
          supabase.auth.signOut().then(() => {
            console.log('MinimalDriverPage: Forced sign out due to timeout');
            // Clear any stored session data
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('sb-slujerwtublzuxtzdtyw-auth-token');
          });
        } catch (e) {
          console.error('MinimalDriverPage: Error during forced sign out:', e);
        }
      }
    }, 20000); // 20 seconds timeout (increased from 10 seconds)

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Get current location and update periodically
  useEffect(() => {
    if (navigator.geolocation) {
      // Get initial location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);

          // Always update driver location in the database if we have a profile
          if (profile?.id) {
            updateDriverLocation(profile.id, newLocation.lat, newLocation.lng);
          }
        },
        (err) => {
          console.error('Error getting location:', err);
        }
      );

      // Set up periodic location updates
      const locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentLocation(newLocation);

            // Always update driver location in the database if we have a profile
            if (profile?.id) {
              updateDriverLocation(profile.id, newLocation.lat, newLocation.lng);
            }
          },
          (err) => {
            console.error('Error getting location:', err);
          }
        );
      }, 60000); // Update every minute

      return () => clearInterval(locationInterval);
    }
  }, [isAvailable, profile]);

  // Check for debug mode
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.get('debug');
    setDebugMode(debug === 'true');
  }, []);

  // Set up real-time subscription to orders table and driver notifications
  useEffect(() => {
    if (!profile || !profile.id) return;

    console.log('MinimalDriverPage: Setting up real-time subscription for driver:', profile.id);

    const ordersSubscription = supabase
      .channel('driver-assignments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `driver_id=eq.${profile.id}`,
      }, (payload) => {
        console.log('MinimalDriverPage: Real-time update received:', payload);

        // Refresh assignments when any change happens
        loadDriverAssignments(profile.id);

        // Show notification for status changes
        if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;

          if (oldStatus !== newStatus) {
            // Create a notification
            if (Notification.permission === 'granted') {
              const notification = new Notification('Order Status Updated', {
                body: `Order ${payload.new.tracking_number} status changed from ${oldStatus} to ${newStatus}`,
                icon: '/favicon.ico'
              });

              // Auto close after 5 seconds
              setTimeout(() => notification.close(), 5000);
            }
          }
        }
      })
      .subscribe();

    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Also subscribe to driver notifications
    const notificationsSubscription = supabase
      .channel('driver-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_notifications',
        filter: `driver_id=eq.${profile.id}`,
      }, (payload) => {
        console.log('MinimalDriverPage: Notification update received:', payload);

        // If it's a new notification, show a browser notification
        if (payload.eventType === 'INSERT') {
          if (Notification.permission === 'granted') {
            const notification = new Notification('New Order Assignment', {
              body: payload.new.message,
              icon: '/favicon.ico'
            });

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);
          }

          // Refresh assignments
          loadDriverAssignments(profile.id);
        }
      })
      .subscribe();

    // Check driver availability status
    fetchDriverAvailability(profile.id);

    return () => {
      // Clean up subscriptions when component unmounts
      ordersSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [profile]);

  useEffect(() => {
    let isMounted = true;

    async function getSession() {
      try {
        if (isMounted) setLoading(true);
        console.log('MinimalDriverPage: Starting authentication check...');

        // If in debug mode, show more detailed information
        if (debugMode) {
          console.log('MinimalDriverPage: Debug mode enabled');
          console.log('MinimalDriverPage: localStorage content:', localStorage);
          console.log('MinimalDriverPage: Cookies:', document.cookie);
        }

        // Try to get session from localStorage first
        let sessionToken = null;
        try {
          // Check for both possible localStorage keys
          const supabaseKey = 'sb-slujerwtublzuxtzdtyw-auth-token';
          const legacyKey = 'supabase.auth.token';

          // First try the actual Supabase key format
          let storedSession = localStorage.getItem(supabaseKey);
          if (storedSession) {
            console.log('MinimalDriverPage: Found session using Supabase key format');
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession?.access_token) {
              sessionToken = parsedSession.access_token;
              console.log('MinimalDriverPage: Found access_token in Supabase format');
              if (debugMode) {
                console.log('MinimalDriverPage: Session token:', sessionToken);
              }
            }
          } else {
            // Try legacy format as fallback
            storedSession = localStorage.getItem(legacyKey);
            if (storedSession) {
              console.log('MinimalDriverPage: Found session using legacy key format');
              const parsedSession = JSON.parse(storedSession);
              if (parsedSession?.currentSession?.access_token) {
                sessionToken = parsedSession.currentSession.access_token;
                console.log('MinimalDriverPage: Found access_token in legacy format');
                if (debugMode) {
                  console.log('MinimalDriverPage: Session token:', sessionToken);
                }
              }
            }
          }

          // If debug mode, log all localStorage keys
          if (debugMode) {
            console.log('MinimalDriverPage: All localStorage keys:', Object.keys(localStorage));
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.includes('auth')) {
                console.log(`MinimalDriverPage: Auth-related localStorage key found: ${key}`);
                try {
                  const value = localStorage.getItem(key);
                  console.log(`MinimalDriverPage: Value for ${key}:`, value);
                } catch (e) {
                  console.error(`MinimalDriverPage: Error reading ${key}:`, e);
                }
              }
            }
          }
        } catch (storageErr) {
          console.error('MinimalDriverPage: Error reading from localStorage:', storageErr);
        }

        // Try using the API route first
        try {
          console.log('MinimalDriverPage: Checking session via API route...');
          const url = sessionToken
            ? `/api/check-driver-session?session=${encodeURIComponent(sessionToken)}`
            : '/api/check-driver-session';

          const response = await fetch(url);
          const result = await response.json();

          if (!isMounted) return;

          if (!result.success || !result.authenticated) {
            console.log('MinimalDriverPage: API session check failed:', result.error);
            throw new Error(result.error || 'Not authenticated');
          }

          if (!result.isDriver) {
            console.log('MinimalDriverPage: User is not a driver');
            setError('Access denied. This dashboard is for drivers only.');
            setLoading(false);
            return;
          }

          console.log('MinimalDriverPage: API session check successful');
          setUser(result.user);
          setProfile(result.profile);
          setAssignments(result.assignments || []);

          // Calculate stats
          const driverAssignments = result.assignments || [];
          setStats({
            total: driverAssignments.length,
            pending: driverAssignments.filter((order: any) => order.status === 'assigned' || order.status === 'pending').length,
            in_transit: driverAssignments.filter((order: any) =>
              order.status === 'in_transit' ||
              order.status === 'picked_up'
            ).length,
            delivered: driverAssignments.filter((order: any) => order.status === 'delivered').length
          });

          if (isMounted) setLoading(false);
          return;
        } catch (apiError) {
          console.error('MinimalDriverPage: API route failed, falling back to direct Supabase call:', apiError);
          // Continue to fallback method
        }

        // Fallback: Use direct Supabase client
        console.log('MinimalDriverPage: Falling back to direct Supabase session check');

        // Try to get the session directly from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          console.error('MinimalDriverPage: Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log('MinimalDriverPage: No active session found via getSession()');

          // As a last resort, try to manually set the session if we have a token
          if (sessionToken) {
            console.log('MinimalDriverPage: Attempting to set session manually with token');
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: sessionToken,
                refresh_token: '',
              });

              if (error) {
                console.error('MinimalDriverPage: Error setting session manually:', error);
                setError('Authentication failed. Please log in again.');
                setLoading(false);
                return;
              }

              if (data.session) {
                console.log('MinimalDriverPage: Successfully set session manually');
                // Continue with the manually set session
                const manualSession = data.session;
                setUser(manualSession.user);

                // Get profile
                console.log('MinimalDriverPage: Fetching profile with manually set session...');
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', manualSession.user.id)
                  .single();

                if (profileError) {
                  console.error('MinimalDriverPage: Error fetching profile with manual session:', profileError);
                  setError('Error fetching profile. Please try again.');
                  setLoading(false);
                  return;
                }

                setProfile(profileData);

                // Verify this is a driver
                if (profileData.role !== 'driver') {
                  console.log('MinimalDriverPage: User is not a driver:', profileData.role);
                  setError('Access denied. This dashboard is for drivers only.');
                  setLoading(false);
                  return;
                }

                // Load assignments for this driver
                console.log('MinimalDriverPage: Loading driver assignments with manual session...');
                await loadDriverAssignments(profileData.id);
                console.log('MinimalDriverPage: Assignments loaded successfully with manual session');
                setLoading(false);
                return;
              }
            } catch (manualErr) {
              console.error('MinimalDriverPage: Error in manual session setup:', manualErr);
            }
          }

          setError('No active session. Please log in.');
          setLoading(false);
          return;
        }

        console.log('MinimalDriverPage: Session found:', session.user.id);
        setUser(session.user);

        // Get profile
        console.log('MinimalDriverPage: Fetching profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!isMounted) return;

        if (profileError) {
          console.error('MinimalDriverPage: Error fetching profile:', profileError);
          setError('Error fetching profile. Please try again.');
          setLoading(false);
          return;
        } else {
          console.log('MinimalDriverPage: Profile fetched:', profileData);
          setProfile(profileData);

          // Verify this is a driver
          if (profileData.role !== 'driver') {
            console.log('MinimalDriverPage: User is not a driver:', profileData.role);
            setError('Access denied. This dashboard is for drivers only.');
            setLoading(false);
            return;
          }

          // Load assignments for this driver
          console.log('MinimalDriverPage: Loading driver assignments...');
          await loadDriverAssignments(profileData.id);
          console.log('MinimalDriverPage: Assignments loaded successfully');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('MinimalDriverPage: Error in authentication flow:', err);
        setError(err.message);
      } finally {
        if (isMounted) {
          console.log('MinimalDriverPage: Setting loading to false');
          setLoading(false);
        }
      }
    }

    getSession();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  const loadDriverAssignments = async (driverId: string) => {
    try {
      console.log('MinimalDriverPage: Loading assignments for driver ID:', driverId);

      // Try using the API route instead of direct Supabase call
      try {
        console.log('MinimalDriverPage: Fetching assignments via API route...');
        const response = await fetch(`/api/driver-assignments?driverId=${driverId}`);

        if (!response.ok) {
          throw new Error(`API returned status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch assignments');
        }

        const ordersData = result.orders;
        console.log(`MinimalDriverPage: API found ${ordersData?.length || 0} orders for driver ID ${driverId}`);

        // Transform the data to match the expected format
        const driverAssignments = ordersData?.map((order: any) => ({
          ...order,
          customer_name: order.customers?.name || 'Unknown',
          customer_phone: order.customers?.phone || 'N/A',
          items: order.items || order.delivery_notes || 'No items specified',
        })) || [];

        setAssignments(driverAssignments);

        // Calculate stats
        setStats({
          total: driverAssignments.length,
          pending: driverAssignments.filter((order: any) => order.status === 'assigned' || order.status === 'pending').length,
          in_transit: driverAssignments.filter((order: any) =>
            order.status === 'in_transit' ||
            order.status === 'picked_up'
          ).length,
          delivered: driverAssignments.filter((order: any) => order.status === 'delivered').length
        });

        return; // Exit if API call was successful
      } catch (apiError) {
        console.error('MinimalDriverPage: API route failed, falling back to direct Supabase call:', apiError);
      }

      // Fallback: Fetch directly from Supabase
      console.log('MinimalDriverPage: Fetching assignments directly from Supabase...');
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers:customers(*)
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('MinimalDriverPage: Error fetching orders from Supabase:', error);
        throw error;
      }

      console.log(`MinimalDriverPage: Supabase found ${ordersData?.length || 0} orders for driver ID ${driverId}`);

      // Transform the data to match the expected format
      const driverAssignments = ordersData?.map(order => ({
        ...order,
        customer_name: order.customers?.name || 'Unknown',
        customer_phone: order.customers?.phone || 'N/A',
        items: order.items || order.delivery_notes || 'No items specified',
      })) || [];

      setAssignments(driverAssignments);

      // Calculate stats
      setStats({
        total: driverAssignments.length,
        pending: driverAssignments.filter(order => order.status === 'assigned' || order.status === 'pending').length,
        in_transit: driverAssignments.filter(order =>
          order.status === 'in_transit' ||
          order.status === 'picked_up'
        ).length,
        delivered: driverAssignments.filter(order => order.status === 'delivered').length
      });
    } catch (err) {
      console.error('MinimalDriverPage: Error loading driver assignments:', err);
    }
  };

  // Fetch driver availability status
  const fetchDriverAvailability = async (driverId: string) => {
    try {
      const response = await fetch(`/api/driver/availability?driverId=${driverId}`);
      const data = await response.json();

      if (data.error) {
        console.error('Error fetching driver availability:', data.error);
        return;
      }

      if (data.data) {
        setIsAvailable(data.data.available);
      }
    } catch (error) {
      console.error('Error fetching driver availability:', error);
    }
  };

  // Update driver location in the database
  const updateDriverLocation = async (driverId: string, lat: number, lng: number) => {
    try {
      await fetch('/api/driver/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driverId,
          available: isAvailable,
          latitude: lat,
          longitude: lng
        })
      });
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };

  // Toggle driver availability
  const toggleAvailability = async () => {
    try {
      if (!profile || !profile.id) {
        alert('User profile not loaded. Please refresh the page.');
        return;
      }

      setAvailabilityLoading(true);

      // Get current location
      let lat = null;
      let lng = null;
      if (currentLocation) {
        lat = currentLocation.lat;
        lng = currentLocation.lng;
      }

      const response = await fetch('/api/driver/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driverId: profile.id,
          available: !isAvailable,
          latitude: lat,
          longitude: lng
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error('Error toggling availability:', data.error);
        alert('Failed to update availability status. Please try again.');
      } else {
        setIsAvailable(!isAvailable);

        // Show notification
        if (Notification.permission === 'granted') {
          const notification = new Notification('Status Updated', {
            body: `You are now ${!isAvailable ? 'available' : 'unavailable'} for new orders`,
            icon: '/favicon.ico'
          });

          // Auto close after 5 seconds
          setTimeout(() => notification.close(), 5000);
        }
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability status. Please try again.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Set driver as unavailable before signing out
      if (isAvailable && profile?.id) {
        await fetch('/api/driver/availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            driverId: profile.id,
            available: false
          })
        });
      }

      console.log('MinimalDriverPage: Signing out...');
      await supabase.auth.signOut();

      // Clear any stored session data
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-slujerwtublzuxtzdtyw-auth-token');

      console.log('MinimalDriverPage: Sign out successful, redirecting to login page');
      window.location.href = '/driver-login';
    } catch (err) {
      console.error('MinimalDriverPage: Error signing out:', err);
    }
  };

  // Handle QR code scan
  const handleScan = async (data: { trackingNumber: string; location: string; driverPhone?: string; orderId?: string; shopId?: string }) => {
    console.log('MinimalDriverPage: QR code scanned with data:', data);
    try {
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

      // If we have an orderId directly from the QR code, use it first
      if (data.orderId) {
        console.log('MinimalDriverPage: Using order ID directly from QR code:', data.orderId);

        // Try to find the order by the provided order ID
        const { data: orderByIdData, error: orderByIdError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', data.orderId)
          .single();

        if (!orderByIdError && orderByIdData) {
          console.log('MinimalDriverPage: Found order by ID from QR code:', orderByIdData);

          // Use the dedicated API endpoint for QR code scanning
          console.log('MinimalDriverPage: Using scan-qr-code API endpoint');
          // BEST PRACTICE: Always use the authenticated user's ID (driver ID) as the updated_by field
          // Make sure we have a valid driver ID
          if (!profile?.id) {
            console.error('MinimalDriverPage: No driver ID available, cannot proceed');
            throw new Error('No driver ID available, please log in again');
          }

          console.log('MinimalDriverPage: Using driver ID for updated_by:', profile.id);
          console.log('MinimalDriverPage: QR code data shopId:', data.shopId);

          const response = await fetch('/api/scan-qr-code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderByIdData.id,
              driverId: profile.id, // This is the authenticated user's ID
              shopId: data.shopId, // Include the shop ID from the QR code (optional)
              status: 'in_transit',
              latitude: latitude,
              longitude: longitude
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            console.error('MinimalDriverPage: Error from scan-qr-code API:', result);
            throw new Error(result.error || 'Failed to process QR code');
          }

          console.log('MinimalDriverPage: scan-qr-code API response:', result);

          // Success - set the success message
          setScanSuccess(`Successfully updated order status for order ${orderByIdData.tracking_number} from ${orderByIdData.status} to in_transit`);

          // Manually refresh assignments to ensure UI is updated
          console.log('MinimalDriverPage: Manually refreshing assignments after scan');
          await loadDriverAssignments(profile.id);

          // Force a UI refresh by updating a state variable
          setStats(prevStats => ({
            ...prevStats,
            in_transit: prevStats.in_transit + 1,
            pending: Math.max(0, prevStats.pending - 1)
          }));

          // Close the scanner after a delay
          setTimeout(() => {
            setScannerOpen(false);
            setScanSuccess(null);
          }, 3000);

          return;
        } else {
          console.error('MinimalDriverPage: Error finding order by ID from QR code:', orderByIdError);
          // Continue to try by tracking number
        }
      }

      // Clean up tracking number if needed
      const trackingNumber = data.trackingNumber.trim();
      console.log('MinimalDriverPage: Looking for order with tracking number:', trackingNumber);

      // Find the order by tracking number
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single();

      if (orderError) {
        console.error('MinimalDriverPage: Error finding order:', orderError);

        // Try to find the order by ID as a fallback
        console.log('MinimalDriverPage: Trying to find order by ID instead...');
        const { data: orderByIdData, error: orderByIdError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', trackingNumber)
          .single();

        if (orderByIdError) {
          console.error('MinimalDriverPage: Error finding order by ID:', orderByIdError);
          setScanError(`Order with tracking number or ID ${trackingNumber} not found.`);
          return;
        }

        console.log('MinimalDriverPage: Found order by ID:', orderByIdData);

        // Use the dedicated API endpoint for QR code scanning
        console.log('MinimalDriverPage: Using scan-qr-code API endpoint');

        // BEST PRACTICE: Always use the authenticated user's ID (driver ID) as the updated_by field
        // Make sure we have a valid driver ID
        if (!profile?.id) {
          console.error('MinimalDriverPage: No driver ID available, cannot proceed');
          throw new Error('No driver ID available, please log in again');
        }

        console.log('MinimalDriverPage: Using driver ID for updated_by:', profile.id);
        console.log('MinimalDriverPage: QR code data shopId:', data.shopId);

        const response = await fetch('/api/scan-qr-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderByIdData.id,
            driverId: profile.id, // This is the authenticated user's ID
            shopId: data.shopId, // Include the shop ID from the QR code (optional)
            status: 'in_transit',
            latitude: latitude,
            longitude: longitude
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('MinimalDriverPage: Error from scan-qr-code API:', result);
          throw new Error(result.error || 'Failed to process QR code');
        }

        console.log('MinimalDriverPage: scan-qr-code API response:', result);

        // Success - set the success message
        setScanSuccess(`Successfully updated order status for order ${orderByIdData.tracking_number} from ${orderByIdData.status} to in_transit`);

        // Manually refresh assignments to ensure UI is updated
        console.log('MinimalDriverPage: Manually refreshing assignments after scan');
        await loadDriverAssignments(profile.id);

        // Force a UI refresh by updating a state variable
        setStats(prevStats => ({
          ...prevStats,
          in_transit: prevStats.in_transit + 1,
          pending: Math.max(0, prevStats.pending - 1)
        }));

        // Close the scanner after a delay
        setTimeout(() => {
          setScannerOpen(false);
          setScanSuccess(null);
        }, 3000);

        return;
      }

      console.log('MinimalDriverPage: Found order by tracking number:', orderData);

      // Use the dedicated API endpoint for QR code scanning
      console.log('MinimalDriverPage: Using scan-qr-code API endpoint');

      // BEST PRACTICE: Always use the authenticated user's ID (driver ID) as the updated_by field
      // Make sure we have a valid driver ID
      if (!profile?.id) {
        console.error('MinimalDriverPage: No driver ID available, cannot proceed');
        throw new Error('No driver ID available, please log in again');
      }

      console.log('MinimalDriverPage: Using driver ID for updated_by:', profile.id);
      console.log('MinimalDriverPage: QR code data shopId:', data.shopId);

      const response = await fetch('/api/scan-qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderData.id,
          driverId: profile.id, // This is the authenticated user's ID
          shopId: data.shopId, // Include the shop ID from the QR code (optional)
          status: 'in_transit',
          latitude: latitude,
          longitude: longitude
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('MinimalDriverPage: Error from scan-qr-code API:', result);
        throw new Error(result.error || 'Failed to process QR code');
      }

      console.log('MinimalDriverPage: scan-qr-code API response:', result);

      // Success - set the success message
      setScanSuccess(`Successfully updated order status for order ${orderData.tracking_number} from ${orderData.status} to in_transit`);

      // Manually refresh assignments to ensure UI is updated
      console.log('MinimalDriverPage: Manually refreshing assignments after scan');
      await loadDriverAssignments(profile.id);

      // Force a UI refresh by updating a state variable
      setStats(prevStats => ({
        ...prevStats,
        in_transit: prevStats.in_transit + 1,
        pending: Math.max(0, prevStats.pending - 1)
      }));

      // Close the scanner after a delay
      setTimeout(() => {
        setScannerOpen(false);
        setScanSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('MinimalDriverPage: Error processing QR code:', err);
      setScanError(err.message || 'An error occurred while updating the order status');
    }
  };

  // Handle scan error
  const handleScanError = (errorMessage: string) => {
    setScanError(errorMessage);
    setScanResult(null);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);

      // Get current location if available
      let latitude = null;
      let longitude = null;
      if (currentLocation) {
        latitude = currentLocation.lat;
        longitude = currentLocation.lng;
      }

      // Use a simpler approach - just update the order directly in the database
      console.log('MinimalDriverPage: Updating order directly in the database...');

      // First, create the order history entry manually
      const historyData = {
        order_id: orderId,
        status: newStatus,
        notes: `Status updated to ${newStatus}`,
        updated_by: profile.id || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e', // Ensure this is never null
        created_at: new Date().toISOString()
      };

      // Make sure updated_by is not null
      if (!historyData.updated_by) {
        historyData.updated_by = '9155a1e2-84d0-44ec-8174-f27f8b9cc03e';
      }

      console.log('MinimalDriverPage: Creating order history entry:', historyData);

      // Use the admin client to bypass RLS
      console.log('MinimalDriverPage: Using admin client to bypass RLS');
      const { error: historyError } = await supabaseAdmin
        .from('order_history')
        .insert(historyData);

      if (historyError) {
        console.error('MinimalDriverPage: Error creating order history:', historyError);
        throw new Error(`Failed to create order history: ${historyError.message}`);
      }

      // Now update the order status
      console.log('MinimalDriverPage: Updating order status...');

      // Use the dedicated API endpoint for QR code scanning
      console.log('MinimalDriverPage: Using scan-qr-code API endpoint');

      // BEST PRACTICE: Always use the authenticated user's ID (driver ID) as the updated_by field
      // Make sure we have a valid driver ID
      if (!profile?.id) {
        console.error('MinimalDriverPage: No driver ID available, cannot proceed');
        throw new Error('No driver ID available, please log in again');
      }

      console.log('MinimalDriverPage: Using driver ID for updated_by:', profile.id);

      const response = await fetch('/api/scan-qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          driverId: profile.id, // This is the authenticated user's ID
          // We don't have shopId here, but the API will handle it
          status: newStatus,
          latitude: latitude,
          longitude: longitude
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('MinimalDriverPage: Error from scan-qr-code API:', result);
        throw new Error(result.error || 'Failed to update order status');
      }

      console.log('MinimalDriverPage: scan-qr-code API response:', result);

      // Success - set the success message
      setScanSuccess(`Successfully updated order status to ${newStatus}`);

      // Refresh the assignments
      await loadDriverAssignments(profile.id);

      // Force a UI refresh by updating a state variable
      if (newStatus === 'in_transit') {
        setStats(prevStats => ({
          ...prevStats,
          in_transit: prevStats.in_transit + 1,
          pending: Math.max(0, prevStats.pending - 1)
        }));
      } else if (newStatus === 'delivered') {
        setStats(prevStats => ({
          ...prevStats,
          delivered: prevStats.delivered + 1,
          in_transit: Math.max(0, prevStats.in_transit - 1)
        }));
      }

      // Show a toast notification instead of an alert
      if (Notification.permission === 'granted') {
        const notification = new Notification('Order Status Updated', {
          body: `Order status changed to ${newStatus}`,
          icon: '/favicon.ico'
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } else {
        // Fallback to alert if notifications are not allowed
        alert(`Delivery status updated to ${newStatus}`);
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`Error updating status: ${err.message}`);
    } finally {
      setLoading(false);
    }
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

          {debugMode && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Debug Information:</h3>
              <p className="text-xs text-blue-700 mb-2">This information is only visible in debug mode.</p>
              <div className="text-xs text-blue-800 overflow-auto max-h-40">
                <p><strong>URL:</strong> {window.location.href}</p>
                <p><strong>localStorage Keys:</strong> {Object.keys(localStorage).join(', ') || 'None'}</p>
                <p><strong>Cookies:</strong> {document.cookie || 'None'}</p>
                <p><strong>User Agent:</strong> {navigator.userAgent}</p>
              </div>
              <div className="mt-4">
                <Link href="/diagnostic" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Go to Diagnostic Tool
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Link href="/driver-login" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <header className="bg-white shadow-md rounded-xl p-5 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600">
                Welcome, {profile?.name || user?.user_metadata?.name || 'Driver'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAvailability}
                  disabled={availabilityLoading}
                  className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center ${isAvailable ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}`}
                >
                  {availabilityLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${isAvailable ? 'text-white' : 'text-gray-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isAvailable ? 'Available' : 'Go Online'}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
              </div>
            </div>
          </div>
        </header>

        {/* Order Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-2xl font-bold text-gray-800">{isAvailable ? 'Online' : 'Offline'}</p>
              </div>
              <div className={`p-3 ${isAvailable ? 'bg-green-100' : 'bg-gray-100'} rounded-full`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isAvailable ? 'text-green-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Pickup</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">In Transit</p>
                <p className="text-2xl font-bold text-gray-800">{stats.in_transit}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-gray-800">{stats.delivered}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        {profile && profile.id && (
          <div className="mb-6">
            <DriverNotifications
              driverId={profile.id}
              onAccept={(_notification) => {
                // Refresh assignments after accepting
                loadDriverAssignments(profile.id);
              }}
              onReject={(_notification) => {
                // Refresh assignments after rejecting
                loadDriverAssignments(profile.id);
              }}
            />
          </div>
        )}

        {/* QR Code Scanner Section */}
        <div className="mb-6">
          <button
            onClick={() => setScannerOpen(!scannerOpen)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 mb-4 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            {scannerOpen ? 'Hide QR Scanner' : 'Scan QR Code'}
          </button>

          {scannerOpen && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-4">
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
                    <div className="scanner-container">
                      <div className="mb-2 text-sm text-blue-600">
                        Camera access required for scanning
                      </div>
                      <div className="relative">
                        <div id="scanner-wrapper">
                          {(() => {
                            try {
                              return (
                                <Html5QRScanner
                                  onScan={handleScan}
                                  onError={handleScanError}
                                />
                              );
                            } catch (err) {
                              console.error('Error rendering scanner:', err);
                              return (
                                <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                                  Error initializing scanner. Please refresh the page and try again.
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
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
                        <p><strong>Tracking Number:</strong> {scanResult.trackingNumber}</p>
                        <p><strong>Dispatch Location:</strong> {scanResult.location}</p>
                        {scanResult.orderId && (
                          <p><strong>Order ID:</strong> {scanResult.orderId}</p>
                        )}
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

        <div className="bg-white shadow-md rounded-xl p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-800">My Assignments</h2>
              <button
                onClick={() => loadDriverAssignments(profile?.id || '')}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Refresh assignments"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <select
                value={statusFilter || 'all'}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-60">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-500">Loading assignments...</p>
              </div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg">No assignments found</p>
              <p className="text-gray-400 mt-1">Check back later for new deliveries</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments
                    .filter(order => statusFilter === 'all' || order.status === statusFilter)
                    .map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">{assignment.tracking_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {assignment.customer_name}<br />
                        <span className="text-xs text-gray-500">{assignment.customer_phone}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{assignment.delivery_address}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${assignment.status === 'pending' || assignment.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                            assignment.status === 'picked_up' || assignment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                            assignment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {(assignment.status === 'pending' || assignment.status === 'assigned') && (
                            <button
                              onClick={() => handleUpdateStatus(assignment.id, 'in_transit')}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              Pick Up
                            </button>
                          )}
                          {(assignment.status === 'in_transit' || assignment.status === 'picked_up') && (
                            <button
                              onClick={() => handleUpdateStatus(assignment.id, 'delivered')}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            >
                              Deliver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
