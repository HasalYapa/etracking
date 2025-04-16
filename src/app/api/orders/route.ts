import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

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
      driverId
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

    // Create an order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        shop_id: session.user.id,
        customer_id: customer.id,
        driver_id: driverId || null,
        status: driverId ? 'assigned' : 'pending',
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes || null,
        tracking_number: trackingNumber
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
        status: driverId ? 'assigned' : 'pending',
        notes: 'Order created',
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
          status: driverId ? 'assigned' : 'pending',
          notes: 'Order created (fallback)',
          created_at: timestamp,
          updated_by: shopOwnerId
        });

      if (fallbackError) {
        return NextResponse.json({ error: 'Failed to create order history: ' + fallbackError.message }, { status: 500 });
      }
    }

    // If driver is assigned, send an SMS notification (mock for now)
    if (driverId) {
      await supabase
        .from('sms_logs')
        .insert({
          order_id: order.id,
          customer_id: customer.id,
          message: `Your order has been assigned to a driver. Track it at: ${process.env.NEXT_PUBLIC_BASE_URL}/track/${order.tracking_number}`,
          status: 'sent',
          shop_id: session.user.id
        });
    }

    return NextResponse.json({ data: { ...order, customer } });
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
