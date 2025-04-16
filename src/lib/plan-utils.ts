import { supabase } from './supabase';
import { Plan, PlanTier, plans } from '@/types';

export async function getUserPlan(userId: string): Promise<Plan> {
  try {
    // Get user profile with plan info
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_id')
      .eq('id', userId)
      .single();
    
    if (profile && profile.plan_id) {
      // Find the plan in our plans array
      const userPlan = plans.find(p => p.id === profile.plan_id as PlanTier);
      if (userPlan) return userPlan;
    }
    
    // Default to basic plan if no plan is set or plan not found
    return plans[0];
  } catch (error) {
    console.error('Error fetching user plan:', error);
    // Default to basic plan on error
    return plans[0];
  }
}

export async function canCreateOrder(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const userPlan = await getUserPlan(userId);
    
    // If unlimited orders
    if (userPlan.limits.orders === Infinity) {
      return { allowed: true };
    }
    
    // Count orders this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('shop_id', userId)
      .gte('created_at', firstDayOfMonth.toISOString());
    
    if ((count || 0) >= userPlan.limits.orders) {
      return { 
        allowed: false, 
        reason: `You've reached your monthly order limit (${userPlan.limits.orders}). Please upgrade your plan to create more orders.`
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Error checking order limit:', error);
    // Allow by default on error to prevent blocking legitimate users
    return { allowed: true };
  }
}

export async function canAddDriver(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const userPlan = await getUserPlan(userId);
    
    // Count current drivers
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('shop_id', userId)
      .eq('role', 'driver');
    
    if ((count || 0) >= userPlan.limits.drivers) {
      return { 
        allowed: false, 
        reason: `You've reached your driver limit (${userPlan.limits.drivers}). Please upgrade your plan to add more drivers.`
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Error checking driver limit:', error);
    // Allow by default on error to prevent blocking legitimate users
    return { allowed: true };
  }
}

export async function hasAnalyticsAccess(userId: string): Promise<boolean> {
  try {
    const userPlan = await getUserPlan(userId);
    return userPlan.limits.analytics;
  } catch (error) {
    console.error('Error checking analytics access:', error);
    return false;
  }
}
