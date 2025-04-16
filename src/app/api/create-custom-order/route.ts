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

    // First, create a customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: data.customer_name,
        phone: data.customer_phone,
        address: data.delivery_address,
        shop_id: data.shop_id
      })
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer:', customerError);
      return NextResponse.json({
        success: false,
        error: customerError.message
      }, { status: 500 });
    }

    // Then create the order with the customer ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tracking_number: data.tracking_number,
        customer_id: customer.id,
        delivery_address: data.delivery_address,
        // notes field doesn't exist in the schema
        status: 'pending',
        shop_id: data.shop_id
        // updated_by field doesn't exist in the schema
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({
        success: false,
        error: orderError.message
      }, { status: 500 });
    }

    // Return both customer and order data
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        customer_name: customer.name,
        customer_phone: customer.phone
      }
    });

  } catch (error: any) {
    console.error('Error in create-custom-order API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unknown error occurred'
    }, { status: 500 });
  }
}
