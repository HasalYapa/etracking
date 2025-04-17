import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET driver availability status
export async function GET(request: Request) {
  try {
    // Get the authenticated user
    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can access this endpoint' }, { status: 403 });
    }

    // Get driver availability
    const { data: availability, error } = await supabase
      .from('driver_availability')
      .select('*')
      .eq('driver_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching driver availability:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no availability record exists, create one
    if (!availability) {
      const { data: newAvailability, error: insertError } = await supabase
        .from('driver_availability')
        .insert({
          driver_id: session.user.id,
          available: false,
          last_active: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating driver availability:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ data: newAvailability });
    }

    return NextResponse.json({ data: availability });
  } catch (error: any) {
    console.error('Unexpected error in driver availability GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update driver availability
export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can access this endpoint' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { available, latitude, longitude } = body;

    if (typeof available !== 'boolean') {
      return NextResponse.json({ error: 'Available status must be a boolean' }, { status: 400 });
    }

    // Update driver availability
    const updateData: any = {
      driver_id: session.user.id,
      available,
      last_active: new Date().toISOString()
    };

    // Add location data if provided
    if (latitude !== undefined && longitude !== undefined) {
      updateData.latitude = latitude;
      updateData.longitude = longitude;
    }

    const { data: updatedAvailability, error } = await supabase
      .from('driver_availability')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      console.error('Error updating driver availability:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: updatedAvailability,
      message: `Driver availability updated to ${available ? 'available' : 'unavailable'}`
    });
  } catch (error: any) {
    console.error('Unexpected error in driver availability POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
