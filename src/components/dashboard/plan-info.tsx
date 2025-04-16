'use client';

import { useState, useEffect } from 'react';
import { Plan, PlanTier, plans } from '../../types';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function PlanInfo() {
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState({
    ordersThisMonth: 0,
    driversCount: 0
  });

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Get user profile with plan info
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', user.id)
          .single();

        if (profile && profile.plan_id) {
          // Find the plan in our plans array
          const userPlan = plans.find(p => p.id === profile.plan_id as PlanTier) || plans[0];
          setCurrentPlan(userPlan);

          // Get usage statistics
          const now = new Date();
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          // Count orders this month
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('id', { count: 'exact' })
            .eq('shop_id', user.id)
            .gte('created_at', firstDayOfMonth.toISOString());

          // Count drivers
          const { count: driversCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('shop_id', user.id)
            .eq('role', 'driver');

          setUsageStats({
            ordersThisMonth: ordersCount || 0,
            driversCount: driversCount || 0
          });
        } else {
          // Default to basic plan if no plan is set
          setCurrentPlan(plans[0]);
        }
      } catch (error) {
        console.error('Error fetching plan info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!currentPlan) return null;

  const orderLimit = currentPlan.limits.orders;
  const driverLimit = currentPlan.limits.drivers;
  const orderPercentage = orderLimit === Infinity ? 0 : Math.min(100, Math.round((usageStats.ordersThisMonth / orderLimit) * 100));
  const driverPercentage = Math.min(100, Math.round((usageStats.driversCount / driverLimit) * 100));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Plan: {currentPlan.name}</h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0
          }).format(currentPlan.price)}/mo
        </span>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Orders this month</span>
            <span className="font-medium">
              {usageStats.ordersThisMonth} / {orderLimit === Infinity ? '∞' : orderLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${orderPercentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${orderPercentage}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Drivers</span>
            <span className="font-medium">
              {usageStats.driversCount} / {driverLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${driverPercentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${driverPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <Link
          href="/pricing"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          Upgrade your plan
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
}
