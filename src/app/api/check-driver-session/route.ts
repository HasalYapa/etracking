import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for this API route
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let sessionToken = searchParams.get('session');
    const authHeader = request.headers.get('Authorization');

    // Check for token in Authorization header
    if (!sessionToken && authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
      console.log('API: Found session token in Authorization header');
    }

    // If no session token is provided, try to get the session from cookies
    if (!sessionToken) {
      console.log('API: No session token provided, checking for session in cookies');

      // Get session from cookies
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.log('API: No session found in cookies');
        return NextResponse.json({
          success: false,
          authenticated: false,
          error: 'No active session found'
        });
      }

      console.log('API: Session found in cookies');

      // Get user profile to check role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('API: Error fetching profile from cookies session:', profileError);
        return NextResponse.json({
          success: false,
          authenticated: true,
          isDriver: false,
          error: 'Error verifying user role'
        });
      }

      const isDriver = profileData.role === 'driver';

      // Get driver assignments if this is a driver
      let assignments = [];
      if (isDriver) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            customers(*)
          `)
          .eq('driver_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!ordersError && ordersData) {
          assignments = ordersData.map(order => ({
            ...order,
            customer_name: order.customers?.name || 'Unknown',
            customer_phone: order.customers?.phone || 'N/A',
            items: order.items || order.delivery_notes || 'No items specified',
          }));
        }
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        isDriver,
        profile: profileData,
        assignments,
        user: session.user
      });
    }

    console.log('API: Checking driver session...');

    // Verify the session token
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken);

    if (error || !user) {
      console.error('API: Session verification error:', error);
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: error?.message || 'Invalid session'
      });
    }

    // Get user profile to check role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('API: Error fetching profile:', profileError);
      return NextResponse.json({
        success: false,
        authenticated: true,
        isDriver: false,
        error: 'Error verifying user role'
      });
    }

    const isDriver = profileData.role === 'driver';

    // Get driver assignments if this is a driver
    let assignments = [];
    if (isDriver) {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (!ordersError && ordersData) {
        assignments = ordersData.map(order => ({
          ...order,
          customer_name: order.customers?.name || 'Unknown',
          customer_phone: order.customers?.phone || 'N/A',
          items: order.items || order.delivery_notes || 'No items specified',
        }));
      }
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      isDriver,
      profile: profileData,
      assignments,
      user
    });
  } catch (error: any) {
    console.error('API: Unexpected error in check-driver-session:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: error.message
    }, { status: 500 });
  }
}
