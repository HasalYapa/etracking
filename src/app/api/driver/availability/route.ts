import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      return NextResponse.json({ error: 'Missing or invalid driverId' }, { status: 400 });
    }

    // Fetch driver's availability & location
    const { data, error } = await supabaseAdmin
      .from('drivers')
      .select('available, latitude, longitude, last_active')
      .eq('id', driverId)
      .single();

    if (error) {
      console.error('Error fetching driver availability:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
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
    const { driverId, available, latitude, longitude } = body;

    if (!driverId) {
      return NextResponse.json({ error: 'Missing or invalid driverId' }, { status: 400 });
    }

    if (typeof available !== 'boolean' || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid data (available, latitude, longitude)' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('drivers')
      .update({
        available,
        latitude,
        longitude,
        last_active: new Date().toISOString()
      })
      .eq('id', driverId);

    if (error) {
      console.error('Error updating driver availability:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Availability updated' });
  } catch (error: any) {
    console.error('Unexpected error in driver availability POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
