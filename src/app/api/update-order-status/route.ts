import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received update order status request:', body);

    const { orderId, status, driverId, latitude, longitude } = body;

    // Validate required fields
    if (!orderId) console.log('Missing orderId in request');
    if (!status) console.log('Missing status in request');
    if (!driverId) console.log('Missing driverId in request');

    if (!orderId || !status || !driverId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID, status, and driver ID are required'
      }, { status: 400 });
    }

    // Get the current order details first
    console.log(`Looking up order with ID: ${orderId}`);
    const { data: orderResults, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId);

    console.log('Order lookup results:', { orderResults, orderError });

    if (orderError) {
      console.error('Error fetching order details:', orderError);
      return NextResponse.json({ success: false, error: orderError.message }, { status: 500 });
    }

    if (!orderResults || orderResults.length === 0) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderResults[0];
    console.log('Found order:', orderData);

    // Update the order status
    console.log(`Updating order ${orderId} to status: ${status}, driver: ${driverId}`);
    const updateData = {
      status,
      driver_id: driverId, // Ensure driver is assigned
      updated_at: new Date().toISOString()
    };
    console.log('Update data:', updateData);

    const { data: updatedResults, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select();

    console.log('Update results:', { updatedResults, updateError });

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    if (!updatedResults || updatedResults.length === 0) {
      console.error('No order was updated');
      return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
    }

    const updatedOrder = updatedResults[0];
    console.log('Updated order:', updatedOrder);

    // Create order history entry
    console.log('Creating order history entry');
    const historyData = {
      order_id: orderId,
      status,
      notes: `Status updated to ${status}`,
      created_at: new Date().toISOString(),
      updated_by: driverId,
      latitude,
      longitude
    };
    console.log('History data:', historyData);

    const { data: historyResult, error: historyError } = await supabase
      .from('order_history')
      .insert(historyData)
      .select();

    console.log('History creation result:', { historyResult, historyError });

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
