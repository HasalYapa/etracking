export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string
          role: 'shop_owner' | 'driver' | 'admin'
          phone: string | null
          address: string | null
          business_name: string | null
          subscription_tier: 'free' | 'basic' | 'pro' | 'custom' | null
          subscription_status: 'active' | 'cancelled' | 'past_due' | null
          subscription_start: string | null
          subscription_end: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          name: string
          email: string
          role: 'shop_owner' | 'driver' | 'admin'
          phone?: string | null
          address?: string | null
          business_name?: string | null
          subscription_tier?: 'free' | 'basic' | 'pro' | 'custom' | null
          subscription_status?: 'active' | 'cancelled' | 'past_due' | null
          subscription_start?: string | null
          subscription_end?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string
          role?: 'shop_owner' | 'driver' | 'admin'
          phone?: string | null
          address?: string | null
          business_name?: string | null
          subscription_tier?: 'free' | 'basic' | 'pro' | 'custom' | null
          subscription_status?: 'active' | 'cancelled' | 'past_due' | null
          subscription_start?: string | null
          subscription_end?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          phone: string
          email: string | null
          address: string
          shop_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          phone: string
          email?: string | null
          address: string
          shop_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          phone?: string
          email?: string | null
          address?: string
          shop_id?: string
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          shop_id: string
          customer_id: string
          driver_id: string | null
          status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          delivery_address: string
          delivery_notes: string | null
          proof_of_delivery: string | null
          tracking_number: string
          estimated_delivery: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          shop_id: string
          customer_id: string
          driver_id?: string | null
          status?: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          delivery_address: string
          delivery_notes?: string | null
          proof_of_delivery?: string | null
          tracking_number?: string
          estimated_delivery?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          shop_id?: string
          customer_id?: string
          driver_id?: string | null
          status?: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          delivery_address?: string
          delivery_notes?: string | null
          proof_of_delivery?: string | null
          tracking_number?: string
          estimated_delivery?: string | null
        }
      }
      order_history: {
        Row: {
          id: string
          created_at: string
          order_id: string
          status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          notes: string | null
          updated_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          order_id: string
          status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          notes?: string | null
          updated_by: string
        }
        Update: {
          id?: string
          created_at?: string
          order_id?: string
          status?: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          notes?: string | null
          updated_by?: string
        }
      }
      sms_logs: {
        Row: {
          id: string
          created_at: string
          order_id: string
          customer_id: string
          message: string
          status: 'sent' | 'delivered' | 'failed'
          shop_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          order_id: string
          customer_id: string
          message: string
          status?: 'sent' | 'delivered' | 'failed'
          shop_id: string
        }
        Update: {
          id?: string
          created_at?: string
          order_id?: string
          customer_id?: string
          message?: string
          status?: 'sent' | 'delivered' | 'failed'
          shop_id?: string
        }
      }
      sms_packs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          pack_size: number
          remaining: number
          expires_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          pack_size: number
          remaining: number
          expires_at: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          pack_size?: number
          remaining?: number
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
