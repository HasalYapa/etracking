// IMPORTANT: This file is now a redirect to supabase-singleton.ts
// This prevents multiple Supabase client instances from being created

// Import and re-export the singleton Supabase client
import { supabase, getUserProfile, getShopOrders, getDriverOrders, getOrderDetails } from './supabase-singleton';

// Re-export everything from the singleton
export { supabase, getUserProfile, getShopOrders, getDriverOrders, getOrderDetails };
