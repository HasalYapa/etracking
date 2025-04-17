import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

export async function GET(request: Request) {
  try {
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the get_tables function
    const createGetTablesFunction = `
      CREATE OR REPLACE FUNCTION get_tables()
      RETURNS TABLE (table_name text)
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT t.table_name::text
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_name NOT LIKE 'pg_%';
      END;
      $$;
    `;

    // Create the create_get_tables_function function
    const createFunctionCreator = `
      CREATE OR REPLACE FUNCTION create_get_tables_function()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE '
          CREATE OR REPLACE FUNCTION get_tables()
          RETURNS TABLE (table_name text)
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $func$
          BEGIN
            RETURN QUERY
            SELECT t.table_name::text
            FROM information_schema.tables t
            WHERE t.table_schema = ''public''
            AND t.table_name NOT LIKE ''pg_%'';
          END;
          $func$;
        ';
      END;
      $$;
    `;

    // Execute the SQL to create the functions
    const { error: createError } = await supabase.rpc('create_get_tables_function');
    
    if (createError) {
      // If the function doesn't exist, create it using raw SQL
      const { error: sqlError } = await supabase.rpc('create_get_tables_function');
      
      if (sqlError) {
        console.error('Error creating function:', sqlError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create functions',
          details: sqlError
        }, { status: 500 });
      }
    }

    // Test the get_tables function
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
    
    if (tablesError) {
      console.error('Error testing get_tables function:', tablesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to test get_tables function',
        details: tablesError
      }, { status: 500 });
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Analyzer setup complete',
      tables
    });

  } catch (error: any) {
    console.error('Unexpected error in setup-analyzer API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
