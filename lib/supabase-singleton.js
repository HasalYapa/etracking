import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

// Create a single Supabase client for the entire application
// This prevents the "Multiple GoTrueClient instances" warning
let supabaseInstance = null;

// For both client and server components
export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;

  // Create a new instance if one doesn't exist
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'sb-slujerwtublzuxtzdtyw-auth-token',
    },
  });

  return supabaseInstance;
})();

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

export async function getShopOrders(userId) {
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

export async function getDriverOrders(driverId) {
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

export async function getOrderDetails(orderId) {
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
