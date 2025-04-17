import { NextResponse } from 'next/server';
import supabase from '@/utils/supabase-service';

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

    // Update the order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in update-order-status API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
