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
    const { sql } = body;
    
    // Validate parameters
    if (!sql) {
      return NextResponse.json({ 
        success: false, 
        error: 'SQL query is required' 
      }, { status: 400 });
    }
    
    // Create the execute_sql function if it doesn't exist
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result jsonb;
      BEGIN
        EXECUTE sql_query;
        result := '{"status": "success"}'::jsonb;
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object(
          'status', 'error',
          'message', SQLERRM,
          'detail', SQLSTATE
        );
        RETURN result;
      END;
      $$;
    `;
    
    // First create the function
    await supabaseAdmin.rpc('execute_sql', { sql_query: createFunctionSql }).catch(() => {
      // Ignore errors, the function might already exist
    });
    
    // Execute the SQL
    console.log(`Executing SQL: ${sql}`);
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        sql
      }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      result: data,
      sql
    });
    
  } catch (error: any) {
    console.error('Error in execute-sql API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
