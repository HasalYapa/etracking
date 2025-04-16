import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Step 1: Get a valid user ID to use for fixing
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role')
      .limit(10);
    
    if (profilesError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch profiles', 
        details: profilesError 
      }, { status: 500 });
    }
    
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No profiles found in the database' 
      }, { status: 500 });
    }
    
    // Find a shop owner or use the first profile
    const shopOwner = profiles.find(p => p.role === 'shop_owner') || profiles[0];
    
    if (!shopOwner || !shopOwner.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid user ID found for fixing', 
        profiles 
      }, { status: 500 });
    }
    
    // Step 2: Create a test order directly in the database
    const timestamp = new Date().toISOString();
    const trackingNumber = `DIRECT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Get a valid customer ID
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .limit(1);
    
    if (customersError || !customers || customers.length === 0) {
      // Create a customer if none exists
      const { data: newCustomer, error: newCustomerError } = await supabaseAdmin
        .from('customers')
        .insert({
          name: 'Direct Fix Test Customer',
          phone: '+94760061600',
          email: 'direct-fix@example.com',
          address: 'Direct Fix Test Address',
          shop_id: shopOwner.id,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();
      
      if (newCustomerError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create customer', 
          details: newCustomerError 
        }, { status: 500 });
      }
      
      var customerId = newCustomer.id;
    } else {
      var customerId = customers[0].id;
    }
    
    // Create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tracking_number: trackingNumber,
        shop_id: shopOwner.id,
        customer_id: customerId,
        status: 'pending',
        delivery_address: 'Direct Fix Test Address',
        delivery_notes: 'Created by direct fix tool',
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
    
    // Step 3: Create order history with direct SQL
    // This is the most direct approach possible
    
    // First, try with the JavaScript SDK
    const { data: history, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert({
        order_id: order.id,
        status: 'pending',
        notes: 'Created by direct fix tool',
        created_at: timestamp,
        updated_by: shopOwner.id
      })
      .select()
      .single();
    
    if (historyError) {
      // If that fails, try a more direct approach
      // Use the REST API directly
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
          notes: 'Created by direct REST API call',
          created_at: timestamp,
          updated_by: shopOwner.id
        })
      });
      
      if (!response.ok) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create order history using both methods', 
          sdkError: historyError,
          restError: await response.text()
        }, { status: 500 });
      }
      
      var historyData = await response.json();
    } else {
      var historyData = history;
    }
    
    // Step 4: Verify the order history was created
    const { data: verifyHistory, error: verifyError } = await supabaseAdmin
      .from('order_history')
      .select('*')
      .eq('order_id', order.id);
    
    if (verifyError || !verifyHistory || verifyHistory.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to verify order history creation', 
        details: verifyError 
      }, { status: 500 });
    }
    
    // Step 5: Create a direct database connection to fix any existing issues
    // Get all orders without history
    const { data: ordersWithoutHistory, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, tracking_number')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Created test order but failed to check for orders without history',
        error: ordersError.message,
        order,
        historyData,
        verifyHistory
      });
    }
    
    const fixResults = [];
    
    for (const orderItem of ordersWithoutHistory || []) {
      // Check if order has history
      const { data: existingHistory, error: existingHistoryError } = await supabaseAdmin
        .from('order_history')
        .select('*')
        .eq('order_id', orderItem.id);
      
      if (existingHistoryError) {
        fixResults.push({
          order_id: orderItem.id,
          status: 'error',
          error: existingHistoryError.message
        });
        continue;
      }
      
      if (!existingHistory || existingHistory.length === 0) {
        // Create history for this order
        const { data: fixedHistory, error: fixedHistoryError } = await supabaseAdmin
          .from('order_history')
          .insert({
            order_id: orderItem.id,
            status: 'pending',
            notes: 'Automatically created by direct fix tool',
            created_at: timestamp,
            updated_by: shopOwner.id
          })
          .select()
          .single();
        
        if (fixedHistoryError) {
          fixResults.push({
            order_id: orderItem.id,
            status: 'error',
            error: fixedHistoryError.message
          });
        } else {
          fixResults.push({
            order_id: orderItem.id,
            status: 'fixed',
            history: fixedHistory
          });
        }
      } else {
        fixResults.push({
          order_id: orderItem.id,
          status: 'ok',
          count: existingHistory.length
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Direct fix completed successfully',
      shopOwner,
      order,
      historyData,
      verifyHistory,
      fixResults
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error', 
      details: error.message 
    }, { status: 500 });
  }
}
