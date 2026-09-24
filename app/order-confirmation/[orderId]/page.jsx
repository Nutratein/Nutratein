'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { resolveProductImage } from '@/context/CartContext';
import PrintableInvoice from '@/components/PrintableInvoice';
import {
  Check,
  CheckCircle2,
  Copy,
  Printer,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Package,
  Clock,
  CreditCard,
  Building,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  HelpCircle,
  ExternalLink,
  XCircle,
  Wallet,
} from 'lucide-react';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .maybeSingle();

        if (isMounted) {
          if (data) {
            setOrder(data);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        if (isMounted) setLoading(false);
      }
    }

    if (orderId) {
      loadOrder();

      // Listen for live updates when admin updates order status or courier
      const channel = supabase
        .channel(`order-confirmation-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            if (payload?.new && isMounted) {
              setOrder((prev) => ({
                ...prev,
                ...payload.new,
                order_items: prev?.order_items || [],
              }));
            }
          }
        )
        .subscribe();

      // Auto-poll interval (12s) to guarantee live status updates
      const pollTimer = setInterval(() => {
        if (isMounted) loadOrder();
      }, 12000);

      // Re-fetch when user switches back to this tab
      const handleFocus = () => {
        if (isMounted) loadOrder();
      };
      window.addEventListener('focus', handleFocus);

      return () => {
        isMounted = false;
        clearInterval(pollTimer);
        window.removeEventListener('focus', handleFocus);
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const handleCopy = () => {
    const code = order?.id || orderId;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe formatting helpers
  const refCode = order?.id
    ? `ORD-${order.id.slice(0, 8).toUpperCase()}`
    : orderId
    ? `ORD-${String(orderId).slice(0, 8).toUpperCase()}`
    : 'ORD-PENDING';

  const orderDate = order?.created_at
    ? new Date(order.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  const shippingAddr = order?.shipping_address || {};
  const paymentPref =
    shippingAddr?.payment_preference || order?.payment_method || 'card';
  const shippingMethod = shippingAddr?.shipping_method || 'express';

  // Subtotal & Shipping calculation
  const items = order?.order_items || [];
  const itemsSubtotal = items.reduce(
    (acc, it) =>
      acc + Number(it.line_total || it.unit_price * it.quantity || 0),
    0
  );
  const discountAmount = Number(order?.discount_amount || 0);
  const totalAmount = order?.total ? Number(order.total) : itemsSubtotal;
  const shippingCost = Math.max(
    0,
    Number((totalAmount - itemsSubtotal + discountAmount).toFixed(2))
  );

  // Estimated delivery range: +3 to +5 business days from order creation
  const estDelivery = (() => {
    const baseDate = order?.created_at
      ? new Date(order.created_at)
      : new Date();
    const start = new Date(baseDate);
    start.setDate(start.getDate() + 3);
    const end = new Date(baseDate);
    end.setDate(end.getDate() + 5);
    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} – ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  })();

  const orderStatus = (order?.status || 'pending').toLowerCase();
  const normalizedStatus =
    orderStatus === 'delivered' ? 'completed' : orderStatus;
  const isCancelled = normalizedStatus === 'cancelled';

  const getStepClass = (stepNum) => {
    if (isCancelled) return '';
    if (normalizedStatus === 'pending') {
      if (stepNum === 1) return 'done';
      if (stepNum === 2) return 'current';
      return '';
    }
    if (normalizedStatus === 'processing') {
      if (stepNum === 1) return 'done';
      if (stepNum === 2) return 'current';
      return '';
    }
    if (normalizedStatus === 'shipped') {
      if (stepNum <= 2) return 'done';
      if (stepNum === 3) return 'current';
      return '';
    }
    if (normalizedStatus === 'completed') {
      return 'done';
    }
    return '';
  };

  const paymentLabel =
    {
      wallet_usd: 'The Pep Shop Wallet (USD)',
      wallet_cad: 'The Pep Shop Wallet (CAD)',
      card: 'Credit / Debit Card',
      wire: 'Bank Wire / Transfer',
      etransfer: 'Interac e-Transfer',
    }[paymentPref] ||
    String(paymentPref).replace(/_/g, ' ').toUpperCase();

  if (loading) {
    return (
      <div className="conf-page-wrapper">
        <div
          className="conf-container"
          style={{ maxWidth: 650, textAlign: 'center', paddingTop: 80 }}
        >
          <div className="conf-icon-wrapper">
            <div
              className="conf-icon-bg"
              style={{ background: 'var(--color-surface)', color: '#94a3b8' }}
            >
              <Clock size={32} className="animate-spin" />
            </div>
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--color-ink)',
              marginBottom: 8,
            }}
          >
            Retrieving Order Details...
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>
            Please wait while we load your order confirmation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PrintableInvoice order={order} />

      <div className="conf-page-wrapper">
        <div className="conf-container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Hero Card */}
          <motion.div
            className="conf-hero-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="conf-icon-wrapper">
              <div className="conf-pulse-ring" />
              <motion.div
                className="conf-icon-bg"
                initial={{ scale: 0.5, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 20,
                  delay: 0.1,
                }}
              >
                <Check size={38} strokeWidth={3} />
              </motion.div>
            </div>

            <h1 className="conf-title">Order Confirmed!</h1>
            <p className="conf-subtitle">
              Thank you{order?.full_name ? `, ${order.full_name}` : ''}! Your
              order has been placed successfully. A confirmation receipt has been
              sent to <strong>{order?.email || 'your email'}</strong>.
            </p>

            <div className="conf-pill-bar">
              <div className="conf-ref-pill">
                <span>Order Reference:</span>
                <strong
                  style={{ color: 'var(--color-ink)', letterSpacing: '0.04em' }}
                >
                  {refCode}
                </strong>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`conf-copy-btn ${copied ? 'copied' : ''}`}
                  title="Copy reference code"
                >
                  {copied ? (
                    <Check size={13} strokeWidth={2.6} />
                  ) : (
                    <Copy size={13} />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="conf-copy-btn"
                style={{
                  padding: '7px 14px',
                  fontSize: 13,
                  background: 'var(--color-surface)',
                }}
              >
                <Printer size={14} />
                <span>Print Invoice</span>
              </button>
            </div>
          </motion.div>

          {/* Visual Progress Timeline */}
          <motion.div
            className="conf-timeline-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="conf-timeline-header">
              <h2 className="conf-timeline-title">
                <Truck size={18} color="#0066ff" />
                <span>Order Fulfillment &amp; Delivery Status</span>
              </h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 650,
                    color: isCancelled ? '#f87171' : '#34d399',
                    background: isCancelled
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(16,185,129,0.12)',
                    border: isCancelled
                      ? '1px solid rgba(239,68,68,0.3)'
                      : '1px solid rgba(16,185,129,0.3)',
                    padding: '4px 10px',
                    borderRadius: 9999,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: isCancelled ? '#ef4444' : '#10b981',
                      boxShadow: isCancelled
                        ? '0 0 6px #ef4444'
                        : '0 0 6px #10b981',
                    }}
                  />
                  <span>
                    {isCancelled
                      ? 'Status: Cancelled'
                      : normalizedStatus === 'completed'
                      ? 'Status: Delivered'
                      : normalizedStatus === 'shipped'
                      ? 'Status: Dispatched & In Transit'
                      : normalizedStatus === 'processing'
                      ? 'Status: Processing & Packaging'
                      : 'Status: Order Confirmed'}
                  </span>
                </div>
                {!isCancelled && (
                  <div className="conf-timeline-est">
                    {normalizedStatus === 'completed'
                      ? 'Package Delivered'
                      : `Est. Delivery: ${estDelivery}`}
                  </div>
                )}
              </div>
            </div>

            <div className="conf-stepper">
              {/* Step 1 */}
              <div className={`conf-step-item ${getStepClass(1)}`}>
                <div className="conf-step-icon">
                  <Check size={18} strokeWidth={3} />
                </div>
                <div className="conf-step-label">Order Placed</div>
                <div className="conf-step-sub">{orderDate}</div>
              </div>

              {/* Step 2 */}
              <div className={`conf-step-item ${getStepClass(2)}`}>
                <div className="conf-step-icon">
                  {normalizedStatus === 'processing' ? (
                    <Clock size={18} className="animate-spin" />
                  ) : (
                    <Package size={18} />
                  )}
                </div>
                <div className="conf-step-label">Processing &amp; Packing</div>
                <div className="conf-step-sub">
                  {getStepClass(2) === 'done'
                    ? 'Items Packed'
                    : normalizedStatus === 'processing'
                    ? 'Packaging in Progress'
                    : 'Pending Preparation'}
                </div>
              </div>

              {/* Step 3 */}
              <div className={`conf-step-item ${getStepClass(3)}`}>
                <div className="conf-step-icon">
                  <Truck size={18} />
                </div>
                <div className="conf-step-label">Shipped / In Transit</div>
                <div className="conf-step-sub">
                  {shippingAddr.carrier
                    ? shippingAddr.carrier
                    : getStepClass(3) === 'done'
                    ? 'Dispatched'
                    : 'Awaiting Courier'}
                </div>
              </div>

              {/* Step 4 */}
              <div className={`conf-step-item ${getStepClass(4)}`}>
                <div className="conf-step-icon">
                  <CheckCircle2 size={18} />
                </div>
                <div className="conf-step-label">Delivered</div>
                <div className="conf-step-sub">
                  {getStepClass(4) === 'done'
                    ? 'Package Delivered'
                    : 'Destination'}
                </div>
              </div>
            </div>

            {/* Courier Tracking Info Box */}
            {shippingAddr?.tracking_number && (
              <div
                style={{
                  marginTop: 20,
                  padding: '14px 18px',
                  background: 'rgba(0, 102, 255, 0.08)',
                  border: '1px solid rgba(0, 102, 255, 0.25)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(0, 102, 255, 0.2)',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Truck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Courier:{' '}
                      <strong style={{ color: 'var(--color-ink)' }}>
                        {shippingAddr.carrier || 'Express Tracked Courier'}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--color-ink)',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Tracking Number: {shippingAddr.tracking_number}
                    </div>
                  </div>
                </div>

                {shippingAddr.tracking_url ? (
                  <a
                    href={shippingAddr.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="conf-copy-btn"
                    style={{
                      padding: '8px 16px',
                      fontSize: 13,
                      background: 'var(--color-brand)',
                      color: '#fff',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Track Package Live</span>
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        shippingAddr.tracking_number
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="conf-copy-btn"
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    <Copy size={13} />
                    <span>
                      {copied ? 'Copied Tracking #' : 'Copy Tracking #'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Cancelled Banner */}
            {isCancelled && (
              <div
                style={{
                  marginTop: 20,
                  padding: '16px 20px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  color: '#fca5a5',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <XCircle size={22} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: '#f87171',
                      marginBottom: 2,
                    }}
                  >
                    Order Cancelled
                  </div>
                  <div style={{ fontSize: 13, color: '#fca5a5' }}>
                    This order was cancelled. Any deductions or payments have
                    been updated accordingly. If you have any questions, please
                    reach out to our support team.
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Two-Column Detail Grid */}
          <div className="conf-layout-grid">
            {/* Left Column: Order Items & Pricing Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* Items Card */}
              <div className="conf-card">
                <div className="conf-card-head">
                  <h3 className="conf-card-title">
                    <ShoppingBag size={17} color="#0066ff" />
                    <span>
                      Items Ordered (
                      {items.length > 0
                        ? items.reduce((a, b) => a + (b.quantity || 1), 0)
                        : 0}
                      )
                    </span>
                  </h3>
                  <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>
                    {items.length} {items.length === 1 ? 'product' : 'products'}
                  </span>
                </div>

                {items.length > 0 ? (
                  <div>
                    {items.map((item) => {
                      const itemImg = resolveProductImage(item);

                      return (
                        <div
                          key={item.id || item.product_name}
                          className="conf-item-row"
                        >
                          <div
                            className="conf-item-thumb"
                            style={{
                              overflow: 'hidden',
                              padding: 2,
                              background: '#171b23',
                            }}
                          >
                            <img
                              src={itemImg}
                              alt={item.product_name}
                              onError={(e) => {
                                e.currentTarget.src =
                                  '/images/product-placeholder.svg';
                              }}
                            />
                          </div>
                          <div className="conf-item-info">
                            <div className="conf-item-name">
                              {item.product_name}
                              {item.variant_label && (
                                <span
                                  style={{
                                    color: 'var(--color-brand)',
                                    fontWeight: 650,
                                  }}
                                >
                                  {' '}
                                  · {item.variant_label}
                                </span>
                              )}
                            </div>
                            <div className="conf-item-meta">
                              <span className="conf-item-qty">
                                Qty: {item.quantity}
                              </span>
                              <span>•</span>
                              <span>
                                ${Number(item.unit_price || 0).toFixed(2)} each
                              </span>
                            </div>
                          </div>
                          <div className="conf-item-total">
                            $
                            {Number(
                              item.line_total ||
                                item.unit_price * item.quantity ||
                                0
                            ).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '16px 0',
                      color: 'var(--color-ink-soft)',
                      fontSize: 14,
                    }}
                  >
                    Order products verified. Complete item details are recorded on your invoice.
                  </div>
                )}

                {/* Price Breakdown */}
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1.5px solid var(--color-border)',
                  }}
                >
                  <div className="conf-breakdown-row">
                    <span>Subtotal</span>
                    <span>${itemsSubtotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="conf-breakdown-row" style={{ color: '#ef4444' }}>
                      <span>
                        Discount {order?.promo_code ? `(${order.promo_code})` : ''}
                      </span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="conf-breakdown-row">
                    <span>
                      Shipping (
                      {shippingAddr?.carrier ||
                        (shippingMethod === 'cold-chain'
                          ? 'Cold-Chain Delivery'
                          : 'Standard Shipping')}
                      )
                    </span>
                    <span>
                      {shippingCost === 0 ? (
                        <span
                          style={{
                            color: '#34d399',
                            fontWeight: 700,
                            background: 'rgba(16,185,129,0.12)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        >
                          FREE
                        </span>
                      ) : (
                        `$${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="conf-breakdown-divider" />

                  <div className="conf-breakdown-total">
                    <span>Total Amount</span>
                    <span className="conf-total-price">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}
                  >
                    All prices in USD. Taxes included where applicable.
                  </div>
                </div>
              </div>

              {/* Quality & Satisfaction Guarantee Card */}
              <div
                className="conf-card"
                style={{
                  background:
                    'linear-gradient(180deg, #12151b 0%, #0d1117 100%)',
                }}
              >
                <div
                  className="conf-card-head"
                  style={{
                    borderBottom: 'none',
                    marginBottom: 8,
                    paddingBottom: 0,
                  }}
                >
                  <h3 className="conf-card-title">
                    <ShieldCheck size={18} color="#0066ff" />
                    <span>The Pep Shop Quality &amp; Satisfaction Guarantee</span>
                  </h3>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--color-ink-soft)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  All The Pep Shop products are manufactured to stringent quality
                  specifications and sealed for maximum freshness and efficacy.
                  If you have any questions regarding your order or shipment, our
                  support team is here to help.
                </p>
              </div>
            </motion.div>

            {/* Right Column: Payment, Shipping, and Actions */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              {/* Payment Details Card */}
              <div
                className="conf-card"
                style={{ borderLeft: '4px solid #10b981' }}
              >
                <div className="conf-card-head">
                  <h3 className="conf-card-title">
                    {paymentPref.includes('wallet') ? (
                      <Wallet size={18} color="#f1f5f9" />
                    ) : paymentPref === 'wire' ? (
                      <Building size={18} color="#f1f5f9" />
                    ) : (
                      <CreditCard size={18} color="#f1f5f9" />
                    )}
                    <span>Payment Details</span>
                  </h3>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: isCancelled ? '#f87171' : '#34d399',
                      background: isCancelled
                        ? 'rgba(239,68,68,0.12)'
                        : 'rgba(16,185,129,0.12)',
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                  </span>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 650,
                      color: 'var(--color-ink)',
                      marginBottom: 4,
                    }}
                  >
                    Method: {paymentLabel}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--color-ink-soft)',
                      lineHeight: 1.5,
                      margin: '0 0 10px',
                    }}
                  >
                    {paymentPref === 'wallet_usd' ||
                    paymentPref === 'wallet_cad' ? (
                      'Amount deducted from your The Pep Shop account wallet balance.'
                    ) : paymentPref === 'wire' ? (
                      `Bank transfer details have been sent to ${
                        order?.email || 'your email'
                      }. Please reference order ID ${refCode}.`
                    ) : paymentPref === 'etransfer' ? (
                      `Interac e-Transfer instructions have been sent to ${
                        order?.email || 'your email'
                      }.`
                    ) : (
                      'Card transaction approved and verified.'
                    )}
                  </p>
                </div>
              </div>

              {/* Shipping & Delivery Address Card */}
              <div className="conf-card">
                <div className="conf-card-head">
                  <h3 className="conf-card-title">
                    <MapPin size={17} color="#0066ff" />
                    <span>Delivery Address</span>
                  </h3>
                </div>

                <div className="conf-info-group">
                  <div className="conf-info-label">Recipient</div>
                  <div className="conf-info-val">
                    {order?.full_name || 'Valued Customer'}
                  </div>
                  {order?.email && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: 'var(--color-ink-soft)',
                        marginTop: 3,
                      }}
                    >
                      <Mail size={13} /> {order.email}
                    </div>
                  )}
                  {order?.phone && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: 'var(--color-ink-soft)',
                        marginTop: 2,
                      }}
                    >
                      <Phone size={13} /> {order.phone}
                    </div>
                  )}
                </div>

                <div className="conf-info-group" style={{ marginTop: 14 }}>
                  <div className="conf-info-label">Shipping Address</div>
                  <div className="conf-info-val">
                    {shippingAddr.address1 || 'Address on file'}
                    {shippingAddr.address2 && (
                      <div>{shippingAddr.address2}</div>
                    )}
                    {[
                      shippingAddr.city,
                      shippingAddr.state,
                      shippingAddr.postal_code,
                    ].some(Boolean) && (
                      <div>
                        {[
                          shippingAddr.city,
                          shippingAddr.state,
                          shippingAddr.postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                    {shippingAddr.country && <div>{shippingAddr.country}</div>}
                  </div>
                </div>

                {order?.notes && (
                  <div
                    className="conf-info-group"
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <div className="conf-info-label">Order Notes</div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--color-ink-soft)',
                        background: '#171b23',
                        padding: '8px 10px',
                        borderRadius: 6,
                        fontStyle: 'italic',
                      }}
                    >
                      "{order.notes}"
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Card */}
              <div className="conf-actions-card">
                <Link href="/shop" className="conf-btn-primary">
                  <span>Continue Shopping</span>
                  <ArrowRight size={16} />
                </Link>

                <Link href="/account" className="conf-btn-secondary">
                  <Package size={16} />
                  <span>View My Orders in Dashboard</span>
                </Link>

                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Link
                    href="/contact-us"
                    style={{
                      fontSize: 12.5,
                      color: 'var(--color-ink-soft)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <HelpCircle size={13} /> Need assistance with this order? Contact Support
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
