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
    const status = searchParams.get('status') || 'in_transit';
    
    console.log(`Testing order history creation for order ID: ${orderId}, driver ID: ${driverId}, status: ${status}`);
    
    // Create a history entry with explicit updated_by
    const historyData = {
      order_id: orderId,
      status,
      notes: `Test entry: Status updated to ${status}`,
      created_at: new Date().toISOString(),
      updated_by: driverId || '9155a1e2-84d0-44ec-8174-f27f8b9cc03e' // Ensure this is never null
    };
    
    console.log('History data:', historyData);
    
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
    console.error('Unexpected error in test-order-history API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
