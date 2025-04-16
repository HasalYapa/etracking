import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.Oi-qQJjIRmzQQBQgH516hcZvZLhTQVXnqPCULqt4YhE';

// Hardcoded shop owner ID (Sampath)
const defaultShopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59';

export async function GET(request: Request) {
  try {
    // Get shop ID from query parameters
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId') || defaultShopOwnerId;
    
    console.log(`Fetching orders for shop ID: ${shopId}`);
    
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
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
    console.error('Unexpected error in direct-shop-orders API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
