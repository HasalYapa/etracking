import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const data = await request.json();

    // Validate required fields
    if (!data.customer_name || !data.customer_phone || !data.delivery_address || !data.tracking_number || !data.shop_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Extract auto-assign driver flag
    const autoAssignDriver = data.autoAssignDriver === true;

    // Validate phone number format
    if (!data.customer_phone.startsWith('+94') || data.customer_phone.length !== 12) {
      return NextResponse.json({
        success: false,
        error: 'Phone number must start with +94 and contain 10 digits after that'
      }, { status: 400 });
    }

    // Validate tracking number format
    if (!data.tracking_number.startsWith('ET')) {
      return NextResponse.json({
        success: false,
        error: 'Tracking number must start with ET'
      }, { status: 400 });
    }

    // First, create a customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: data.customer_name,
        phone: data.customer_phone,
        address: data.delivery_address,
        shop_id: data.shop_id
      })
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer:', customerError);
      return NextResponse.json({
        success: false,
        error: customerError.message
      }, { status: 500 });
    }

    // If auto-assign is requested, find an available driver
    let driverId = null;
    let assignedDriver = null;

    if (autoAssignDriver) {
      console.log('Auto-assigning driver for order');

      // Find available drivers
      const { data: availableDrivers, error: driversError } = await supabase
        .from('driver_availability')
        .select(`
          *,
          driver:profiles(id, name, email, phone)
        `)
        .eq('available', true)
        .order('last_active', { ascending: false })
        .limit(5);

      if (driversError) {
        console.error('Error finding available drivers:', driversError);
        // Continue without a driver if there's an error
      } else if (availableDrivers && availableDrivers.length > 0) {
        // Just take the first available driver for now
        // In a real app, you might want to consider proximity or other factors
        driverId = availableDrivers[0].driver_id;
        assignedDriver = availableDrivers[0].driver;

        console.log(`Auto-assigned driver: ${assignedDriver?.name} (${driverId})`);
      } else {
        console.log('No available drivers found for auto-assignment');
      }
    }

    // Then create the order with the customer ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tracking_number: data.tracking_number,
        customer_id: customer.id,
        delivery_address: data.delivery_address,
        driver_id: driverId,
        status: driverId ? 'assigned' : 'pending',
        shop_id: data.shop_id
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({
        success: false,
        error: orderError.message
      }, { status: 500 });
    }

    // If a driver was assigned, create a notification for them
    if (driverId) {
      const timestamp = new Date().toISOString();

      // Create a notification for the driver
      const { error: notificationError } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: driverId,
          order_id: order.id,
          message: `New order assigned: ${order.tracking_number}`,
          status: 'pending',
          created_at: timestamp,
          updated_at: timestamp
        });

      if (notificationError) {
        console.error('Error creating driver notification:', notificationError);
        // Continue anyway, the driver is still assigned
      }

      // Create an order history record
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: order.id,
          status: 'assigned',
          notes: `Order assigned to driver ${assignedDriver?.name || 'Unknown'}`,
          updated_by: data.shop_id
        });

      if (historyError) {
        console.error('Error creating order history:', historyError);
        // Continue anyway, the order is still updated
      }
    }

    // Return both customer and order data
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        customer_name: customer.name,
        customer_phone: customer.phone,
        assigned_driver: assignedDriver,
        auto_assigned: autoAssignDriver && driverId !== null
      }
    });

  } catch (error: any) {
    console.error('Error in create-custom-order API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unknown error occurred'
    }, { status: 500 });
  }
}
