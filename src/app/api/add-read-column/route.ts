import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Define the SQL to add the read column
    const sql = `
      -- Add the read column to the driver_notifications table if it doesn't exist
      ALTER TABLE IF EXISTS public.driver_notifications 
      ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false NOT NULL;
    `;
    
    console.log('Executing SQL to add read column to driver_notifications table');
    
    // Execute the SQL directly
    const { data, error: sqlError } = await supabaseAdmin.rpc('exec_sql', { sql });
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      return NextResponse.json({ 
        success: false, 
        error: sqlError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Read column added to driver_notifications table successfully',
      data
    });
    
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
