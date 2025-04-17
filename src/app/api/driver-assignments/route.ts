import { NextResponse } from 'next/server';
import supabase from '@/utils/supabase-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json({ success: false, error: 'Driver ID is required' }, { status: 400 });
    }

    // Fetch orders assigned to this driver
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(*)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching driver assignments:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Unexpected error in driver-assignments API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
