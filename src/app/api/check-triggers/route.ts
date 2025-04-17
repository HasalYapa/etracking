import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Get the table name from the URL
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table') || 'orders';
    
    // Get all triggers for the table
    const { data: triggers, error: triggersError } = await supabaseAdmin
      .rpc('get_triggers_for_table', { table_name: tableName });
    
    if (triggersError) {
      console.error('Error getting triggers:', triggersError);
      
      // Try a direct SQL query as fallback
      const { data: sqlTriggers, error: sqlError } = await supabaseAdmin
        .from('pg_trigger')
        .select('*')
        .eq('tgrelid', tableName);
      
      if (sqlError) {
        return NextResponse.json({ 
          success: false, 
          error: triggersError.message,
          sqlError: sqlError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        table: tableName,
        triggers: sqlTriggers || [],
        method: 'sql_fallback'
      });
    }
    
    // Get the trigger function definitions
    const triggerFunctions: any[] = [];
    
    if (triggers && triggers.length > 0) {
      for (const trigger of triggers) {
        if (trigger.trigger_function) {
          const { data: functionDef, error: functionError } = await supabaseAdmin
            .rpc('get_function_definition', { function_name: trigger.trigger_function });
          
          if (!functionError) {
            triggerFunctions.push({
              name: trigger.trigger_function,
              definition: functionDef
            });
          }
        }
      }
    }
    
    // Return the trigger information
    return NextResponse.json({
      success: true,
      table: tableName,
      triggers: triggers || [],
      triggerFunctions,
      method: 'rpc'
    });
    
  } catch (error: any) {
    console.error('Error in check-triggers API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
