import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ 
        status: 'No active session',
        cookies: cookies().getAll().map(c => ({ name: c.name, value: '***' }))
      });
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Error getting profile:', profileError);
    }
    
    return NextResponse.json({
      status: 'Session found',
      user: {
        id: session.user.id,
        email: session.user.email,
        role: profile?.role || session.user.user_metadata?.role || 'unknown'
      },
      cookies: cookies().getAll().map(c => ({ name: c.name, value: '***' }))
    });
  } catch (err: any) {
    console.error('Unexpected error in debug-session API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
