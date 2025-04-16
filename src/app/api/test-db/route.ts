import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials - same as in your lib/supabase.ts
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Get a valid user ID from the auth.users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No users found in the database',
        details: usersError || 'Empty users array'
      }, { status: 500 });
    }

    const testUserId = users[0].id;
    const timestamp = new Date().toISOString();

    // Step 1: Insert a test customer
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        name: 'Test Customer',
        phone: '+94760061600',
        email: 'test@example.com',
        address: 'Test Address, Colombo',
        shop_id: testUserId,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();

    if (customerError) {
      return NextResponse.json({
        success: false,
        error: 'Customer creation failed',
        details: customerError
      }, { status: 500 });
    }

    // Step 2: Insert a test order
    const trackingNumber = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tracking_number: trackingNumber,
        shop_id: testUserId,
        customer_id: customerData.id,
        status: 'pending',
        delivery_address: 'Test Delivery Address',
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({
        success: false,
        error: 'Order creation failed',
        details: orderError
      }, { status: 500 });
    }

    // Step 3: Insert a test order history entry
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert({
        order_id: orderData.id,
        status: 'pending',
        notes: 'Test order created',
        created_at: timestamp,
        updated_by: testUserId // This is required and cannot be null
      })
      .select()
      .single();

    console.log('Order history insert attempt:', {
      orderData,
      testUserId,
      historyError
    });

    if (historyError) {
      return NextResponse.json({
        success: false,
        error: 'Order history creation failed',
        details: historyError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test data inserted successfully',
      data: {
        customer: customerData,
        order: orderData,
        history: historyData
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message
    }, { status: 500 });
  }
}
