import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, customerEmail, deliveryAddress, deliveryNotes } = body;
    
    if (!customerName || !customerPhone || !deliveryAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Customer name, phone, and delivery address are required' 
      }, { status: 400 });
    }
    
    // Step 1: Get a valid shop owner ID
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role')
      .eq('role', 'shop_owner')
      .limit(1);
    
    if (profilesError || !profiles || profiles.length === 0) {
      // Try to get any profile
      const { data: anyProfiles, error: anyProfilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, role')
        .limit(1);
      
      if (anyProfilesError || !anyProfiles || anyProfiles.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'No profiles found in the database' 
        }, { status: 500 });
      }
      
      var shopOwner = anyProfiles[0];
    } else {
      var shopOwner = profiles[0];
    }
    
    // Step 2: Create or get customer
    const timestamp = new Date().toISOString();
    
    // Check if customer already exists
    const { data: existingCustomers, error: customerCheckError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone', customerPhone)
      .eq('shop_id', shopOwner.id);
    
    if (customerCheckError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check for existing customer', 
        details: customerCheckError 
      }, { status: 500 });
    }
    
    let customer;
    
    if (existingCustomers && existingCustomers.length > 0) {
      customer = existingCustomers[0];
    } else {
      // Create new customer
      const { data: newCustomer, error: customerCreateError } = await supabaseAdmin
        .from('customers')
        .insert({
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
          address: deliveryAddress,
          shop_id: shopOwner.id,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();
      
      if (customerCreateError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create customer', 
          details: customerCreateError 
        }, { status: 500 });
      }
      
      customer = newCustomer;
    }
    
    // Step 3: Create order
    const trackingNumber = `DIRECT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tracking_number: trackingNumber,
        shop_id: shopOwner.id,
        customer_id: customer.id,
        status: 'pending',
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes || null,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();
    
    if (orderError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create order', 
        details: orderError 
      }, { status: 500 });
    }
    
    // Step 4: Create order history
    // Try multiple approaches
    
    // Approach 1: Direct insert
    const { data: history, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert({
        order_id: order.id,
        status: 'pending',
        notes: 'Order created via direct API',
        created_at: timestamp,
        updated_by: shopOwner.id
      })
      .select()
      .single();
    
    if (historyError) {
      // Approach 2: REST API
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/order_history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            order_id: order.id,
            status: 'pending',
            notes: 'Order created via REST API',
            created_at: timestamp,
            updated_by: shopOwner.id
          })
        });
        
        if (!response.ok) {
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to create order history using both methods', 
            sdkError: historyError,
            restError: await response.text(),
            order,
            customer,
            shopOwner
          }, { status: 500 });
        }
        
        var historyData = await response.json();
      } catch (restError: any) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create order history using both methods', 
          sdkError: historyError,
          restError: restError.message,
          order,
          customer,
          shopOwner
        }, { status: 500 });
      }
    } else {
      var historyData = history;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Order created successfully',
      order,
      customer,
      shopOwner,
      history: historyData
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error', 
      details: error.message 
    }, { status: 500 });
  }
}
