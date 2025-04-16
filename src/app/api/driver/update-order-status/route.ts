import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.orderId || !data.status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: orderId and status are required' 
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
    const { data: order, error: orderError } = await supabase
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
    
    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
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
    const { data: historyEntry, error: historyError } = await supabase
      .from('order_history')
      .insert({
        order_id: data.orderId,
        status: data.status,
        notes: `Status updated to ${data.status}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (historyError) {
      console.error('Error creating order history:', historyError);
      // Don't fail the request if history creation fails
      // Just log the error and continue
    }
    
    // Create location entry if location data is provided
    if (data.location && (data.location.lat || data.location.lng)) {
      try {
        const { error: locationError } = await supabase
          .from('order_locations')
          .insert({
            order_id: data.orderId,
            latitude: data.location.lat,
            longitude: data.location.lng,
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
