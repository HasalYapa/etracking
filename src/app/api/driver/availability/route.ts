import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET driver availability status
export async function GET(request: Request) {
  try {
    // Get the driver ID from the query parameters
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    // Get user profile to determine role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', driverId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (profile?.role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can access this endpoint' }, { status: 403 });
    }

    // Get driver availability
    const { data: availability, error } = await supabaseAdmin
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching driver availability:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no availability record exists, create one
    if (!availability) {
      const { data: newAvailability, error: insertError } = await supabaseAdmin
        .from('drivers')
        .upsert({
          id: driverId,
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
    // Parse request body
    const body = await request.json();
    const { driverId } = body;

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    // Get user profile to determine role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', driverId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (profile?.role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can access this endpoint' }, { status: 403 });
    }

    // Extract availability data from request body
    const { available, latitude, longitude } = body;

    if (typeof available !== 'boolean') {
      return NextResponse.json({ error: 'Available status must be a boolean' }, { status: 400 });
    }

    // No need for updateData object anymore as we're using inline update

    const { data: updatedAvailability, error } = await supabaseAdmin
      .from('drivers')
      .update({
        available,
        last_active: new Date().toISOString(),
        ...(latitude !== undefined && longitude !== undefined ? { latitude, longitude } : {})
      })
      .eq('id', driverId)
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
