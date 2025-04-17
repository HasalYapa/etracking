import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Get the table name from the URL or use default list
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');
    const tables = tableName ? [tableName] : ['profiles', 'customers', 'orders', 'order_history'];
    const results: Record<string, any> = {};

    for (const table of tables) {
      // Check if table exists by trying to select a single row
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);

      // Get column information
      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', table)
        .order('ordinal_position', { ascending: true });

      // Check RLS policies for the table
      const { data: policies, error: policiesError } = await supabaseAdmin
        .rpc('get_policies_for_table', { table_name: table });

      results[table] = {
        exists: !error,
        error: error ? error.message : null,
        sample: data,
        columns: columns || [],
        columnsError: columnsError ? columnsError.message : null,
        policies: policies || [],
        policiesError: policiesError ? policiesError.message : null
      };
    }

    // Check for any existing data in the tables
    const counts: Record<string, any> = {};

    for (const table of tables) {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      counts[table] = {
        count,
        error: error ? error.message : null
      };
    }

    return NextResponse.json({
      success: true,
      tables: results,
      counts
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check schema',
      details: error.message
    }, { status: 500 });
  }
}
