import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Step 1: Get all profiles to find a shop owner
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch profiles', 
        details: profilesError 
      }, { status: 500 });
    }
    
    // Find a shop owner
    const shopOwner = profiles.find(p => p.role === 'shop_owner');
    
    if (!shopOwner) {
      return NextResponse.json({ 
        success: false, 
        error: 'No shop owner found in profiles', 
        profiles 
      }, { status: 500 });
    }
    
    // Step 2: Get or create a customer
    // First check if any customers exist
    const { data: existingCustomers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check for existing customers', 
        details: customersError 
      }, { status: 500 });
    }
    
    let customer;
    
    if (existingCustomers && existingCustomers.length > 0) {
      // Use an existing customer
      customer = existingCustomers[0];
      console.log('Using existing customer:', customer);
    } else {
      // Create a new customer
      const timestamp = new Date().toISOString();
      const customerName = `Test Customer ${Date.now()}`;
      
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          name: customerName,
          phone: `+94${Math.floor(700000000 + Math.random() * 99999999)}`,
          email: `test-${Date.now()}@example.com`,
          address: 'Test Address, Colombo',
          shop_id: shopOwner.id,
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
      
      customer = newCustomer;
      console.log('Created new customer:', customer);
    }
    
    // Step 3: Create a test order
    const timestamp = new Date().toISOString();
    const trackingNumber = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const orderData = {
      tracking_number: trackingNumber,
      shop_id: shopOwner.id,
      customer_id: customer.id,
      status: 'pending',
      delivery_address: 'Test Delivery Address',
      delivery_notes: 'Test delivery notes',
      created_at: timestamp,
      updated_at: timestamp
    };
    
    console.log('Creating order with data:', orderData);
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (orderError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order creation failed', 
        details: orderError,
        orderData
      }, { status: 500 });
    }
    
    // Step 4: Create order history entry
    const historyData = {
      order_id: order.id,
      status: 'pending',
      notes: 'Test order created',
      created_at: timestamp,
      updated_by: shopOwner.id
    };
    
    console.log('Creating order history with data:', historyData);
    
    const { data: history, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert(historyData)
      .select()
      .single();
    
    if (historyError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order history creation failed', 
        details: historyError,
        historyData
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test order created successfully',
      shopOwner,
      customer,
      order,
      history
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error', 
      details: error.message 
    }, { status: 500 });
  }
}
