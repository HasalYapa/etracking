import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get a sample order to check the schema
    const { data: sampleOrder, error: sampleError } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError) {
      console.error('Error fetching sample order:', sampleError);
      return NextResponse.json({ 
        success: false, 
        error: sampleError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      sampleOrderKeys: Object.keys(sampleOrder || {}),
      sampleOrder
    });
    
  } catch (error: any) {
    console.error('Error in check-orders-schema API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An unknown error occurred' 
    }, { status: 500 });
  }
}
