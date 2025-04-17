import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// GET available drivers
export async function GET(request: Request) {
  try {
    // Get the authenticated user
    const cookieStore = cookies();
    const supabase = createPagesServerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'shop_owner' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only shop owners and admins can access this endpoint' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : null;
    const longitude = searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 5;

    // Get available drivers
    const { data: availableDrivers, error } = await supabase
      .from('driver_availability')
      .select(`
        *,
        driver:profiles(id, name, email, phone)
      `)
      .eq('available', true)
      .order('last_active', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching available drivers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If location is provided, sort drivers by distance
    if (latitude && longitude && availableDrivers) {
      const driversWithDistance = availableDrivers
        .filter(driver => driver.latitude && driver.longitude) // Only include drivers with location
        .map(driver => ({
          ...driver,
          distance: calculateDistance(
            latitude,
            longitude,
            driver.latitude!,
            driver.longitude!
          )
        }))
        .sort((a, b) => a.distance - b.distance);

      return NextResponse.json({ data: driversWithDistance });
    }

    return NextResponse.json({ data: availableDrivers });
  } catch (error: any) {
    console.error('Unexpected error in find available drivers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST to find and assign a driver to an order
export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const cookieStore = cookies();
    const supabase = createPagesServerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'shop_owner' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only shop owners and admins can access this endpoint' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { orderId, latitude, longitude } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get the order to verify it exists and belongs to this shop
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('shop_id', session.user.id)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json({ error: 'Order not found or does not belong to this shop' }, { status: 404 });
    }

    // Get available drivers
    const { data: availableDrivers, error } = await supabase
      .from('driver_availability')
      .select(`
        *,
        driver:profiles(id, name, email, phone)
      `)
      .eq('available', true)
      .order('last_active', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching available drivers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!availableDrivers || availableDrivers.length === 0) {
      return NextResponse.json({ error: 'No available drivers found' }, { status: 404 });
    }

    // If location is provided, sort drivers by distance
    let selectedDriver;
    if (latitude && longitude) {
      const driversWithDistance = availableDrivers
        .filter(driver => driver.latitude && driver.longitude)
        .map(driver => ({
          ...driver,
          distance: calculateDistance(
            latitude,
            longitude,
            driver.latitude!,
            driver.longitude!
          )
        }))
        .sort((a, b) => a.distance - b.distance);

      selectedDriver = driversWithDistance.length > 0 ? driversWithDistance[0] : availableDrivers[0];
    } else {
      // Just take the first available driver
      selectedDriver = availableDrivers[0];
    }

    // Assign the driver to the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        driver_id: selectedDriver.driver_id,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error assigning driver to order:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create a notification for the driver
    const { error: notificationError } = await supabase
      .from('driver_notifications')
      .insert({
        driver_id: selectedDriver.driver_id,
        order_id: orderId,
        message: `New order assigned: ${order.tracking_number}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating driver notification:', notificationError);
      // Continue anyway, the driver is still assigned
    }

    // Create an order history record
    const { error: historyError } = await supabase
      .from('order_history')
      .insert({
        order_id: orderId,
        status: 'assigned',
        notes: `Order assigned to driver ${selectedDriver.driver.name}`,
        updated_by: session.user.id
      });

    if (historyError) {
      console.error('Error creating order history:', historyError);
      // Continue anyway, the order is still updated
    }

    return NextResponse.json({
      data: {
        order: updatedOrder,
        driver: selectedDriver.driver
      },
      message: `Order assigned to driver ${selectedDriver.driver.name}`
    });
  } catch (error: any) {
    console.error('Unexpected error in assign driver:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
