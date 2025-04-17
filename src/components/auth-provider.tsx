'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-singleton';

// Define the context type
type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  signOut: async () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Function to fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
          setIsLoading(false);
          return;
        }
        
        if (session) {
          console.log('AuthProvider: Session found');
          setSession(session);
          setUser(session.user);
          
          // Fetch user profile
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          console.log('AuthProvider: No session found');
        }
      } catch (err: any) {
        console.error('Error in initializeAuth:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event);
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Fetch user profile
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      router.push('/');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Context value
  const value = {
    session,
    user,
    profile,
    isLoading,
    error,
    signOut,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
