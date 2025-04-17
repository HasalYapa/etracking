import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

// Create a single supabase client for the browser
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-slujerwtublzuxtzdtyw-auth-token',
  },
});

// Helper function to get user profile
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

// Helper function to get orders for a shop owner
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

// Helper function to get orders for a driver
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

// Helper function to get a single order with all related data
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
