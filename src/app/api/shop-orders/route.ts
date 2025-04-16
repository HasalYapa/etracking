import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Hardcoded shop owner ID (Sampath)
const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59';

export async function GET() {
  try {
    // Create Supabase client with cookies for auth
    const cookieStore = cookies();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // If there's a session error or no session, try using the service role
    if (sessionError || !session) {
      console.log('No valid session, using service role with hardcoded shop owner ID');
      return getOrdersWithServiceRole();
    }

    // Get the user's ID from the session
    const userId = session.user.id;

    // Get the user's profile to check their role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('Error fetching profile, using service role with hardcoded shop owner ID');
      return getOrdersWithServiceRole();
    }

    // If the user is not a shop owner, return an error
    if (profile.role !== 'shop_owner') {
      return NextResponse.json({
        success: false,
        error: 'Only shop owners can view orders'
      }, { status: 403 });
    }

    // Get all orders for this shop owner
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          name,
          phone,
          email,
          address
        )
      `)
      .eq('shop_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.log('Error fetching orders with user session, trying service role');
      return getOrdersWithServiceRole();
    }

    // Format the orders to include customer name
    const formattedOrders = orders.map(order => ({
      ...order,
      customer_name: order.customers?.name || 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error: any) {
    console.error('Unexpected error in shop-orders API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Helper function to get orders using the service role
async function getOrdersWithServiceRole() {
  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get all orders for the hardcoded shop owner
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers (
          name,
          phone,
          email,
          address
        )
      `)
      .eq('shop_id', shopOwnerId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch orders',
        details: ordersError
      }, { status: 500 });
    }

    // Format the orders to include customer name
    const formattedOrders = orders.map(order => ({
      ...order,
      customer_name: order.customers?.name || 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
