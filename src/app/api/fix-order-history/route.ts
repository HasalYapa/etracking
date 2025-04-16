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
    
    // Step 2: Get all orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, tracking_number')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (ordersError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch orders', 
        details: ordersError 
      }, { status: 500 });
    }
    
    // Step 3: For each order, check if it has order history entries
    const results = [];
    
    for (const order of orders) {
      // Check if order history exists
      const { data: history, error: historyError } = await supabaseAdmin
        .from('order_history')
        .select('*')
        .eq('order_id', order.id);
      
      if (historyError) {
        results.push({
          order_id: order.id,
          tracking_number: order.tracking_number,
          status: 'error',
          error: historyError.message
        });
        continue;
      }
      
      // If no history exists, create one
      if (!history || history.length === 0) {
        const timestamp = new Date().toISOString();
        
        const { data: newHistory, error: createError } = await supabaseAdmin
          .from('order_history')
          .insert({
            order_id: order.id,
            status: 'pending',
            notes: 'Automatically created by fix tool',
            created_at: timestamp,
            updated_by: shopOwner.id // Explicitly set this to a valid user ID
          })
          .select()
          .single();
        
        if (createError) {
          results.push({
            order_id: order.id,
            tracking_number: order.tracking_number,
            status: 'error',
            error: createError.message
          });
        } else {
          results.push({
            order_id: order.id,
            tracking_number: order.tracking_number,
            status: 'created',
            history: newHistory
          });
        }
      } else {
        // Check if any history entries have null updated_by
        const entriesWithNullUpdatedBy = history.filter(h => h.updated_by === null);
        
        if (entriesWithNullUpdatedBy.length > 0) {
          const fixResults = [];
          
          for (const entry of entriesWithNullUpdatedBy) {
            const { data: fixed, error: fixError } = await supabaseAdmin
              .from('order_history')
              .update({ updated_by: shopOwner.id })
              .eq('id', entry.id)
              .select()
              .single();
            
            fixResults.push({
              history_id: entry.id,
              status: fixError ? 'error' : 'fixed',
              error: fixError ? fixError.message : null,
              data: fixed
            });
          }
          
          results.push({
            order_id: order.id,
            tracking_number: order.tracking_number,
            status: 'fixed',
            count: entriesWithNullUpdatedBy.length,
            details: fixResults
          });
        } else {
          results.push({
            order_id: order.id,
            tracking_number: order.tracking_number,
            status: 'ok',
            count: history.length
          });
        }
      }
    }
    
    // Step 4: Create a test order with proper order history
    const timestamp = new Date().toISOString();
    const trackingNumber = `FIX-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Get or create a customer
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Fixed order history entries but failed to create test order',
        error: 'Failed to fetch customers',
        details: customersError,
        results,
        shopOwner
      });
    }
    
    if (!customers || customers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Fixed order history entries but failed to create test order',
        error: 'No customers found',
        results,
        shopOwner
      });
    }
    
    const customer = customers[0];
    
    // Create a test order
    const { data: testOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tracking_number: trackingNumber,
        shop_id: shopOwner.id,
        customer_id: customer.id,
        status: 'pending',
        delivery_address: 'Fix Tool Test Address',
        delivery_notes: 'Created by fix tool',
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();
    
    if (orderError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Fixed order history entries but failed to create test order',
        error: orderError.message,
        results,
        shopOwner
      });
    }
    
    // Create order history for the test order
    const { data: testHistory, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert({
        order_id: testOrder.id,
        status: 'pending',
        notes: 'Created by fix tool',
        created_at: timestamp,
        updated_by: shopOwner.id // Explicitly set this to a valid user ID
      })
      .select()
      .single();
    
    if (historyError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Fixed order history entries but failed to create test order history',
        error: historyError.message,
        results,
        shopOwner,
        testOrder
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fixed order history entries and created test order',
      results,
      shopOwner,
      testOrder,
      testHistory
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error', 
      details: error.message 
    }, { status: 500 });
  }
}
