import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  try {
    const { id } = params;
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

    // For tracking page, we don't require authentication
    // Check if this is a tracking number instead of an ID
    if (id.startsWith('ET-')) {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*),
          drivers:profiles(id, name, email, phone),
          shops:profiles(id, name, email, phone, business_name)
        `)
        .eq('tracking_number', id)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Get order history
      const { data: history } = await supabase
        .from('order_history')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

      return NextResponse.json({ data: { ...order, history } });
    }

    // For regular order details, require authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the order details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(*),
        drivers:profiles(id, name, email, phone),
        shops:profiles(id, name, email, phone, business_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user has access to this order
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (
      profile?.role === 'shop_owner' && order.shop_id !== session.user.id ||
      profile?.role === 'driver' && order.driver_id !== session.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get order history
    const { data: history } = await supabase
      .from('order_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ data: { ...order, history } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  try {
    const { id } = params;
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
    const { status, notes, proof_of_delivery } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Get the current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user has access to update this order
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (
      profile?.role === 'shop_owner' && order.shop_id !== session.user.id ||
      profile?.role === 'driver' && order.driver_id !== session.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        proof_of_delivery: proof_of_delivery || order.proof_of_delivery,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create an order history record
    await supabase
      .from('order_history')
      .insert({
        order_id: id,
        status,
        notes: notes || `Order status updated to ${status}`,
        updated_by: session.user.id
      });

    // Send SMS notification (mock for now)
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .single();

    let message = '';
    switch (status) {
      case 'assigned':
        message = `Your order has been assigned to a driver. Track it at: ${process.env.NEXT_PUBLIC_BASE_URL}/track/${order.tracking_number}`;
        break;
      case 'picked_up':
        message = `Your order has been picked up and is on its way. Track it at: ${process.env.NEXT_PUBLIC_BASE_URL}/track/${order.tracking_number}`;
        break;
      case 'in_transit':
        message = `Your order is in transit. Track it at: ${process.env.NEXT_PUBLIC_BASE_URL}/track/${order.tracking_number}`;
        break;
      case 'delivered':
        message = `Your order has been delivered. Thank you for using our service!`;
        break;
      default:
        message = `Your order status has been updated to ${status}. Track it at: ${process.env.NEXT_PUBLIC_BASE_URL}/track/${order.tracking_number}`;
    }

    await supabase
      .from('sms_logs')
      .insert({
        order_id: id,
        customer_id: order.customer_id,
        message,
        status: 'sent',
        shop_id: order.shop_id
      });

    return NextResponse.json({ data: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
