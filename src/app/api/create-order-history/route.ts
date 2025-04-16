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
    const { order_id, status, notes, updated_by } = body;
    
    if (!order_id || !status || !updated_by) {
      return NextResponse.json({ 
        success: false, 
        error: 'order_id, status, and updated_by are required' 
      }, { status: 400 });
    }
    
    // Create order history entry
    const timestamp = new Date().toISOString();
    
    const historyData = {
      order_id,
      status,
      notes: notes || 'Order status updated',
      created_at: timestamp,
      updated_by
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
      message: 'Order history created successfully',
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

export async function GET() {
  try {
    // Get all orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch orders', 
        details: ordersError 
      }, { status: 500 });
    }
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role')
      .limit(10);
    
    if (profilesError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch profiles', 
        details: profilesError 
      }, { status: 500 });
    }
    
    // Get all order history entries
    const { data: orderHistory, error: historyError } = await supabaseAdmin
      .from('order_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (historyError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch order history', 
        details: historyError 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      orders,
      profiles,
      orderHistory
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error', 
      details: error.message 
    }, { status: 500 });
  }
}
