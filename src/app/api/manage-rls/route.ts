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
    const { action, table, policyName, policyDefinition } = body;
    
    // Validate parameters
    if (!action || !table) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action and table are required' 
      }, { status: 400 });
    }
    
    let sql = '';
    let result = null;
    
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
    
    // First create the function if needed
    await supabaseAdmin.rpc('execute_sql', { sql_query: createFunctionSql }).catch(() => {
      // Ignore errors, the function might already exist
    });
    
    // Perform the requested action
    switch (action) {
      case 'create_policy':
        if (!policyName || !policyDefinition) {
          return NextResponse.json({ 
            success: false, 
            error: 'Policy name and definition are required for create_policy action' 
          }, { status: 400 });
        }
        
        sql = `CREATE POLICY "${policyName}" ON "${table}" ${policyDefinition}`;
        console.log(`Creating policy: ${sql}`);
        
        result = await supabaseAdmin.rpc('execute_sql', { sql_query: sql });
        break;
        
      case 'drop_policy':
        if (!policyName) {
          return NextResponse.json({ 
            success: false, 
            error: 'Policy name is required for drop_policy action' 
          }, { status: 400 });
        }
        
        sql = `DROP POLICY IF EXISTS "${policyName}" ON "${table}"`;
        console.log(`Dropping policy: ${sql}`);
        
        result = await supabaseAdmin.rpc('execute_sql', { sql_query: sql });
        break;
        
      case 'list_policies':
        sql = `
          SELECT 
            schemaname, 
            tablename, 
            policyname, 
            permissive, 
            roles, 
            cmd, 
            qual, 
            with_check
          FROM 
            pg_policies 
          WHERE 
            tablename = '${table}'
        `;
        console.log(`Listing policies: ${sql}`);
        
        const { data, error } = await supabaseAdmin.from('pg_policies').select('*').eq('tablename', table);
        
        if (error) {
          return NextResponse.json({ 
            success: false, 
            error: error.message,
            sql
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          policies: data
        });
        
      default:
        return NextResponse.json({ 
          success: false, 
          error: `Unknown action: ${action}` 
        }, { status: 400 });
    }
    
    if (result && result.error) {
      console.error(`Error executing SQL: ${result.error}`);
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        sql
      }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      action,
      table,
      policyName,
      sql,
      result
    });
    
  } catch (error: any) {
    console.error('Error in manage-rls API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
