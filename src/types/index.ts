import { Database } from './supabase';

// Convenience types from the database schema
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderHistory = Database['public']['Tables']['order_history']['Row'];
export type SMSLog = Database['public']['Tables']['sms_logs']['Row'];
export type SMSPack = Database['public']['Tables']['sms_packs']['Row'];

// Extended types with relationships
export type OrderWithRelations = Order & {
  customers: Customer;
  drivers: Profile | null;
  shops: Profile;
};

export type OrderStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

export type PlanTier = 'basic' | 'standard' | 'premium';
export type SubscriptionTier = PlanTier | 'custom';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due';

export type UserRole = 'shop_owner' | 'driver' | 'admin';

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  businessName?: string;
  phone?: string;
  plan?: PlanTier;
}

export interface CreateOrderFormData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  driverId?: string;
}

export interface UpdateOrderStatusFormData {
  status: OrderStatus;
  notes?: string;
}

// Plan types
export interface Plan {
  id: PlanTier;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    orders: number;
    drivers: number;
    analytics: boolean;
    support: 'email' | 'priority' | '24/7';
  };
}

export const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 999,
    billingCycle: 'monthly',
    features: [
      'Real-time order tracking',
      'Customer notifications',
      'Basic reporting',
      'Email support'
    ],
    limits: {
      orders: 50,
      drivers: 2,
      analytics: false,
      support: 'email'
    }
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 2499,
    billingCycle: 'monthly',
    features: [
      'All Basic features',
      'Advanced analytics',
      'Up to 5 drivers',
      'Priority support',
      'Customer feedback collection'
    ],
    limits: {
      orders: 200,
      drivers: 5,
      analytics: true,
      support: 'priority'
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 4999,
    billingCycle: 'monthly',
    features: [
      'All Standard features',
      'Unlimited orders',
      'Up to 15 drivers',
      '24/7 support',
      'Custom branding',
      'API access'
    ],
    limits: {
      orders: Infinity,
      drivers: 15,
      analytics: true,
      support: '24/7'
    }
  }
];

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
