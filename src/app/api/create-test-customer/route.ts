import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Get all profiles to find a shop owner
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
    
    // Find a shop owner
    const shopOwner = profiles.find(p => p.role === 'shop_owner');
    
    if (!shopOwner) {
      return NextResponse.json({ 
        success: false, 
        error: 'No shop owner found in profiles', 
        profiles 
      }, { status: 500 });
    }
    
    // Create a test customer
    const timestamp = new Date().toISOString();
    const customerName = `Test Customer ${Date.now()}`;
    
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        name: customerName,
        phone: `+94${Math.floor(700000000 + Math.random() * 99999999)}`,
        email: `test-${Date.now()}@example.com`,
        address: 'Test Address, Colombo',
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
    
    // Get all customers to verify
    const { data: allCustomers, error: allCustomersError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allCustomersError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch all customers', 
        details: allCustomersError 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test customer created successfully',
      customer,
      shopOwner,
      allCustomers: allCustomers.slice(0, 10) // Show only the first 10 customers
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error', 
      details: error.message 
    }, { status: 500 });
  }
}
