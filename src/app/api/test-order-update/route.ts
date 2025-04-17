import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Get the order ID from the URL
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || '22908b36-5e52-439c-80bc-18eb084e93c6'; // Default to a known order ID
    const driverId = searchParams.get('driverId') || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e'; // Default to a known driver ID

    console.log(`Testing order update for order ID: ${orderId}, driver ID: ${driverId}`);

    // Step 1: Check if the order exists using admin client to bypass RLS
    const { data: orderResults, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId);

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json({
        success: false,
        error: orderError.message,
        step: 'order_lookup'
      }, { status: 500 });
    }

    if (!orderResults || orderResults.length === 0) {
      console.error('Order not found:', orderId);
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        step: 'order_lookup'
      }, { status: 404 });
    }

    const orderData = orderResults[0];
    console.log('Found order:', orderData);

    // Step 2: Try to update the order using admin client to bypass RLS
    const updateData = {
      status: 'in_transit',
      driver_id: driverId,
      updated_at: new Date().toISOString()
    };

    const { data: updatedResults, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message,
        step: 'order_update',
        updateData
      }, { status: 500 });
    }

    if (!updatedResults || updatedResults.length === 0) {
      console.error('No order was updated');
      return NextResponse.json({
        success: false,
        error: 'Failed to update order',
        step: 'order_update',
        updateData
      }, { status: 500 });
    }

    const updatedOrder = updatedResults[0];
    console.log('Updated order:', updatedOrder);

    // Step 3: Try to create an order history entry using admin client to bypass RLS

    // Make sure driverId is not null or undefined
    if (!driverId) {
      console.error('Driver ID is null or undefined, using a default value');
    }

    // Use a default driver ID if none is provided
    const updatedBy = driverId || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e'; // Default driver ID

    const historyData = {
      order_id: orderId,
      status: 'in_transit',
      notes: 'Status updated to in_transit (test)',
      updated_by: updatedBy, // Use the non-null driver ID
      created_at: new Date().toISOString()
    };

    const { data: historyResult, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert(historyData)
      .select();

    if (historyError) {
      console.error('Error creating order history:', historyError);
      // Continue anyway, but include the error in the response
      return NextResponse.json({
        success: true,
        order: updatedOrder,
        previousStatus: orderData.status,
        historyError: historyError.message,
        step: 'history_creation',
        historyData
      });
    }

    // Return success
    return NextResponse.json({
      success: true,
      order: updatedOrder,
      previousStatus: orderData.status,
      history: historyResult
    });

  } catch (error: any) {
    console.error('Unexpected error in test-order-update API:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      step: 'unexpected_error'
    }, { status: 500 });
  }
}
