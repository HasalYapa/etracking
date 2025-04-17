import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for this API route
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, driverId, latitude, longitude } = body;

    if (!orderId || !status || !driverId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID, status, and driver ID are required'
      }, { status: 400 });
    }

    // Get the current order details first
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order details:', orderError);
      return NextResponse.json({ success: false, error: orderError.message }, { status: 500 });
    }

    // Update the order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        driver_id: driverId, // Ensure driver is assigned
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // Create order history entry
    const { error: historyError } = await supabase
      .from('order_history')
      .insert({
        order_id: orderId,
        status,
        notes: `Status updated to ${status}`,
        created_at: new Date().toISOString(),
        updated_by: driverId,
        latitude,
        longitude
      });

    if (historyError) {
      console.error('Error creating order history:', historyError);
      // We'll continue even if history creation fails
    }

    // Return the updated order data
    return NextResponse.json({
      success: true,
      order: updatedOrder,
      previousStatus: orderData.status
    });
  } catch (error: any) {
    console.error('Unexpected error in update-order-status API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
