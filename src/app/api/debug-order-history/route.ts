import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Get parameters from the URL
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || '22908b36-5e52-439c-80bc-18eb084e93c6'; // Default to a known order ID
    const driverId = searchParams.get('driverId') || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e'; // Default to a known driver ID
    
    // Step 1: Get the order_history table structure
    console.log('Getting order_history table structure...');
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('debug_table_info', { table_name: 'order_history' });
    
    if (tableError) {
      console.error('Error getting table info:', tableError);
      return NextResponse.json({ 
        success: false, 
        error: tableError.message,
        step: 'table_info'
      }, { status: 500 });
    }
    
    // Step 2: Check for triggers on the orders table
    console.log('Checking for triggers on the orders table...');
    const { data: triggerInfo, error: triggerError } = await supabaseAdmin
      .rpc('debug_triggers_info', { table_name: 'orders' });
    
    if (triggerError) {
      console.error('Error getting trigger info:', triggerError);
      return NextResponse.json({ 
        success: false, 
        error: triggerError.message,
        step: 'trigger_info'
      }, { status: 500 });
    }
    
    // Step 3: Try to directly insert into order_history
    console.log('Trying to directly insert into order_history...');
    const historyData = {
      order_id: orderId,
      status: 'in_transit',
      notes: 'Debug test entry',
      updated_by: driverId,
      created_at: new Date().toISOString()
    };
    
    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('order_history')
      .insert(historyData)
      .select();
    
    // Step 4: Try to update an order and see what happens
    console.log('Trying to update an order...');
    const updateData = {
      status: 'in_transit',
      driver_id: driverId,
      updated_at: new Date().toISOString()
    };
    
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    // Return all the debug information
    return NextResponse.json({
      success: true,
      tableInfo,
      triggerInfo,
      insertResult,
      insertError: insertError ? insertError.message : null,
      updateResult,
      updateError: updateError ? updateError.message : null,
      historyData,
      updateData
    });
    
  } catch (error: any) {
    console.error('Unexpected error in debug-order-history API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      step: 'unexpected_error'
    }, { status: 500 });
  }
}
