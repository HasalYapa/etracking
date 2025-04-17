import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
