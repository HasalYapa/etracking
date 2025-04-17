import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    if (!data.orderId || !data.driverId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: orderId and driverId are required' 
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
    
    // Get the driver
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('drivers')
      .select('*')
      .eq('id', data.driverId)
      .single();
    
    if (driverError) {
      console.error('Error fetching driver:', driverError);
      return NextResponse.json({ 
        success: false, 
        error: 'Driver not found' 
      }, { status: 404 });
    }
    
    // Update order with driver assignment
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        driver_id: data.driverId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.orderId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: updateError.message 
      }, { status: 500 });
    }
    
    // Create order history entry
    const { error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert({
        order_id: data.orderId,
        status: 'assigned',
        notes: `Order assigned to driver ${driver.name}`,
        updated_by: data.driverId
      });
    
    if (historyError) {
      console.error('Error creating order history:', historyError);
      // Don't fail the request if history creation fails
    }
    
    // Create driver notification
    const { error: notificationError } = await supabaseAdmin
      .from('driver_notifications')
      .insert({
        driver_id: data.driverId,
        order_id: data.orderId,
        message: `New order assigned: ${order.tracking_number}`,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    
    if (notificationError) {
      console.error('Error creating driver notification:', notificationError);
      // Don't fail the request if notification creation fails
    }
    
    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order successfully assigned to driver ${driver.name}`
    });
    
  } catch (error: any) {
    console.error('Error in assign-order API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unknown error occurred'
    }, { status: 500 });
  }
}
