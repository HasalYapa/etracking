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
    selectString += ', shop:profiles(id, email, role, full_name)';
  }

  // Add driver relation if requested
  if (includeDriver) {
    selectString += ', driver:profiles(id, email, role, full_name)';
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

  // Execute the query to get orders
  const { data: orders, error } = await query;

  // If there's an error or no shop/driver relations requested, return the result
  if (error || (!includeShop && !includeDriver) || !orders || orders.length === 0) {
    return { data: orders, error };
  }

  // If shop or driver relations are requested, we need to fetch them separately
  // because the relationship isn't in the schema cache
  if (includeShop || includeDriver) {
    try {
      // Get unique shop and driver IDs
      const shopIds = includeShop ?
        [...new Set(orders.map(order => order.shop_id).filter(Boolean))] : [];

      const driverIds = includeDriver ?
        [...new Set(orders.map(order => order.driver_id).filter(Boolean))] : [];

      // Combine all profile IDs to fetch
      const profileIds = [...new Set([...shopIds, ...driverIds])];

      if (profileIds.length > 0) {
        // Fetch all profiles in one query
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, role, full_name')
          .in('id', profileIds);

        if (profilesError) throw profilesError;

        // Map profiles to orders
        const ordersWithProfiles = orders.map(order => {
          const result = { ...order };

          if (includeShop && order.shop_id) {
            result.shop = profiles.find(p => p.id === order.shop_id) || null;
          }

          if (includeDriver && order.driver_id) {
            result.driver = profiles.find(p => p.id === order.driver_id) || null;
          }

          return result;
        });

        return { data: ordersWithProfiles, error: null };
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      // Return the original orders if there's an error fetching profiles
    }
  }

  return { data: orders, error };
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
    selectString += ', shop:profiles(id, email, role, full_name)';
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

  // Execute the query to get customers
  const { data: customers, error } = await query;

  // If there's an error or no shop relation requested, return the result
  if (error || !includeShop || !customers || customers.length === 0) {
    return { data: customers, error };
  }

  // If shop relation is requested, we need to fetch it separately
  // because the relationship isn't in the schema cache
  if (includeShop) {
    try {
      // Get unique shop IDs
      const shopIds = [...new Set(customers.map(customer => customer.shop_id).filter(Boolean))];

      if (shopIds.length > 0) {
        // Fetch all shop profiles in one query
        const { data: shopProfiles, error: shopProfilesError } = await supabase
          .from('profiles')
          .select('id, email, role, full_name')
          .in('id', shopIds);

        if (shopProfilesError) throw shopProfilesError;

        // Map shop profiles to customers
        const customersWithShops = customers.map(customer => {
          const result = { ...customer };

          if (customer.shop_id) {
            result.shop = shopProfiles.find(p => p.id === customer.shop_id) || null;
          }

          return result;
        });

        return { data: customersWithShops, error: null };
      }
    } catch (err) {
      console.error('Error fetching shop profiles:', err);
      // Return the original customers if there's an error fetching shop profiles
    }
  }

  return { data: customers, error };
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
    selectString += ', updater:profiles(id, email, role, full_name)';
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

  // Execute the query to get order history
  const { data: history, error } = await query;

  // If there's an error or no updater relation requested, return the result
  if (error || !includeUpdatedBy || !history || history.length === 0) {
    return { data: history, error };
  }

  // If updater relation is requested, we need to fetch it separately
  // because the relationship isn't in the schema cache
  if (includeUpdatedBy) {
    try {
      // Get unique updater IDs
      const updaterIds = [...new Set(history.map(entry => entry.updated_by).filter(Boolean))];

      if (updaterIds.length > 0) {
        // Fetch all updater profiles in one query
        const { data: updaterProfiles, error: updaterProfilesError } = await supabase
          .from('profiles')
          .select('id, email, role, full_name')
          .in('id', updaterIds);

        if (updaterProfilesError) throw updaterProfilesError;

        // Map updater profiles to history entries
        const historyWithUpdaters = history.map(entry => {
          const result = { ...entry };

          if (entry.updated_by) {
            result.updater = updaterProfiles.find(p => p.id === entry.updated_by) || null;
          }

          return result;
        });

        return { data: historyWithUpdaters, error: null };
      }
    } catch (err) {
      console.error('Error fetching updater profiles:', err);
      // Return the original history if there's an error fetching updater profiles
    }
  }

  return { data: history, error };
}
