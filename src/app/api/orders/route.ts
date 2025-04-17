import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryNotes,
      driverId,
      autoAssignDriver = false, // New parameter to auto-assign a driver
      latitude,
      longitude
    } = body;

    // Validate required fields
    if (!customerName || !customerPhone || !deliveryAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: customerName,
        phone: customerPhone,
        email: customerEmail || null,
        address: deliveryAddress,
        shop_id: session.user.id
      })
      .select()
      .single();

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }

    // Generate a tracking number
    const trackingNumber = `ET-${nanoid(8).toUpperCase()}`;

    // If auto-assign is requested, find an available driver
    let effectiveDriverId = driverId;
    let assignedDriver = null;

    if (autoAssignDriver && !driverId) {
      console.log('Auto-assigning driver for order');

      // Find available drivers
      const { data: availableDrivers, error: driversError } = await supabase
        .from('driver_availability')
        .select(`
          *,
          driver:profiles(id, name, email, phone)
        `)
        .eq('available', true)
        .order('last_active', { ascending: false })
        .limit(5);

      if (driversError) {
        console.error('Error finding available drivers:', driversError);
        // Continue without a driver if there's an error
      } else if (availableDrivers && availableDrivers.length > 0) {
        // If location is provided, sort drivers by distance
        if (latitude && longitude) {
          // This would be where we'd calculate distance and sort
          // For now, just take the first driver
          effectiveDriverId = availableDrivers[0].driver_id;
          assignedDriver = availableDrivers[0].driver;
        } else {
          // Just take the first available driver
          effectiveDriverId = availableDrivers[0].driver_id;
          assignedDriver = availableDrivers[0].driver;
        }

        console.log(`Auto-assigned driver: ${assignedDriver?.name} (${effectiveDriverId})`);
      } else {
        console.log('No available drivers found for auto-assignment');
      }
    }

    // Create an order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        shop_id: session.user.id,
        customer_id: customer.id,
        driver_id: effectiveDriverId || null,
        status: effectiveDriverId ? 'assigned' : 'pending',
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes || null,
        tracking_number: trackingNumber,
        latitude: latitude || null,
        longitude: longitude || null
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Create an order history record with explicit created_at and updated_by fields
    const timestamp = new Date().toISOString();
    const { error: historyError } = await supabase
      .from('order_history')
      .insert({
        order_id: order.id,
        status: effectiveDriverId ? 'assigned' : 'pending',
        notes: effectiveDriverId ? `Order created and assigned to driver` : 'Order created',
        created_at: timestamp,
        updated_by: session.user.id
      });

    if (historyError) {
      console.error('Error creating order history:', historyError);

      // If the first attempt fails, try with a hardcoded shop owner ID
      const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59'; // Sampath

      const { error: fallbackError } = await supabase
        .from('order_history')
        .insert({
          order_id: order.id,
          status: effectiveDriverId ? 'assigned' : 'pending',
          notes: 'Order created (fallback)',
          created_at: timestamp,
          updated_by: shopOwnerId
        });

      if (fallbackError) {
        return NextResponse.json({ error: 'Failed to create order history: ' + fallbackError.message }, { status: 500 });
      }
    }

    // If driver is assigned, send notifications
    if (effectiveDriverId) {
      // Create SMS log
      await supabase
        .from('sms_logs')
        .insert({
          order_id: order.id,
          customer_id: customer.id,
          message: `Your order has been assigned to a driver. Track it at: ${process.env.NEXT_PUBLIC_BASE_URL}/track/${order.tracking_number}`,
          status: 'sent',
          shop_id: session.user.id
        });

      // Create a notification for the driver
      await supabase
        .from('driver_notifications')
        .insert({
          driver_id: effectiveDriverId,
          order_id: order.id,
          message: `New order assigned: ${order.tracking_number}`,
          status: 'pending',
          created_at: timestamp,
          updated_at: timestamp
        });
    }

    return NextResponse.json({
      data: {
        ...order,
        customer,
        assigned_driver: assignedDriver,
        auto_assigned: autoAssignDriver && effectiveDriverId && !driverId
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check if user is authenticated
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

    let query = supabase
      .from('orders')
      .select(`
        *,
        customers(*),
        drivers:profiles(id, name, email, phone)
      `);

    // Filter orders based on user role
    if (profile?.role === 'shop_owner') {
      query = query.eq('shop_id', session.user.id);
    } else if (profile?.role === 'driver') {
      query = query.eq('driver_id', session.user.id);
    }
    // Admin can see all orders

    // Add sorting
    query = query.order('created_at', { ascending: false });

    const { data: orders, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
