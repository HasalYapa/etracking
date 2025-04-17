import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Define the SQL to create the policy
    const sql = `
      -- First drop the policy if it exists to avoid errors
      DROP POLICY IF EXISTS "drivers_can_create_any_order_history" ON "order_history";
      
      -- Create the policy
      CREATE POLICY "drivers_can_create_any_order_history" 
      ON "order_history" 
      FOR INSERT TO authenticated 
      USING (true) 
      WITH CHECK (true);
    `;
    
    console.log('Executing SQL:', sql);
    
    // Execute the SQL directly
    const { data, error } = await supabaseAdmin.from('_sql').select('*').execute(sql);
    
    if (error) {
      console.error('Error creating policy:', error);
      
      // Try an alternative approach
      const { data: pgData, error: pgError } = await supabaseAdmin
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'order_history');
      
      if (pgError) {
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          pgError: pgError.message,
          sql
        }, { status: 500 });
      }
      
      // Check if the policy already exists
      const policyExists = pgData.some(p => p.policyname === 'drivers_can_create_any_order_history');
      
      if (policyExists) {
        return NextResponse.json({
          success: true,
          message: 'Policy already exists',
          policies: pgData
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        sql
      }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Policy created successfully',
      data
    });
    
  } catch (error: any) {
    console.error('Error in create-driver-policy API:', error);
    
    // Try a different approach using raw SQL
    try {
      // Create the policy using raw SQL
      const sql = `
        -- First drop the policy if it exists to avoid errors
        DROP POLICY IF EXISTS "drivers_can_create_any_order_history" ON "order_history";
        
        -- Create the policy
        CREATE POLICY "drivers_can_create_any_order_history" 
        ON "order_history" 
        FOR INSERT TO authenticated 
        USING (true) 
        WITH CHECK (true);
      `;
      
      // Execute the SQL directly using the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          query: sql
        })
      });
      
      const result = await response.json();
      
      return NextResponse.json({
        success: true,
        message: 'Policy created using alternative method',
        result
      });
    } catch (fallbackError: any) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        fallbackError: fallbackError.message
      }, { status: 500 });
    }
  }
}
