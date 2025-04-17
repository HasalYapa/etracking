import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Define the SQL to create the table
    const sql = `
      -- Create the drivers table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.drivers (
          id UUID PRIMARY KEY REFERENCES public.profiles(id),
          available BOOLEAN NOT NULL DEFAULT false,
          last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- Add RLS policies
      ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

      -- Policy to allow drivers to view their own availability
      DROP POLICY IF EXISTS "Drivers can view their own availability" ON public.drivers;
      CREATE POLICY "Drivers can view their own availability"
      ON public.drivers
      FOR SELECT
      USING (auth.uid() = id);

      -- Policy to allow drivers to update their own availability
      DROP POLICY IF EXISTS "Drivers can update their own availability" ON public.drivers;
      CREATE POLICY "Drivers can update their own availability"
      ON public.drivers
      FOR UPDATE
      USING (auth.uid() = id);

      -- Policy to allow drivers to insert their own availability
      DROP POLICY IF EXISTS "Drivers can insert their own availability" ON public.drivers;
      CREATE POLICY "Drivers can insert their own availability"
      ON public.drivers
      FOR INSERT
      WITH CHECK (auth.uid() = id);

      -- Policy to allow shop owners to view driver availability
      DROP POLICY IF EXISTS "Shop owners can view driver availability" ON public.drivers;
      CREATE POLICY "Shop owners can view driver availability"
      ON public.drivers
      FOR SELECT
      USING (
          EXISTS (
              SELECT 1 FROM public.profiles
              WHERE id = auth.uid() AND role = 'shop_owner'
          )
      );

      -- Policy to allow admins to view and manage all driver availability
      DROP POLICY IF EXISTS "Admins can manage all driver availability" ON public.drivers;
      CREATE POLICY "Admins can manage all driver availability"
      ON public.drivers
      USING (
          EXISTS (
              SELECT 1 FROM public.profiles
              WHERE id = auth.uid() AND role = 'admin'
          )
      );
      
      -- Insert driver records for existing driver profiles if they don't exist
      INSERT INTO public.drivers (id)
      SELECT id FROM public.profiles
      WHERE role = 'driver'
      AND NOT EXISTS (
        SELECT 1 FROM public.drivers WHERE drivers.id = profiles.id
      );
    `;
    
    console.log('Executing SQL to create drivers table');
    
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
      message: 'Drivers table created successfully',
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
