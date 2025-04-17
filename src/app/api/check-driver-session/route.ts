import { NextResponse } from 'next/server';
import supabase from '@/utils/supabase-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get('session');

    if (!sessionToken) {
      return NextResponse.json({ 
        success: false, 
        authenticated: false,
        error: 'No session token provided' 
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
