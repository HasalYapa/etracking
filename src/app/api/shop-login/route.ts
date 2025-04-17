import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get credentials from request body
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('API login error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    if (!data.user) {
      return NextResponse.json(
        { error: 'No user returned from authentication' },
        { status: 401 }
      );
    }
    
    // Verify that the user has the correct role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, name, email')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Error verifying user role' },
        { status: 500 }
      );
    }
    
    if (profile.role !== 'shop_owner') {
      // Sign out if not a shop owner
      await supabase.auth.signOut();
      
      return NextResponse.json(
        { error: 'Access denied. This login is for shop owners only.' },
        { status: 403 }
      );
    }
    
    // Return success with session and user data
    return NextResponse.json({
      success: true,
      message: `Login successful! Welcome, ${profile.name}`,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile.name,
        role: profile.role
      }
    });
  } catch (err: any) {
    console.error('Unexpected error in shop login API:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
