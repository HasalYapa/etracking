import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Import regular client for non-admin operations
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

    // Get the current order details first using admin client to bypass RLS
    console.log(`Looking up order with ID: ${orderId}`);
    const { data: orderResults, error: orderError } = await supabaseAdmin
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

    // Update the order status using admin client to bypass RLS
    console.log(`Updating order ${orderId} to status: ${status}, driver: ${driverId}`);

    // Make sure driverId is not null or undefined
    if (!driverId) {
      console.error('Driver ID is null or undefined, using a default value');
    }

    // Use a default driver ID if none is provided
    const updatedBy = driverId || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e'; // Default driver ID

    const updateData = {
      status,
      driver_id: updatedBy, // Ensure driver is assigned
      updated_at: new Date().toISOString(),
      updated_by: updatedBy // Add this field for the trigger
    };
    console.log('Update data:', updateData);

    const { data: updatedResults, error: updateError } = await supabaseAdmin
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

    // Create order history entry using admin client to bypass RLS
    console.log('Creating order history entry');

    // Make sure driverId is not null or undefined
    if (!driverId) {
      console.error('Driver ID is null or undefined, using a default value');
    }

    // Use a default driver ID if none is provided
    const updatedBy = driverId || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e'; // Default driver ID

    const historyData = {
      order_id: orderId,
      status,
      notes: `Status updated to ${status}`,
      created_at: new Date().toISOString(),
      updated_by: updatedBy, // Use the non-null driver ID
      latitude: latitude || null,
      longitude: longitude || null
    };
    console.log('History data:', historyData);

    const { data: historyResult, error: historyError } = await supabaseAdmin
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
