import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for this API route
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    console.log('API: Attempting to sign in driver with email:', email);

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('API: Login error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    if (!data.user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get user profile to check role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('API: Error fetching profile:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Error verifying user role'
      }, { status: 500 });
    }

    if (profileData.role !== 'driver') {
      console.log(`API: User is not a driver (${profileData.role})`);
      return NextResponse.json({
        success: false,
        error: 'Access denied. This login is for drivers only.'
      }, { status: 403 });
    }

    // Return session data
    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user
    });
  } catch (error: any) {
    console.error('API: Unexpected error in driver-login:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
