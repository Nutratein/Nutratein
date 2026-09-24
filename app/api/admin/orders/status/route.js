import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId, status, carrier, trackingNumber, trackingUrl } = body || {};

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!status || !VALID_STATUSES.includes(status.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const cleanStatus = status.toLowerCase();

    // 1. Fetch current order to preserve shipping_address fields
    const { data: existingOrder, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('id, shipping_address, status')
      .eq('id', orderId)
      .single();

    if (fetchErr || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Prepare updated shipping_address with tracking details
    const existingAddr = existingOrder.shipping_address || {};
    const updatedAddr = {
      ...existingAddr,
      ...(carrier !== undefined ? { carrier: carrier ? carrier.trim() : null } : {}),
      ...(trackingNumber !== undefined
        ? { tracking_number: trackingNumber ? trackingNumber.trim() : null }
        : {}),
      ...(trackingUrl !== undefined ? { tracking_url: trackingUrl ? trackingUrl.trim() : null } : {}),
      status_updated_at: new Date().toISOString(),
    };

    // 3. Update orders table
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: cleanStatus,
        shipping_address: updatedAddr,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update order status via supabaseAdmin:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to "${cleanStatus}" successfully`,
    });
  } catch (err) {
    console.error('Error in /api/admin/orders/status:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
