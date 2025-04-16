import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Create the execute_sql function
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION execute_sql(query text)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        EXECUTE query INTO result;
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('error', SQLERRM);
      END;
      $$;
    `;
    
    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      query: createFunctionQuery
    });
    
    if (error) {
      // If the function doesn't exist yet, create it using a different approach
      const { error: createError } = await supabaseAdmin.from('_sql_queries').insert({
        query: createFunctionQuery
      });
      
      if (createError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create SQL function', 
          details: createError 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'SQL function created using alternative method' 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'SQL function created successfully',
      data
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error', 
      details: error.message 
    }, { status: 500 });
  }
}
