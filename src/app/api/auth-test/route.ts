import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 });
    }
    
    // Sign in with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed', 
        details: authError 
      }, { status: 401 });
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get user profile', 
        details: profileError 
      }, { status: 500 });
    }
    
    // Create a test order history entry
    const timestamp = new Date().toISOString();
    
    // Create a test order first
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tracking_number: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        shop_id: authData.user.id,
        customer_id: authData.user.id, // Using user ID as customer ID for testing
        status: 'pending',
        delivery_address: 'Auth Test Delivery Address',
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
    
    // Create order history entry with the authenticated user ID
    const historyData = {
      order_id: order.id,
      status: 'pending',
      notes: 'Auth test order created',
      created_at: timestamp,
      updated_by: authData.user.id
    };
    
    console.log('Creating order history with authenticated user:', historyData);
    
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
        userId: authData.user.id,
        historyData
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Authentication test completed successfully',
      data: {
        user: authData.user,
        profile,
        order,
        history
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
