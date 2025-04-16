import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Get a valid user ID to use
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role')
      .limit(10);
    
    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No users found in the database', 
        details: usersError 
      }, { status: 500 });
    }
    
    // Find a shop owner
    const shopOwner = users.find(u => u.role === 'shop_owner') || users[0];
    
    // Step 1: Create a test customer using direct SQL
    const timestamp = new Date().toISOString();
    const customerName = `Direct SQL Test Customer ${Date.now()}`;
    
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        name: customerName,
        phone: '+94760061600',
        email: 'direct-test@example.com',
        address: 'Direct SQL Test Address',
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
    
    // Step 2: Create a test order using direct SQL
    const trackingNumber = `DIRECT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tracking_number: trackingNumber,
        shop_id: shopOwner.id,
        customer_id: customer.id,
        status: 'pending',
        delivery_address: 'Direct SQL Test Delivery Address',
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
    
    // Step 3: Create order history entry using direct SQL with explicit updated_by
    const { data: history, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert({
        order_id: order.id,
        status: 'pending',
        notes: 'Direct SQL test order created',
        created_at: timestamp,
        updated_by: shopOwner.id  // Explicitly set updated_by to shop owner ID
      })
      .select()
      .single();
    
    if (historyError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order history creation failed', 
        details: historyError,
        shopOwnerId: shopOwner.id
      }, { status: 500 });
    }
    
    // Step 4: Verify the order history entry was created correctly
    const { data: verifyHistory, error: verifyError } = await supabaseAdmin
      .from('order_history')
      .select('*')
      .eq('id', history.id)
      .single();
    
    if (verifyError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to verify order history', 
        details: verifyError 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Direct SQL test completed successfully',
      data: {
        shopOwner,
        customer,
        order,
        history,
        verifyHistory
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
