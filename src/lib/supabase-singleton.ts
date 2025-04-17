import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Supabase client configuration
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

// Global variable to store the client instance
let supabaseInstance: SupabaseClient | null = null;

// Function to get the Supabase client (creates it only once)
export function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side - create a new instance each time
    // This prevents issues with server-side rendering
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // Client-side - use singleton pattern
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create a new instance if one doesn't exist
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-slujerwtublzuxtzdtyw-auth-token',
    },
  });

  return supabaseInstance;
}

// Export a singleton instance for client-side use
export const supabase = getSupabaseClient();

// Helper functions
export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function getShopOrders(userId: string) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers(*),
      drivers(*)
    `)
    .eq('shop_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return orders;
}

export async function getDriverOrders(driverId: string) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers(*),
      shops:profiles(*)
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return orders;
}

export async function getOrderDetails(orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers(*),
      drivers(*),
      shops:profiles(*)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return order;
}
