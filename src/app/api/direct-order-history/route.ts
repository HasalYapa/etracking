import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log('Received direct order history request:', body);
    
    const { orderId, status, driverId, latitude, longitude } = body;
    
    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }
    
    // Create a history entry with explicit updated_by
    // IMPORTANT: updated_by is a required field in the order_history table
    const historyData = {
      order_id: orderId,
      status: status || 'in_transit',
      notes: `Direct test: Status updated to ${status || 'in_transit'}`,
      created_at: new Date().toISOString(),
      // Triple-check that updated_by is never null
      updated_by: driverId || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e', // Default driver ID
      latitude: latitude || null,
      longitude: longitude || null
    };
    
    console.log('History data to insert:', historyData);
    
    // Double-check that updated_by is not null
    if (!historyData.updated_by) {
      console.error('updated_by is still null after assignment, using hardcoded default');
      historyData.updated_by = '9155a1e2-84d0-44ec-8174-f27f8b9cc03e'; // Hardcoded default driver ID
    }
    
    // Insert the history entry
    const { data: historyResult, error: historyError } = await supabaseAdmin
      .from('order_history')
      .insert(historyData)
      .select();
    
    console.log('History creation result:', { historyResult, historyError });
    
    if (historyError) {
      console.error('Error creating order history:', historyError);
      return NextResponse.json({ 
        success: false, 
        error: historyError.message,
        historyData
      }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      historyResult,
      historyData
    });
    
  } catch (error: any) {
    console.error('Unexpected error in direct-order-history API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
