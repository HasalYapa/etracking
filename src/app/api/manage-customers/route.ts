import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Get all customers
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (customersError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch customers', 
        details: customersError 
      }, { status: 500 });
    }
    
    // Get all shop owners
    const { data: shopOwners, error: shopOwnersError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'shop_owner');
    
    if (shopOwnersError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch shop owners', 
        details: shopOwnersError 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      customers,
      shopOwners
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, address, shop_id } = body;
    
    if (!name || !phone || !shop_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, phone, and shop_id are required' 
      }, { status: 400 });
    }
    
    // Check if customer already exists
    const { data: existingCustomers, error: checkError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .eq('shop_id', shop_id);
    
    if (checkError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check for existing customer', 
        details: checkError 
      }, { status: 500 });
    }
    
    if (existingCustomers && existingCustomers.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Customer with this phone number already exists for this shop', 
        existingCustomer: existingCustomers[0]
      }, { status: 409 });
    }
    
    // Create new customer
    const timestamp = new Date().toISOString();
    
    const { data: newCustomer, error: createError } = await supabaseAdmin
      .from('customers')
      .insert({
        name,
        phone,
        email: email || null,
        address: address || null,
        shop_id,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();
    
    if (createError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create customer', 
        details: createError 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      customer: newCustomer
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message
    }, { status: 500 });
  }
}
