'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserProfile } from './supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(user: User) {
    try {
      setIsLoading(true);
      console.log('Fetching profile for user:', user.id);

      // Try to get the profile directly from the database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile from database:', error);

        // Create a default profile if none exists
        const defaultProfile = {
          id: user.id,
          name: user.user_metadata?.name || 'User',
          email: user.email || '',
          role: user.user_metadata?.role || 'shop_owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Creating default profile:', defaultProfile);

        // Try to insert the profile
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert(defaultProfile);

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Default profile created successfully');
        }

        setProfile(defaultProfile as Profile);
      } else {
        console.log('Profile found in database:', profile);
        setProfile(profile as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);

      // Create a fallback profile
      const fallbackProfile = {
        id: user.id,
        name: user.user_metadata?.name || 'User',
        email: user.email || '',
        role: user.user_metadata?.role || 'shop_owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Using fallback profile due to error:', fallbackProfile);
      setProfile(fallbackProfile as Profile);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      console.log('Auth context: signIn called with email:', email);
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('Auth context: signIn error:', error.message);
        throw error;
      }

      console.log('Auth context: signIn successful, session:', data.session ? 'Session exists' : 'No session');
      if (data.user) {
        console.log('Auth context: user ID:', data.user.id);
      }
    } catch (error: any) {
      console.error('Auth context: signIn exception:', error.message);
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string, metadata: any) {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
