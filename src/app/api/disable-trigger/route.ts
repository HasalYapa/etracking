import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Get parameters from the URL
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table') || 'orders';
    const triggerName = searchParams.get('trigger') || 'create_order_history_trigger';
    const action = searchParams.get('action') || 'disable'; // 'disable' or 'enable'
    
    // Validate parameters
    if (!tableName || !triggerName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Table name and trigger name are required' 
      }, { status: 400 });
    }
    
    // Execute the SQL to disable/enable the trigger
    const sql = `ALTER TABLE ${tableName} ${action === 'enable' ? 'ENABLE' : 'DISABLE'} TRIGGER ${triggerName}`;
    
    console.log(`Executing SQL: ${sql}`);
    
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error ${action}ing trigger:`, error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        sql
      }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: `Trigger ${triggerName} on table ${tableName} has been ${action === 'enable' ? 'enabled' : 'disabled'}`,
      sql,
      result: data
    });
    
  } catch (error: any) {
    console.error(`Error in disable-trigger API:`, error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
