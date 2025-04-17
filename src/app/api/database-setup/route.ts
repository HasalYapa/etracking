import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

export async function GET(request: Request) {
  try {
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the action from the URL
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    
    if (action === 'add-foreign-keys') {
      // Execute the SQL to add foreign keys
      // Note: In a real production environment, you would read the SQL file
      // but for this example, we'll use hardcoded SQL
      
      const sql = `
        -- Add foreign key from orders to profiles (shop_id)
        ALTER TABLE IF EXISTS orders 
        ADD CONSTRAINT IF NOT EXISTS fk_orders_shop 
        FOREIGN KEY (shop_id) 
        REFERENCES profiles(id);

        -- Add foreign key from orders to profiles (driver_id)
        ALTER TABLE IF EXISTS orders 
        ADD CONSTRAINT IF NOT EXISTS fk_orders_driver 
        FOREIGN KEY (driver_id) 
        REFERENCES profiles(id);

        -- Add foreign key from orders to customers
        ALTER TABLE IF EXISTS orders 
        ADD CONSTRAINT IF NOT EXISTS fk_orders_customer 
        FOREIGN KEY (customer_id) 
        REFERENCES customers(id);

        -- Add foreign key from order_history to orders
        ALTER TABLE IF EXISTS order_history 
        ADD CONSTRAINT IF NOT EXISTS fk_order_history_order 
        FOREIGN KEY (order_id) 
        REFERENCES orders(id);

        -- Add foreign key from order_history to profiles (updated_by)
        ALTER TABLE IF EXISTS order_history 
        ADD CONSTRAINT IF NOT EXISTS fk_order_history_profile 
        FOREIGN KEY (updated_by) 
        REFERENCES profiles(id);

        -- Add foreign key from customers to profiles (shop_id)
        ALTER TABLE IF EXISTS customers 
        ADD CONSTRAINT IF NOT EXISTS fk_customers_shop 
        FOREIGN KEY (shop_id) 
        REFERENCES profiles(id);
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        // If the exec_sql function doesn't exist, we'll need to create it
        if (error.message.includes('function "exec_sql" does not exist')) {
          // Create the exec_sql function
          const createFunctionSql = `
            CREATE OR REPLACE FUNCTION exec_sql(sql text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              EXECUTE sql;
            END;
            $$;
          `;
          
          const { error: createFunctionError } = await supabase.rpc('exec_sql', { sql: createFunctionSql });
          
          if (createFunctionError) {
            return NextResponse.json({
              success: false,
              error: 'Failed to create exec_sql function',
              details: createFunctionError
            }, { status: 500 });
          }
          
          // Try again with the original SQL
          const { error: retryError } = await supabase.rpc('exec_sql', { sql });
          
          if (retryError) {
            return NextResponse.json({
              success: false,
              error: 'Failed to add foreign keys',
              details: retryError
            }, { status: 500 });
          }
        } else {
          return NextResponse.json({
            success: false,
            error: 'Failed to add foreign keys',
            details: error
          }, { status: 500 });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Foreign keys added successfully'
      });
    } else if (action === 'test-relationships') {
      // Test the relationships by running a query that joins tables
      const { data: ordersWithCustomers, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customers:customers(*)
        `)
        .limit(5);
      
      const { data: ordersWithProfiles, error: profilesError } = await supabase
        .from('orders')
        .select(`
          *,
          shop:profiles!orders_shop_id_fkey(*),
          driver:profiles!orders_driver_id_fkey(*)
        `)
        .limit(5);
      
      return NextResponse.json({
        success: true,
        relationships: {
          ordersWithCustomers: {
            data: ordersWithCustomers,
            error: ordersError
          },
          ordersWithProfiles: {
            data: ordersWithProfiles,
            error: profilesError
          }
        }
      });
    } else {
      // Default action: return database status
      const { data: tables, error: tablesError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .not('tablename', 'like', 'pg_%');
      
      if (tablesError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to get tables',
          details: tablesError
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Database status',
        tables: tables.map((t: any) => t.tablename)
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in database-setup API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
