import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { orderId, driverId, status = 'in_transit', latitude = null, longitude = null } = body;

    console.log('scan-qr-code API: Received request:', { orderId, driverId, status, latitude, longitude });

    // Validate required fields
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    if (!driverId) {
      return NextResponse.json({
        success: false,
        error: 'Driver ID is required'
      }, { status: 400 });
    }

    // Get the current order status before updating
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('status, tracking_number')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('scan-qr-code API: Error fetching order:', orderError);
      return NextResponse.json({
        success: false,
        error: `Error fetching order: ${orderError.message}`
      }, { status: 500 });
    }

    const previousStatus = orderData?.status || 'unknown';
    const trackingNumber = orderData?.tracking_number || 'unknown';

    console.log('scan-qr-code API: Current order status:', previousStatus);

    // Create the order history entry
    // Note: latitude and longitude are removed as they don't exist in the order_history table
    const historyData = {
      order_id: orderId,
      status,
      notes: `Status updated to ${status}`,
      updated_by: driverId,
      created_at: new Date().toISOString()
      // latitude and longitude fields removed
    };

    console.log('scan-qr-code API: Creating order history entry:', historyData);

    const { data: historyResult, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert(historyData)
      .select();

    if (historyError) {
      console.error('scan-qr-code API: Error creating order history:', historyError);

      // Try a different approach - use SQL directly
      try {
        console.log('scan-qr-code API: Trying direct SQL approach for order history');

        const sql = `
          INSERT INTO order_history (order_id, status, notes, updated_by, created_at)
          VALUES ('${orderId}', '${status}', 'Status updated to ${status}', '${driverId}', '${new Date().toISOString()}')
          RETURNING *;
        `;

        const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc('execute_sql', { sql_query: sql });

        if (sqlError) {
          console.error('scan-qr-code API: Error with SQL approach:', sqlError);
          return NextResponse.json({
            success: false,
            error: `Failed to create order history: ${historyError.message}`,
            sqlError: sqlError.message,
            sql
          }, { status: 500 });
        }

        console.log('scan-qr-code API: SQL approach succeeded:', sqlResult);
      } catch (sqlErr: any) {
        console.error('scan-qr-code API: Exception in SQL approach:', sqlErr);
        // Continue with order update even if history creation failed
      }
    } else {
      console.log('scan-qr-code API: Order history created successfully:', historyResult);
    }

    // Update the order status
    const updateData = {
      status,
      driver_id: driverId,
      updated_at: new Date().toISOString()
    };

    console.log('scan-qr-code API: Updating order status:', updateData);

    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select();

    if (updateError) {
      console.error('scan-qr-code API: Error updating order:', updateError);
      return NextResponse.json({
        success: false,
        error: `Failed to update order: ${updateError.message}`
      }, { status: 500 });
    }

    console.log('scan-qr-code API: Order updated successfully:', updateResult);

    // Return success
    return NextResponse.json({
      success: true,
      message: `Order status updated from ${previousStatus} to ${status}`,
      trackingNumber,
      previousStatus,
      newStatus: status,
      order: updateResult?.[0] || null,
      history: historyResult?.[0] || null
    });

  } catch (error: any) {
    console.error('scan-qr-code API: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
