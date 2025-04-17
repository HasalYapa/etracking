import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with service role key
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Parse request body
    const data = await request.json();

    // Validate required fields
    if (!data.orderId || !data.status || !data.driverId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: orderId, status, and driverId are required'
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Get the current order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', data.orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    // Verify the driver is assigned to this order
    if (order.driver_id !== data.driverId) {
      return NextResponse.json({
        success: false,
        error: 'You are not authorized to update this order'
      }, { status: 403 });
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: data.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    // Create order history entry
    const historyData = {
      order_id: data.orderId,
      status: data.status,
      notes: data.notes || `Status updated to ${data.status}`,
      updated_by: data.driverId
    };

    const { data: historyEntry, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert(historyData)
      .select()
      .single();

    if (historyError) {
      console.error('Error creating order history:', historyError);
      // Don't fail the request if history creation fails
      // Just log the error and continue
    }

    // Create location entry if location data is provided
    if (data.latitude !== undefined && data.longitude !== undefined) {
      try {
        const { error: locationError } = await supabaseAdmin
          .from('order_locations')
          .insert({
            order_id: data.orderId,
            latitude: data.latitude,
            longitude: data.longitude,
            status: data.status,
            created_at: new Date().toISOString()
          });

        if (locationError) {
          console.error('Error creating location entry:', locationError);
        }
      } catch (locErr) {
        console.error('Error handling location data:', locErr);
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      history: historyEntry
    });

  } catch (error: any) {
    console.error('Error in update-order-status API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unknown error occurred'
    }, { status: 500 });
  }
}
