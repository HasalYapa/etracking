import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.Oi-qL8YYgYONxGEDGYEDgRdKvJXW0LYVpNYwUJTv0Zc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
