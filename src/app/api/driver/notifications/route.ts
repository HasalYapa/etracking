import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a Supabase client with service role key to bypass RLS
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NTM0NiwiZXhwIjoyMDYwMjMxMzQ2fQ.mKei2DrPSguXkVouBWzsW3iqDWT2H3xvkJOnkPIkuLc';

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET driver notifications
export async function GET(request: Request) {
  try {
    // Get the driver ID from the query parameters
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    // Get user profile to determine role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', driverId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (profile?.role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can access this endpoint' }, { status: 403 });
    }

    // Get query parameters
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    // Build the query
    let query = supabaseAdmin
      .from('driver_notifications')
      .select(`
        *,
        order:orders(
          id,
          tracking_number,
          status,
          delivery_address,
          delivery_notes,
          customer:customers(name, phone, address)
        )
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add filter for unread notifications if requested
    if (unreadOnly) {
      query = query.eq('status', 'pending');
    }

    // Execute the query
    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching driver notifications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: notifications });
  } catch (error: any) {
    console.error('Unexpected error in driver notifications GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update notification status (mark as read, accept/reject assignment)
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { driverId, notificationId, action } = body;

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    // Get user profile to determine role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', driverId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (profile?.role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can access this endpoint' }, { status: 403 });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Get the notification to verify it belongs to this driver
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('driver_notifications')
      .select('*, order:orders(*)')
      .eq('id', notificationId)
      .eq('driver_id', driverId)
      .single();

    if (notificationError) {
      console.error('Error fetching notification:', notificationError);
      return NextResponse.json({ error: 'Notification not found or does not belong to this driver' }, { status: 404 });
    }

    // Update notification based on action
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Handle mark_read action
    if (action === 'mark_read') {
      // We'll just update the status to 'read' instead of using a separate column
      updateData.status = 'read';
    }

    // Handle accept/reject/mark_read actions
    if (action === 'accept' || action === 'reject') {
      updateData.status = action === 'accept' ? 'accepted' : 'rejected';

      // If accepting, update the order status to picked_up
      if (action === 'accept') {
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'picked_up',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.order_id);

        if (orderError) {
          console.error('Error updating order status:', orderError);
          return NextResponse.json({ error: orderError.message }, { status: 500 });
        }

        // Create an order history record
        const { error: historyError } = await supabaseAdmin
          .from('order_history')
          .insert({
            order_id: notification.order_id,
            status: 'picked_up',
            notes: 'Driver accepted the order',
            updated_by: driverId
          });

        if (historyError) {
          console.error('Error creating order history:', historyError);
          // Continue anyway, the order is still updated
        }
      } else if (action === 'reject') {
        // If rejecting, update the order status back to pending and remove driver assignment
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'pending',
            driver_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.order_id);

        if (orderError) {
          console.error('Error updating order status:', orderError);
          return NextResponse.json({ error: orderError.message }, { status: 500 });
        }

        // Create an order history record
        const { error: historyError } = await supabaseAdmin
          .from('order_history')
          .insert({
            order_id: notification.order_id,
            status: 'pending',
            notes: 'Driver rejected the order',
            updated_by: driverId
          });

        if (historyError) {
          console.error('Error creating order history:', historyError);
          // Continue anyway, the order is still updated
        }
      }
    }

    // Update the notification
    const { data: updatedNotification, error } = await supabaseAdmin
      .from('driver_notifications')
      .update(updateData)
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: updatedNotification,
      message: action
        ? `Order ${action === 'accept' ? 'accepted' : 'rejected'} successfully`
        : 'Notification updated'
    });
  } catch (error: any) {
    console.error('Unexpected error in driver notifications POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
