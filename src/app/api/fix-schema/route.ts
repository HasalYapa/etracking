import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Create a Supabase client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // We'll use a direct SQL query instead of RPC since we might not have the function
    const { data: orderHistoryColumns, error: orderHistoryError } = await supabaseAdmin
      .from('order_history')
      .select('*')
      .limit(1);

    if (orderHistoryError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get order_history table',
        details: orderHistoryError
      }, { status: 500 });
    }

    // We don't need to check the schema structure, we'll just fix any null updated_by values

    // Get all order history entries
    const { data: orderHistory, error: fetchError } = await supabaseAdmin
      .from('order_history')
      .select('*');

    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch order history',
        details: fetchError
      }, { status: 500 });
    }

    // Find entries with null updated_by
    const entriesWithNullUpdatedBy = orderHistory?.filter(entry => entry.updated_by === null);

    // Get a valid user ID to use for fixing
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No users found to use for fixing',
        details: usersError
      }, { status: 500 });
    }

    const fixUserId = users[0].id;
    const fixResults = [];

    // Fix entries with null updated_by
    for (const entry of entriesWithNullUpdatedBy || []) {
      const { data, error } = await supabaseAdmin
        .from('order_history')
        .update({ updated_by: fixUserId })
        .eq('id', entry.id)
        .select()
        .single();

      fixResults.push({
        id: entry.id,
        success: !error,
        error: error ? error.message : null,
        data
      });
    }

    return NextResponse.json({
      success: true,
      fixResults: {
        entriesFixed: entriesWithNullUpdatedBy?.length || 0,
        details: fixResults
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fix schema',
      details: error.message
    }, { status: 500 });
  }
}
