import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get tracking number from query parameters
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('number');
    
    if (!trackingNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tracking number is required' 
      }, { status: 400 });
    }
    
    // Get order data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          name,
          phone,
          email,
          address
        ),
        shops:profiles!orders_shop_id_fkey (
          name,
          business_name,
          phone,
          email
        )
      `)
      .eq('tracking_number', trackingNumber)
      .single();
    
    if (orderError) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found. Please check your tracking number and try again.' 
      }, { status: 404 });
    }
    
    // Get order history
    const { data: history, error: historyError } = await supabase
      .from('order_history')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });
    
    if (historyError) {
      console.error('Error fetching order history:', historyError);
      // Don't fail the request if history fetch fails
    }
    
    // Get order locations
    const { data: locations, error: locationsError } = await supabase
      .from('order_locations')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });
    
    if (locationsError) {
      console.error('Error fetching order locations:', locationsError);
      // Don't fail the request if locations fetch fails
    }
    
    // Format the response
    const formattedOrder = {
      ...order,
      customer_name: order.customers?.name || 'Unknown',
      customer_phone: order.customers?.phone || '',
      customer_email: order.customers?.email || '',
      customer_address: order.customers?.address || '',
      history: history || [],
      locations: locations || []
    };
    
    return NextResponse.json({ 
      success: true, 
      data: formattedOrder
    });
    
  } catch (error: any) {
    console.error('Error in tracking API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An unknown error occurred' 
    }, { status: 500 });
  }
}
