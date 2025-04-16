import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.Oi-qL3Vz9dXEFwZe-QeEVxdpv5JQA3jbYGIZ1hOUxpM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, dispatch_location, driver_id, timestamp, latitude, longitude } = body;

    if (!order_id || !dispatch_location) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id and dispatch_location' },
        { status: 400 }
      );
    }

    // First, get the order to verify it exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found', details: orderError?.message },
        { status: 404 }
      );
    }

    // Create an entry in the order_history table
    const { data: historyData, error: historyError } = await supabase
      .from('order_history')
      .insert({
        order_id,
        status: 'in_transit', // Update status to in_transit when dispatch location is updated
        notes: `Dispatch location updated: ${dispatch_location}`,
        created_at: timestamp || new Date().toISOString(),
        driver_id: driver_id || order.driver_id,
        location: dispatch_location,
        latitude: latitude || null,
        longitude: longitude || null,
      });

    if (historyError) {
      return NextResponse.json(
        { error: 'Failed to update order history', details: historyError.message },
        { status: 500 }
      );
    }

    // Update the order status
    const { data: updateData, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'in_transit',
        last_updated: timestamp || new Date().toISOString(),
        last_location: dispatch_location,
        latitude: latitude || order.latitude,
        longitude: longitude || order.longitude,
      })
      .eq('id', order_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update order', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Dispatch location updated successfully',
      data: { order_id, dispatch_location, timestamp }
    });
  } catch (error: any) {
    console.error('Error updating dispatch location:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
