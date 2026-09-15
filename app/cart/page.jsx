'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart, resolveProductImage } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { getCadRate } from '@/lib/wallet';
import { getShippingSettings, DEFAULT_SHIPPING_SETTINGS } from '@/lib/shippingSettings';
import { validatePromoCode } from '@/lib/promoCodes';
import { PRODUCTS } from '@/lib/shopData';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Tag, 
  Check, 
  Sparkles, 
  Lock, 
  ChevronRight, 
  Info,
  FileText
} from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, addItem, subtotal, itemCount, hydrated, appliedPromo, setAppliedPromo, clearPromo } = useCart();
  const { user } = useAuth();

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [cadRate, setCadRate] = useState(1.35);
  const [shippingSettings, setShippingSettings] = useState(DEFAULT_SHIPPING_SETTINGS);
  const FREE_SHIPPING_THRESHOLD = shippingSettings.free_shipping_threshold;
  const [liveProducts, setLiveProducts] = useState(null);

  useEffect(() => {
    getCadRate().then(setCadRate);
    getShippingSettings().then(setShippingSettings);
    supabase
      .from('products')
      .select('id, name, slug, price, image_url')
      .eq('is_active', true)
      .order('featured', { ascending: false })
      .limit(12)
      .then(({ data }) => setLiveProducts(data && data.length > 0 ? data : PRODUCTS));
  }, []);

  // Recommendations (products not yet in cart) — pulled live so a deleted or
  // repriced product never shows stale info here.
  const cartItemIds = (items || []).map((i) => i.id);
  const recommendedProducts = (liveProducts || []).filter((p) => !cartItemIds.includes(p.id)).slice(0, 3);

  // Free shipping progress
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  // Pricing calculations
  const discountRate = appliedPromo ? appliedPromo.discountPercent : 0;
  const discountAmount = subtotal * discountRate;
  const shippingFee = subtotal === 0 ? 0 : (isFreeShipping ? 0 : shippingSettings.standard_fee);
  const finalTotal = Math.max(0, subtotal - discountAmount + (subtotal > 0 ? shippingFee : 0));

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim();
    if (!code) return;

    setCheckingPromo(true);
    try {
      const result = await validatePromoCode(code);
      if (result) {
        setAppliedPromo(result);
        setPromoCode('');
      } else {
        setPromoError('Invalid or expired coupon code.');
      }
    } catch {
      setPromoError('Could not verify coupon right now. Please try again.');
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoError('');
  };

  // If still hydrating from localStorage, show clean loader so empty cart doesn't flash
  if (!hydrated) {
    return (
      <div className="modern-page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--color-brand, #c8102e)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#a8adb4', fontSize: 14, fontWeight: 600 }}>Loading research cart...</p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="modern-page-wrapper">
        <div className="container" style={{ padding: '48px 20px', maxWidth: 900, margin: '0 auto' }}>
          <motion.div 
            className="empty-cart-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="empty-cart-icon-wrap">
              <div className="empty-cart-icon-bg">
                <ShoppingBag size={40} />
              </div>
            </div>
            
            <h1 className="empty-cart-title">Your Cart is Empty</h1>
            <p className="empty-cart-desc">
              Looks like you haven't added any premium research compounds yet. Explore our third-party HPLC-tested catalog to get started.
            </p>

            <Link href="/shop" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 15, margin: '0 auto 36px' }}>
              Explore Research Catalog <ArrowRight size={18} />
            </Link>

            {/* Popular quick-add suggestions */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
                <Sparkles size={16} className="text-brand" />
                <span>Popular Research Compounds</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {PRODUCTS.slice(0, 3).map((product) => (
                  <div 
                    key={product.id} 
                    style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, background: '#171b23', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ height: 100, background: '#12151b', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <img src={product.image_url} alt={product.name} style={{ maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <Link href={`/shop/${product.slug}`} style={{ fontSize: 13.5, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
                      {product.name}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-brand, #c8102e)' }}>
                        ${product.price.toFixed(2)}
                      </span>
                      <button 
                        onClick={() => addItem(product, 1)}
                        className="btn btn-dark"
                        style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8 }}
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-page-wrapper">
      {/* Top Banner / Breadcrumb */}
      <div className="modern-header-section">
        <div className="container">
          <div className="modern-breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={13} />
            <Link href="/shop">Shop</Link>
            <ChevronRight size={13} />
            <span className="current">Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          </div>

          <div className="modern-header-title-row">
            <div>
              <h1 className="modern-main-heading">Your Research Cart</h1>
              <p className="modern-subheading">Review selected items, apply promo codes, and proceed to checkout.</p>
            </div>

            <button 
              onClick={clearCart} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#171b23',
                color: '#a8adb4',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Remove all items"
            >
              <Trash2 size={14} /> Clear Cart
            </button>
          </div>

          {/* Stepper */}
          <div className="modern-stepper">
            <div className="step active">
              <span className="step-num">1</span>
              <span className="step-label">Cart Review</span>
            </div>
            <div className="step-divider active" />
            <div className="step">
              <span className="step-num">2</span>
              <span className="step-label">Secure Checkout</span>
            </div>
            <div className="step-divider" />
            <div className="step">
              <span className="step-num">3</span>
              <span className="step-label">Order Complete</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="modern-layout-grid">
          
          {/* Left Column: Items */}
          <div>
            {/* Free Shipping Tier Card */}
            <div className={`shipping-tier-card ${isFreeShipping ? 'unlocked' : ''}`}>
              <div className="shipping-tier-header">
                <div className="shipping-tier-icon">
                  {isFreeShipping ? <Check size={18} /> : <Truck size={18} />}
                </div>
                <div>
                  {isFreeShipping ? (
                    <div className="shipping-tier-text font-bold text-success">
                      🎉 You unlocked <strong>FREE Express Shipping</strong>!
                    </div>
                  ) : (
                    <div className="shipping-tier-text">
                      Add <strong>${amountToFreeShipping.toFixed(2)}</strong> more for <strong>FREE Express Shipping</strong>
                    </div>
                  )}
                  <span className="shipping-tier-sub">Discreet temperature-controlled packaging on all research orders</span>
                </div>
              </div>
              <div className="shipping-progress-bar-bg">
                <div 
                  className="shipping-progress-bar-fill" 
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Line Items */}
            <div className="cart-line-items-container">
              <div className="cart-items-table-header">
                <span>Product Item</span>
                <span style={{ textAlign: 'right' }}>Qty & Total</span>
              </div>

              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <motion.div
                      key={item.id}
                      className="cart-item-card"
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, padding: 0, margin: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Thumbnail */}
                      <Link href={`/shop/${item.slug || item.id}`} className="cart-item-img-link">
                        <img 
                          src={resolveProductImage(item)} 
                          alt={item.name} 
                          onError={(e) => {
                            e.currentTarget.src = '/images/fragment-1-300x300.webp';
                          }}
                        />
                      </Link>

                      {/* Info */}
                      <div className="cart-item-info">
                        <span className="cart-item-badge">HPLC ≥ 99% Verified</span>
                        <Link href={`/shop/${item.slug || item.id}`} className="cart-item-title">
                          {item.name}
                        </Link>
                        {item.variant_label && (
                          <span className="cart-item-variant-tag">{item.variant_label}</span>
                        )}
                        <div className="cart-item-price-unit">
                          ${item.price.toFixed(2)} <span style={{ color: '#9ca3af', fontSize: 12 }}>/ vial</span>
                        </div>
                      </div>

                      {/* Actions (Stepper + Price + Delete) */}
                      <div className="cart-item-actions-group">
                        <div className="modern-qty-stepper">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="cart-item-line-total">
                          ${lineTotal.toFixed(2)}
                        </div>

                        <button
                          type="button"
                          className="cart-item-remove-btn"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Special Instructions Note */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}>
              <button 
                type="button" 
                onClick={() => setShowNoteField(!showNoteField)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#a8adb4',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="#a8adb4" />
                  <span>Special Laboratory Delivery Instructions (Optional)</span>
                </div>
                <span style={{ fontSize: 16 }}>{showNoteField ? '−' : '+'}</span>
              </button>
              {showNoteField && (
                <div style={{ padding: '0 18px 16px' }}>
                  <textarea
                    rows={2}
                    placeholder="e.g. Leave package with front laboratory security..."
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Recommended Cross-Sells (Horizontal Layout: Left Content/Btn, Right Image) */}
            {recommendedProducts.length > 0 && (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Sparkles size={16} className="text-brand" />
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>Frequently Added With Your Order</h3>
                </div>

                <div className="cross-sell-horizontal-grid">
                  {recommendedProducts.map((product) => (
                    <div key={product.id} className="cross-sell-h-card">
                      {/* Left: Product Image */}
                      <div className="cross-sell-h-right" style={{ marginRight: 0 }}>
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          onError={(e) => { e.currentTarget.src = '/images/placeholder.webp'; }}
                        />
                      </div>

                      {/* Right: Content & Button Box */}
                      <div className="cross-sell-h-left">
                        <span className="cross-sell-h-badge">{product.purity || '≥ 99% Purity'}</span>
                        <Link href={`/shop/${product.slug}`} className="cross-sell-h-title">
                          {product.name}
                        </Link>
                        <div className="cross-sell-h-bottom">
                          <span className="cross-sell-h-price">${Number(product.price).toFixed(2)}</span>
                          <button 
                            type="button" 
                            onClick={() => addItem(product, 1)}
                            className="cross-sell-h-btn"
                            title="Add to cart"
                          >
                            <Plus size={13} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div>
            <div className="modern-summary-card">
              <h2 className="summary-title">Order Summary</h2>

              {/* Promo box */}
              <div className="promo-box">
                {appliedPromo ? (
                  <div className="applied-promo-tag">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <Tag size={15} />
                      <div>
                        <strong>{appliedPromo.code}</strong>
                        <span style={{ fontSize: 11.5, marginLeft: 4, opacity: 0.85 }}>({appliedPromo.label})</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleRemovePromo} 
                      style={{ background: 'transparent', border: 'none', color: '#34d399', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                      title="Remove coupon"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo}>
                    <div className="promo-input-group">
                      <Tag size={15} style={{ color: '#9ca3af', marginRight: 8, flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder="Coupon (e.g. NUTRATEIN10)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <button type="submit" className="promo-submit-btn" disabled={checkingPromo}>
                        {checkingPromo ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promoError && <p style={{ fontSize: 12, color: '#dc2626', margin: '6px 0 0 4px' }}>{promoError}</p>}
                  </form>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="summary-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="breakdown-row discount">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={14} /> Coupon ({appliedPromo.code})
                    </span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="breakdown-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    Shipping
                    <span title="Discreet cold-pack express courier" style={{ color: '#9ca3af', cursor: 'help' }}>
                      <Info size={13} />
                    </span>
                  </span>
                  <span>
                    {isFreeShipping ? (
                      <span className="free-shipping-tag">FREE</span>
                    ) : (
                      `$${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="summary-divider" />

                <div className="breakdown-row total">
                  <span>Estimated Total</span>
                  <span className="total-price">${finalTotal.toFixed(2)}</span>
                </div>
                <div className="currency-notice">≈ C${(finalTotal * cadRate).toFixed(2)} · Taxes & exact shipping calculated at checkout</div>
              </div>

              {/* Proceed to Checkout CTA */}
              <Link
                href="/checkout"
                className="checkout-cta-btn"
              >
                <Lock size={17} />
                <span>Proceed to Checkout</span>
                <ArrowRight size={17} />
              </Link>

              {!user && (
                <div style={{ fontSize: 12, color: '#a8adb4', textAlign: 'center', marginTop: 10 }}>
                  Already a client?{' '}
                  <Link href="/login?redirect=/cart" style={{ color: 'var(--color-brand, #c8102e)', fontWeight: 600 }}>
                    Sign in
                  </Link>{' '}
                  for saved addresses & 1-click checkout.
                </div>
              )}

              <Link 
                href="/shop" 
                className="btn btn-outline" 
                style={{ width: '100%', marginTop: 12, borderRadius: 12, fontSize: 13.5, borderColor: 'rgba(255,255,255,0.15)', boxSizing: 'border-box' }}
              >
                ← Continue Shopping
              </Link>

              {/* Trust badges */}
              <div className="cart-trust-section">
                <div className="trust-item">
                  <ShieldCheck size={18} className="text-brand" />
                  <div>
                    <strong>256-Bit SSL Encrypted</strong>
                    <span>Bank-grade secure transaction</span>
                  </div>
                </div>
                <div className="trust-item">
                  <Truck size={18} className="text-brand" />
                  <div>
                    <strong>Same-Day Priority Dispatch</strong>
                    <span>Discreet vacuum & cold packaging</span>
                  </div>
                </div>
                <div className="trust-item">
                  <Sparkles size={18} className="text-brand" />
                  <div>
                    <strong>HPLC Batch Tested</strong>
                    <span>≥99% Purity verified with COA</span>
                  </div>
                </div>
              </div>

              {/* Payment badges */}
              <div className="payment-badges-row">
                <span className="pay-badge">VISA</span>
                <span className="pay-badge">Mastercard</span>
                <span className="pay-badge">AMEX</span>
                <span className="pay-badge">Apple Pay</span>
                <span className="pay-badge">Google Pay</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
