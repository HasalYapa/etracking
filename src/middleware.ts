import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  console.log('Middleware running for path:', request.nextUrl.pathname);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    console.log('Supabase client created');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session retrieved:', session ? 'Session exists' : 'No session');

    if (session) {
      console.log('User ID:', session.user.id);
    }

    // Auth routes - redirect to dashboard if already logged in
    if (request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname.startsWith('/shop-login') ||
        request.nextUrl.pathname.startsWith('/driver-login') ||
        request.nextUrl.pathname.startsWith('/admin-login')) {
      console.log('Auth route detected:', request.nextUrl.pathname);
      if (session) {
        try {
          // Get user profile to determine which dashboard to redirect to
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          console.log('Profile query result:', profile ? 'Profile found' : 'No profile', error ? `Error: ${error.message}` : 'No error');

          if (error) {
            console.error('Error fetching profile:', error);
            // Use user metadata as fallback
            const role = session.user.user_metadata?.role || 'shop_owner';
            console.log('Using role from metadata:', role);

            if (role === 'admin') {
              return NextResponse.redirect(new URL('/admin', request.url));
            } else if (role === 'driver') {
              return NextResponse.redirect(new URL('/driver', request.url));
            } else {
              return NextResponse.redirect(new URL('/dashboard', request.url));
            }
          }

          if (profile) {
            console.log('User role from profile:', profile.role);
            if (profile.role === 'shop_owner') {
              console.log('Middleware: Redirecting shop owner to minimal-shop');
              return NextResponse.redirect(new URL('/minimal-shop', request.url));
            } else if (profile.role === 'driver') {
              console.log('Middleware: Redirecting driver to minimal-driver');
              return NextResponse.redirect(new URL('/minimal-driver', request.url));
            } else if (profile.role === 'admin') {
              console.log('Middleware: Redirecting admin to admin dashboard');
              return NextResponse.redirect(new URL('/admin', request.url));
            }
          }
        } catch (err) {
          console.error('Error in auth routes middleware:', err);
        }

        // Default fallback
        console.log('Middleware: Using default fallback redirection to minimal-shop');
        return NextResponse.redirect(new URL('/minimal-shop', request.url));
      }
    }

    // Protected routes - redirect to login if not logged in
    if (request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/driver') ||
        request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/map-assignment') ||
        request.nextUrl.pathname.startsWith('/minimal-shop') ||
        request.nextUrl.pathname.startsWith('/minimal-driver')) {
      // Skip login, signup, and public pages to avoid redirect loops
      if (request.nextUrl.pathname.includes('login') ||
          request.nextUrl.pathname.includes('signup') ||
          request.nextUrl.pathname === '/' ||
          request.nextUrl.pathname.includes('about') ||
          request.nextUrl.pathname.includes('contact')) {
        console.log('Public page detected, skipping auth check');
        return response;
      }

      if (!session) {
        console.log('No session found, redirecting to appropriate login page');

        // Determine which login page to redirect to based on the requested path
        if (request.nextUrl.pathname.includes('driver')) {
          return NextResponse.redirect(new URL('/driver-login', request.url));
        } else if (request.nextUrl.pathname.includes('admin')) {
          return NextResponse.redirect(new URL('/admin-login', request.url));
        } else {
          return NextResponse.redirect(new URL('/shop-login', request.url));
        }
      }

      try {
        // Check if user has the correct role for the route
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        console.log('Protected route profile query:', profile ? 'Profile found' : 'No profile', error ? `Error: ${error.message}` : 'No error');

        let userRole = 'shop_owner'; // Default role

        if (error) {
          console.error('Error fetching profile for protected route:', error);
          // Use user metadata as fallback
          userRole = session.user.user_metadata?.role || 'shop_owner';
          console.log('Using role from metadata for protected route:', userRole);
        } else if (profile) {
          userRole = profile.role;
          console.log('Using role from profile for protected route:', userRole);
        }

        // Route access logic based on role
        if ((request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/minimal-shop')) && userRole !== 'shop_owner') {
          if (userRole === 'driver') {
            return NextResponse.redirect(new URL('/minimal-driver', request.url));
          } else if (userRole === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
          }
        }

        if ((request.nextUrl.pathname.startsWith('/driver') || request.nextUrl.pathname.startsWith('/minimal-driver')) && userRole !== 'driver') {
          if (userRole === 'shop_owner') {
            return NextResponse.redirect(new URL('/minimal-shop', request.url));
          } else if (userRole === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
          }
        }

        if (request.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
          if (userRole === 'shop_owner') {
            return NextResponse.redirect(new URL('/minimal-shop', request.url));
          } else if (userRole === 'driver') {
            return NextResponse.redirect(new URL('/minimal-driver', request.url));
          }
        }
      } catch (err) {
        console.error('Error in protected routes middleware:', err);
      }
    }
  } catch (err) {
    console.error('Error in middleware:', err);
  }

  return response;
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/shop-login',
    '/driver-login',
    '/admin-login',
    '/dashboard/:path*',
    '/driver/:path*',
    '/admin/:path*',
    '/map-assignment/:path*',
    '/minimal-shop/:path*',
    '/minimal-driver/:path*',
  ],
};
