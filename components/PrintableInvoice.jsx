'use client';

export default function PrintableInvoice({ order }) {
  if (!order) return null;

  const shippingAddr = order.shipping_address || {};
  const items = order.order_items || [];

  const itemsSubtotal = items.reduce(
    (acc, it) => acc + Number(it.line_total || it.unit_price * it.quantity || 0),
    0
  );
  const discountAmount = Number(order.discount_amount || 0);
  const totalAmount = Number(order.total || itemsSubtotal);
  const shippingCost = Math.max(
    0,
    Number((totalAmount - itemsSubtotal + discountAmount).toFixed(2))
  );

  const refCode = order.id
    ? `ORD-${order.id.slice(0, 8).toUpperCase()}`
    : 'ORD-PENDING';

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const orderTime = order.created_at
    ? new Date(order.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const cleanStatus = (order.status || 'pending').toLowerCase();
  const paymentPref = shippingAddr.payment_preference || order.payment_method || 'card';
  const shippingMethod = shippingAddr.shipping_method || 'express';

  const paymentLabel = {
    card: 'Credit / Debit Card (Online)',
    wire: 'Institutional Wire / ACH / Zelle',
    wallet_usd: 'The Pep Shop USD Wallet Balance',
    wallet_cad: 'The Pep Shop CAD Wallet Balance',
    etransfer: 'Interac e-Transfer (CAD)',
  }[paymentPref] || String(paymentPref).replace(/_/g, ' ').toUpperCase();

  const isPaid = !['cancelled', 'unpaid'].includes(cleanStatus);

  return (
    <div className="invoice-print-container" aria-hidden="true">
      {/* Top Header / Company Branding */}
      <div className="invoice-print-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src="/images/tps-logo.png"
            alt="The Pep Shop"
            style={{ height: 48, width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <h1 className="invoice-brand-name" style={{ margin: 0, fontSize: '20pt', letterSpacing: '0.02em' }}>
              THE PEP SHOP
            </h1>
            <div className="invoice-brand-sub" style={{ fontSize: '9pt', color: '#4b5563', marginTop: 2 }}>
              Peptides for a Stronger Tomorrow
            </div>
            <div className="invoice-brand-contact" style={{ fontSize: '8.5pt', color: '#6b7280', marginTop: 2 }}>
              URL: www.thepepshop.com &bull; Email: info@thepepshop.com
            </div>
          </div>
        </div>

        <div className="invoice-title-block">
          <div className="invoice-doc-title">INVOICE</div>
          <div className="invoice-meta-row">
            <strong>Invoice #:</strong> {refCode}
          </div>
          <div className="invoice-meta-row">
            <strong>Date:</strong> {orderDate} {orderTime ? `at ${orderTime}` : ''}
          </div>
          <div>
            <span
              className={`invoice-status-stamp ${
                cleanStatus === 'cancelled'
                  ? 'cancelled'
                  : isPaid
                  ? 'paid'
                  : 'pending'
              }`}
            >
              {cleanStatus === 'cancelled'
                ? 'VOID / CANCELLED'
                : cleanStatus === 'completed'
                ? 'PAID & DELIVERED'
                : cleanStatus === 'shipped'
                ? 'PAID & DISPATCHED'
                : 'PAID / CONFIRMED'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Address / Order Info Section */}
      <div className="invoice-addresses-grid">
        {/* Customer / Billed To */}
        <div>
          <div className="invoice-addr-title">Billed / Shipped To</div>
          <div className="invoice-addr-content">
            <div className="invoice-addr-name">
              {order.full_name || 'Valued Customer'}
            </div>
            {order.email && <div>Email: {order.email}</div>}
            {order.phone && <div>Phone: {order.phone}</div>}
            <div style={{ marginTop: 4 }}>
              {shippingAddr.address1 || 'Address on file'}
              {shippingAddr.address2 && <div>{shippingAddr.address2}</div>}
              <div>
                {[
                  shippingAddr.city,
                  shippingAddr.state,
                  shippingAddr.postal_code,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
              {shippingAddr.country && <div>{shippingAddr.country}</div>}
            </div>
          </div>
        </div>

        {/* Order & Fulfillment Details */}
        <div>
          <div className="invoice-addr-title">Order &amp; Shipment Details</div>
          <div className="invoice-addr-content">
            <div>
              <strong>Order ID:</strong> {order.id}
            </div>
            <div>
              <strong>Payment Method:</strong> {paymentLabel}
            </div>
            <div>
              <strong>Shipping Method:</strong>{' '}
              {shippingAddr.carrier
                ? shippingAddr.carrier
                : shippingMethod === 'cold-chain'
                ? 'Express Protected Delivery'
                : 'Standard Delivery'}
            </div>
            {shippingAddr.carrier && (
              <div>
                <strong>Courier:</strong> {shippingAddr.carrier}
              </div>
            )}
            {shippingAddr.tracking_number && (
              <div>
                <strong>Tracking Number:</strong> {shippingAddr.tracking_number}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th style={{ width: '5%', textAlign: 'center' }}>#</th>
            <th style={{ width: '55%' }}>Item Description</th>
            <th style={{ width: '15%' }} className="text-right">Unit Price</th>
            <th style={{ width: '10%' }} className="text-center">Qty</th>
            <th style={{ width: '15%' }} className="text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="text-center" style={{ color: '#6b7280' }}>
                  {idx + 1}
                </td>
                <td>
                  <div className="invoice-item-name">{item.product_name}</div>
                  {item.variant_label && (
                    <div className="invoice-item-sub">
                      Variant: {item.variant_label}
                    </div>
                  )}
                </td>
                <td className="text-right">
                  ${Number(item.unit_price || 0).toFixed(2)}
                </td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">
                  ${Number(
                    item.line_total || item.unit_price * item.quantity || 0
                  ).toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '16px' }}>
                Order products verified.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Bottom Financial Breakdown & Notes */}
      <div className="invoice-bottom-grid">
        <div>
          {order.notes ? (
            <div className="invoice-notes-box">
              <strong style={{ display: 'block', marginBottom: 4 }}>
                Special Order Notes:
              </strong>
              <span>{order.notes}</span>
            </div>
          ) : (
            <div className="invoice-notes-box">
              <strong>The Pep Shop Customer Care:</strong>
              <div style={{ marginTop: 2, fontSize: '8.5pt', lineHeight: 1.4 }}>
                Thank you for choosing The Pep Shop. If you have any inquiries regarding your order, please contact our support team at info@thepepshop.com.
              </div>
            </div>
          )}
        </div>

        <div className="invoice-totals-box">
          <div className="invoice-total-row">
            <span>Items Subtotal:</span>
            <span>${itemsSubtotal.toFixed(2)}</span>
          </div>

          <div className="invoice-total-row">
            <span>Shipping &amp; Handling:</span>
            <span>
              {shippingCost === 0 ? (
                <strong style={{ color: '#059669' }}>FREE</strong>
              ) : (
                `$${shippingCost.toFixed(2)}`
              )}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="invoice-total-row" style={{ color: '#b91c1c' }}>
              <span>
                Discount {order.promo_code ? `(${order.promo_code})` : ''}:
              </span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="invoice-grand-total">
            <span>Total Paid (USD):</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Official Footer */}
      <div className="invoice-footer-section">
        <div>
          <div>Thank you for choosing The Pep Shop. Keep this receipt for your records.</div>
          <div style={{ fontSize: '8pt', color: '#9ca3af', marginTop: 2 }}>
            Generated electronically &bull; Official Purchase Receipt
          </div>
        </div>
      </div>
    </div>
  );
}
