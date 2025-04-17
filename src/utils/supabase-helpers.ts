import { supabase } from '@/lib/supabase';

/**
 * Helper function to get orders with related data using explicit joins
 * @param options Query options
 * @returns Promise with the query result
 */
export async function getOrdersWithRelations(options: {
  shopId?: string;
  driverId?: string;
  customerId?: string;
  status?: string;
  limit?: number;
  includeCustomer?: boolean;
  includeShop?: boolean;
  includeDriver?: boolean;
  includeHistory?: boolean;
}) {
  const {
    shopId,
    driverId,
    customerId,
    status,
    limit = 10,
    includeCustomer = true,
    includeShop = false,
    includeDriver = false,
    includeHistory = false
  } = options;

  // Start building the select string
  let selectString = '*';
  
  // Add customer relation if requested
  if (includeCustomer) {
    selectString += ', customers:customers(*)';
  }
  
  // Add shop relation if requested
  if (includeShop) {
    selectString += ', shop:profiles!orders_shop_id_fkey(id, email, role, full_name)';
  }
  
  // Add driver relation if requested
  if (includeDriver) {
    selectString += ', driver:profiles!orders_driver_id_fkey(id, email, role, full_name)';
  }
  
  // Add order history relation if requested
  if (includeHistory) {
    selectString += ', history:order_history(*)';
  }
  
  // Start building the query
  let query = supabase
    .from('orders')
    .select(selectString)
    .limit(limit);
  
  // Add filters if provided
  if (shopId) {
    query = query.eq('shop_id', shopId);
  }
  
  if (driverId) {
    query = query.eq('driver_id', driverId);
  }
  
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  // Order by created_at descending
  query = query.order('created_at', { ascending: false });
  
  // Execute the query
  return await query;
}

/**
 * Helper function to get customers with related data using explicit joins
 * @param options Query options
 * @returns Promise with the query result
 */
export async function getCustomersWithRelations(options: {
  shopId?: string;
  customerId?: string;
  limit?: number;
  includeShop?: boolean;
  includeOrders?: boolean;
}) {
  const {
    shopId,
    customerId,
    limit = 10,
    includeShop = false,
    includeOrders = false
  } = options;

  // Start building the select string
  let selectString = '*';
  
  // Add shop relation if requested
  if (includeShop) {
    selectString += ', shop:profiles!customers_shop_id_fkey(id, email, role, full_name)';
  }
  
  // Add orders relation if requested
  if (includeOrders) {
    selectString += ', orders:orders(*)';
  }
  
  // Start building the query
  let query = supabase
    .from('customers')
    .select(selectString)
    .limit(limit);
  
  // Add filters if provided
  if (shopId) {
    query = query.eq('shop_id', shopId);
  }
  
  if (customerId) {
    query = query.eq('id', customerId);
  }
  
  // Order by created_at descending
  query = query.order('created_at', { ascending: false });
  
  // Execute the query
  return await query;
}

/**
 * Helper function to get order history with related data using explicit joins
 * @param options Query options
 * @returns Promise with the query result
 */
export async function getOrderHistoryWithRelations(options: {
  orderId?: string;
  updatedBy?: string;
  limit?: number;
  includeOrder?: boolean;
  includeUpdatedBy?: boolean;
}) {
  const {
    orderId,
    updatedBy,
    limit = 10,
    includeOrder = true,
    includeUpdatedBy = false
  } = options;

  // Start building the select string
  let selectString = '*';
  
  // Add order relation if requested
  if (includeOrder) {
    selectString += ', orders:orders(*)';
  }
  
  // Add updated_by relation if requested
  if (includeUpdatedBy) {
    selectString += ', updater:profiles!order_history_updated_by_fkey(id, email, role, full_name)';
  }
  
  // Start building the query
  let query = supabase
    .from('order_history')
    .select(selectString)
    .limit(limit);
  
  // Add filters if provided
  if (orderId) {
    query = query.eq('order_id', orderId);
  }
  
  if (updatedBy) {
    query = query.eq('updated_by', updatedBy);
  }
  
  // Order by created_at descending
  query = query.order('created_at', { ascending: false });
  
  // Execute the query
  return await query;
}
