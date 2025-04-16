import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Get all users from profiles table
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

    // Find a shop owner and a driver
    const shopOwner = profiles.find(p => p.role === 'shop_owner');
    const driver = profiles.find(p => p.role === 'driver');

    if (!shopOwner) {
      return NextResponse.json({
        success: false,
        error: 'No shop owner found in profiles',
        profiles
      }, { status: 500 });
    }

    const timestamp = new Date().toISOString();
    const results: any = {
      profiles: { shopOwner, driver },
      customers: [],
      orders: [],
      orderHistory: []
    };

    // Create 3 test customers
    for (let i = 1; i <= 3; i++) {
      const { data: customer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          name: `Test Customer ${i}`,
          phone: `+9476006160${i}`,
          email: `customer${i}@example.com`,
          address: `Test Address ${i}, Colombo`,
          shop_id: shopOwner.id,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();

      if (customerError) {
        return NextResponse.json({
          success: false,
          error: `Failed to create customer ${i}`,
          details: customerError
        }, { status: 500 });
      }

      results.customers.push(customer);

      // Create an order for each customer
      const trackingNumber = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;

      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          shop_id: shopOwner.id,
          customer_id: customer.id,
          driver_id: driver ? driver.id : null,
          status: 'pending',
          delivery_address: `Delivery Address ${i}, Colombo`,
          delivery_notes: `Test delivery notes ${i}`,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();

      if (orderError) {
        return NextResponse.json({
          success: false,
          error: `Failed to create order ${i}`,
          details: orderError
        }, { status: 500 });
      }

      results.orders.push(order);

      // Create order history entry
      // Make sure shopOwner.id is not null
      if (!shopOwner.id) {
        return NextResponse.json({
          success: false,
          error: `Shop owner ID is null`,
          shopOwner
        }, { status: 500 });
      }

      console.log(`Creating order history for order ${i} with updated_by:`, shopOwner.id);

      const { data: history, error: historyError } = await supabaseAdmin
        .from('order_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: `Order ${i} created`,
          created_at: timestamp,
          updated_by: shopOwner.id
        })
        .select()
        .single();

      if (historyError) {
        return NextResponse.json({
          success: false,
          error: `Failed to create order history ${i}`,
          details: historyError
        }, { status: 500 });
      }

      results.orderHistory.push(history);
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized with test data',
      results
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message
    }, { status: 500 });
  }
}
