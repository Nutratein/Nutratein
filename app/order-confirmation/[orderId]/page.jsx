'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { PRODUCTS } from '@/lib/shopData';
import { resolveProductImage } from '@/context/CartContext';
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
  Calendar,
  CreditCard,
  Building,
  ArrowRight,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  FileText,
  HelpCircle,
  ExternalLink
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
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
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
    : (orderId ? `ORD-${String(orderId).slice(0, 8).toUpperCase()}` : 'ORD-PENDING');

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

  // Estimated delivery range: +3 to +5 business days
  const estDelivery = (() => {
    const start = new Date();
    start.setDate(start.getDate() + 3);
    const end = new Date();
    end.setDate(end.getDate() + 5);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  })();

  const shippingAddr = order?.shipping_address || {};
  const paymentPref = shippingAddr?.payment_preference || 'card';
  const shippingMethod = shippingAddr?.shipping_method || 'express';

  // Subtotal & Shipping calculation
  const items = order?.order_items || [];
  const itemsSubtotal = items.reduce((acc, it) => acc + Number(it.line_total || it.unit_price * it.quantity || 0), 0);
  const totalAmount = order?.total ? Number(order.total) : itemsSubtotal;
  const shippingCost = Math.max(0, totalAmount - itemsSubtotal);

  if (loading) {
    return (
      <div className="conf-page-wrapper">
        <div className="conf-container" style={{ maxWidth: 650, textAlign: 'center', paddingTop: 80 }}>
          <div className="conf-icon-wrapper">
            <div className="conf-icon-bg" style={{ background: 'var(--color-surface)', color: '#94a3b8' }}>
              <Clock size={32} className="animate-spin" />
            </div>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 8 }}>
            Retrieving Order Confirmation...
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>
            Synchronizing high-security laboratory dispatch logs. Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="conf-page-wrapper">
      {/* Interactive celebratory particles */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: -20, 
              x: `${(i * 8.5) + 3}%`,
              scale: 0.4
            }}
            animate={{ 
              opacity: [0, 0.7, 0], 
              y: ['0vh', '70vh'],
              x: [`${(i * 8.5) + 3}%`, `${(i * 8.5) + (i % 2 === 0 ? 5 : -5)}%`],
              scale: [0.4, 0.9, 0.2]
            }}
            transition={{ 
              duration: 3.5 + (i % 3), 
              delay: i * 0.15,
              repeat: 0,
              ease: 'easeOut'
            }}
            style={{
              position: 'absolute',
              width: i % 3 === 0 ? 10 : 7,
              height: i % 3 === 0 ? 10 : 7,
              borderRadius: '50%',
              background: i % 2 === 0 ? '#10b981' : '#c8102e',
              filter: 'blur(0.5px)'
            }}
          />
        ))}
      </div>

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
              transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }}
            >
              <Check size={38} strokeWidth={3} />
            </motion.div>
          </div>

          <h1 className="conf-title">
            Order Confirmed & Logged!
          </h1>
          <p className="conf-subtitle">
            Thank you, <strong>{order?.full_name || 'Valued Researcher'}</strong>. Your research order has been officially received. A discreet confirmation email with invoice documentation has been sent to <strong>{order?.email || 'your registered address'}</strong>.
          </p>

          <div className="conf-pill-bar">
            <div className="conf-ref-pill">
              <span>Order Reference:</span>
              <strong style={{ color: 'var(--color-ink)', letterSpacing: '0.04em' }}>{refCode}</strong>
              <button 
                type="button" 
                onClick={handleCopy}
                className={`conf-copy-btn ${copied ? 'copied' : ''}`}
                title="Copy reference code"
              >
                {copied ? <Check size={13} strokeWidth={2.6} /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <button 
              type="button" 
              onClick={handlePrint} 
              className="conf-copy-btn" 
              style={{ padding: '7px 14px', fontSize: 13, background: 'var(--color-surface)' }}
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
              <Truck size={18} color="#059669" />
              <span>Dispatch & Laboratory Fulfillment Status</span>
            </h2>
            <div className="conf-timeline-est">
              Est. Delivery: {estDelivery}
            </div>
          </div>

          <div className="conf-stepper">
            {/* Step 1 */}
            <div className="conf-step-item done">
              <div className="conf-step-icon">
                <Check size={18} strokeWidth={3} />
              </div>
              <div className="conf-step-label">Order Confirmed</div>
              <div className="conf-step-sub">{orderDate}</div>
            </div>

            {/* Step 2 */}
            <div className="conf-step-item current">
              <div className="conf-step-icon">
                <Package size={18} />
              </div>
              <div className="conf-step-label">HPLC Quality QA</div>
              <div className="conf-step-sub">Batch Verification</div>
            </div>

            {/* Step 3 */}
            <div className="conf-step-item">
              <div className="conf-step-icon">
                <Truck size={18} />
              </div>
              <div className="conf-step-label">Cold-Chain Dispatch</div>
              <div className="conf-step-sub">Discreet Courier</div>
            </div>

            {/* Step 4 */}
            <div className="conf-step-item">
              <div className="conf-step-icon">
                <MapPin size={18} />
              </div>
              <div className="conf-step-label">Delivered</div>
              <div className="conf-step-sub">Final Destination</div>
            </div>
          </div>
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
                  <ShoppingBag size={17} color="#c8102e" />
                  <span>Items Ordered ({items.length > 0 ? items.reduce((a, b) => a + (b.quantity || 1), 0) : 'Confirmed'})</span>
                </h3>
                <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>HPLC Purity ≥99%</span>
              </div>

              {items.length > 0 ? (
                <div>
                  {items.map((item) => {
                    const itemImg = resolveProductImage(item);

                    return (
                      <div key={item.id || item.product_name} className="conf-item-row">
                        <div className="conf-item-thumb" style={{ overflow: 'hidden', padding: 2, background: '#171b23' }}>
                          <img 
                            src={itemImg} 
                            alt={item.product_name}
                            onError={(e) => { e.currentTarget.src = '/images/fragment-1-300x300.webp'; }}
                          />
                        </div>
                        <div className="conf-item-info">
                          <div className="conf-item-name">
                            {item.product_name}
                            {item.variant_label && <span style={{ color: 'var(--color-brand)', fontWeight: 650 }}> · {item.variant_label}</span>}
                          </div>
                          <div className="conf-item-meta">
                            <span className="conf-item-qty">Qty: {item.quantity}</span>
                            <span>•</span>
                            <span>${Number(item.unit_price || 0).toFixed(2)} each</span>
                          </div>
                        </div>
                        <div className="conf-item-total">
                          ${Number(item.line_total || (item.unit_price * item.quantity) || 0).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '16px 0', color: 'var(--color-ink-soft)', fontSize: 14 }}>
                  Order line items registered. Full batch manifests are attached to your invoice email.
                </div>
              )}

              {/* Price Breakdown */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1.5px solid var(--color-border)' }}>
                <div className="conf-breakdown-row">
                  <span>Subtotal</span>
                  <span>${(itemsSubtotal > 0 ? itemsSubtotal : totalAmount).toFixed(2)}</span>
                </div>

                <div className="conf-breakdown-row">
                  <span>Shipping ({shippingMethod === 'cold-chain' ? 'Cold-Chain Protected' : 'Express Tracked'})</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span style={{ color: '#34d399', fontWeight: 700, background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
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
                  <span className="conf-total-price">${totalAmount.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  All prices in USD. No hidden handling or processing fees.
                </div>
              </div>
            </div>

            {/* Quality & Research Assurance Card */}
            <div className="conf-card" style={{ background: 'linear-gradient(180deg, #12151b 0%, #0d1117 100%)' }}>
              <div className="conf-card-head" style={{ borderBottom: 'none', marginBottom: 8, paddingBottom: 0 }}>
                <h3 className="conf-card-title">
                  <ShieldCheck size={18} color="#059669" />
                  <span>Laboratory Integrity Guarantee</span>
                </h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', lineHeight: 1.6, margin: 0 }}>
                Every compound is packaged in sterile, temperature-buffered packaging with nitrogen flush where required. All analytical COAs (Certificates of Analysis) and mass spectrometry data are accessible with your batch number.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Payment, Shipping, and Actions */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            {/* Payment Guidance Card */}
            <div className="conf-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="conf-card-head">
                <h3 className="conf-card-title">
                  {paymentPref === 'wire' ? <Building size={18} color="#f1f5f9" /> : <CreditCard size={18} color="#f1f5f9" />}
                  <span>Payment Preference</span>
                </h3>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: 6 }}>
                  ACTION INITIATED
                </span>
              </div>

              {paymentPref === 'wire' ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', lineHeight: 1.5, margin: '0 0 12px' }}>
                    Institutional Bank Wire, ACH, or Zelle instructions have been issued to your email. Please reference your order number <strong>{refCode}</strong> during the wire transfer.
                  </p>
                  <div style={{ background: '#171b23', padding: '10px 12px', borderRadius: 8, fontSize: 12, color: 'var(--color-ink-soft)', border: '1px solid var(--color-border)' }}>
                    ⚡ <strong>Fast Clear:</strong> Transfers initiated within business hours typically clear and dispatch within 24 hours.
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', lineHeight: 1.5, margin: '0 0 12px' }}>
                    A discreet, encrypted card payment invoice link has been generated and dispatched to <strong>{order?.email || 'your email'}</strong>.
                  </p>
                  <div style={{ background: '#171b23', padding: '10px 12px', borderRadius: 8, fontSize: 12, color: 'var(--color-ink-soft)', border: '1px solid var(--color-border)' }}>
                    🔒 <strong>Discreet Statement:</strong> The descriptor on your statement will read securely without any research designations.
                  </div>
                </div>
              )}
            </div>

            {/* Shipping & Delivery Address Card */}
            <div className="conf-card">
              <div className="conf-card-head">
                <h3 className="conf-card-title">
                  <MapPin size={17} color="#c8102e" />
                  <span>Delivery Destination</span>
                </h3>
              </div>

              <div className="conf-info-group">
                <div className="conf-info-label">Recipient</div>
                <div className="conf-info-val">{order?.full_name || 'Valued Client'}</div>
                {order?.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 3 }}>
                    <Mail size={13} /> {order.email}
                  </div>
                )}
                {order?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 2 }}>
                    <Phone size={13} /> {order.phone}
                  </div>
                )}
              </div>

              <div className="conf-info-group" style={{ marginTop: 14 }}>
                <div className="conf-info-label">Shipping Address</div>
                <div className="conf-info-val">
                  {shippingAddr.address1 || 'Address registered with order'}
                  {shippingAddr.address2 && <div>{shippingAddr.address2}</div>}
                  <div>
                    {[shippingAddr.city, shippingAddr.state, shippingAddr.postal_code].filter(Boolean).join(', ')}
                  </div>
                  <div>{shippingAddr.country || 'United States'}</div>
                </div>
              </div>

              {order?.notes && (
                <div className="conf-info-group" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <div className="conf-info-label">Order Notes</div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-ink-soft)', background: '#171b23', padding: '8px 10px', borderRadius: 6, fontStyle: 'italic' }}>
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
                  style={{ fontSize: 12.5, color: 'var(--color-ink-soft)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <HelpCircle size={13} /> Need assistance with this order? Contact Support
                </Link>
              </div>
            </div>

          </motion.div>

        </div>

      </div>
    </div>
  );
}
