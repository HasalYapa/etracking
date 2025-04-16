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
    if (!data.customer_name || !data.customer_phone || !data.delivery_address || !data.tracking_number || !data.shop_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Validate phone number format
    if (!data.customer_phone.startsWith('+94') || data.customer_phone.length !== 12) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone number must start with +94 and contain 10 digits after that' 
      }, { status: 400 });
    }
    
    // Validate tracking number format
    if (!data.tracking_number.startsWith('ET')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tracking number must start with ET' 
      }, { status: 400 });
    }
    
    // Create order in database
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        tracking_number: data.tracking_number,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_address: data.customer_address || '',
        delivery_address: data.delivery_address,
        notes: data.notes || '',
        status: 'pending',
        shop_id: data.shop_id,
        updated_by: data.shop_id // Set the shop owner as the updater
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      order 
    });
    
  } catch (error: any) {
    console.error('Error in create-custom-order API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An unknown error occurred' 
    }, { status: 500 });
  }
}
