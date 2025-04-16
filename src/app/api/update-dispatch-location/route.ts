import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with hardcoded credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { order_id, dispatch_location, driver_id, timestamp, latitude, longitude } = body;

    console.log('Received update request:', { order_id, dispatch_location, driver_id });

    if (!order_id || !dispatch_location) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id and dispatch_location' },
        { status: 400 }
      );
    }

    // First, get the order to verify it exists
    // Check if order_id is a tracking number (starts with ET-) or a UUID
    let orderQuery;
    if (order_id.startsWith('ET-')) {
      console.log('Looking up order by tracking number:', order_id);
      orderQuery = supabase
        .from('orders')
        .select('*')
        .eq('tracking_number', order_id)
        .single();
    } else {
      console.log('Looking up order by ID:', order_id);
      orderQuery = supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();
    }

    const { data: order, error: orderError } = await orderQuery;

    if (orderError || !order) {
      console.error('Order not found:', orderError?.message);
      return NextResponse.json(
        { error: 'Order not found', details: orderError?.message },
        { status: 404 }
      );
    }

    console.log('Found order:', { id: order.id, status: order.status });

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

    // Return success response with more details
    return NextResponse.json({
      success: true,
      message: 'Dispatch location updated successfully',
      data: {
        order_id,
        dispatch_location,
        timestamp,
        status: 'in_transit',
        latitude,
        longitude
      }
    });
  } catch (error: any) {
    console.error('Error updating dispatch location:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
