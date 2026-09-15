'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCart, resolveProductImage } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Tag, 
  Check, 
  Sparkles,
  Lock
} from 'lucide-react';

const FREE_SHIPPING_THRESHOLD = 100;

export default function CartDrawer({ onClose }) {
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const { user } = useAuth();
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent background body scroll while cart is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Free shipping calculation
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  // Handle promo code
  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    if (!promoCode.trim()) return;
    
    const code = promoCode.trim().toUpperCase();
    if (code === 'DRAGO10' || code === 'NUTRATEIN10') {
      setPromoApplied(true);
      setPromoDiscount(0.1); // 10% discount
      setPromoError('');
    } else {
      setPromoError('Invalid coupon. Try code "DRAGO10" for 10% off!');
    }
  };

  const discountAmount = promoApplied ? subtotal * promoDiscount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <AnimatePresence>
      {/* Backdrop with modern blur */}
      <motion.div
        key="cart-drawer-backdrop"
        className="cart-drawer-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* Drawer Container */}
      <motion.aside
        key="cart-drawer-panel"
        className="cart-drawer-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        aria-label="Shopping Cart Drawer"
      >
        {/* Drawer Header */}
        <div className="cart-header">
          <div className="cart-header-title">
            <div className="cart-icon-wrap">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3>Your Cart</h3>
              <span className="cart-item-count-badge">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
          <button 
            className="cart-close-btn" 
            onClick={onClose} 
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="cart-shipping-bar">
          <div className="cart-shipping-info">
            <Truck size={17} className={freeShippingProgress >= 100 ? 'text-green' : 'text-brand'} />
            <p>
              {freeShippingProgress >= 100 ? (
                <span><strong>Congratulations!</strong> You get FREE express shipping!</span>
              ) : (
                <span>Add <strong>${amountToFreeShipping.toFixed(2)}</strong> more for <strong>FREE shipping</strong></span>
              )}
            </p>
          </div>
          <div className="cart-progress-track">
            <motion.div 
              className="cart-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${freeShippingProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                backgroundColor: freeShippingProgress >= 100 ? '#10b981' : 'var(--color-brand)'
              }}
            />
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon-circle">
                <ShoppingBag size={42} strokeWidth={1.4} />
              </div>
              <h4>Your Cart is Empty</h4>
              <p>Looks like you haven't added any lab-grade peptides or research formulas yet.</p>
              
              <Link 
                href="/shop" 
                onClick={onClose} 
                className="cart-shop-now-btn"
              >
                <span>Browse Catalog</span>
                <ArrowRight size={17} />
              </Link>

              {/* Quick Category Chips */}
              <div className="cart-empty-shortcuts">
                <span className="cart-shortcuts-title">Popular Categories:</span>
                <div className="cart-chip-group">
                  <Link href="/shop" onClick={onClose} className="cart-chip">
                    Peptides
                  </Link>
                  <Link href="/shop" onClick={onClose} className="cart-chip">
                    SARMs
                  </Link>
                  <Link href="/shop" onClick={onClose} className="cart-chip">
                    Nootropics
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="cart-items-list">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    className="cart-card-item"
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, padding: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="cart-item-image-wrapper">
                      <img 
                        src={resolveProductImage(item)} 
                        alt={item.name} 
                        onError={(e) => { e.currentTarget.src = '/images/fragment-1-300x300.webp'; }}
                      />
                    </div>

                    <div className="cart-item-details">
                      <div className="cart-item-top-row">
                        <Link
                          href={`/shop`}
                          onClick={onClose}
                          className="cart-item-title"
                        >
                          {item.name}
                        </Link>
                        <button
                          className="cart-item-delete-btn"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {item.variant_label && (
                        <span className="cart-item-variant-tag">{item.variant_label}</span>
                      )}

                      <div className="cart-item-price-row">
                        <span className="cart-unit-price">${item.price.toFixed(2)} each</span>
                        <strong className="cart-line-total">
                          ${(item.price * item.quantity).toFixed(2)}
                        </strong>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="cart-stepper-container">
                        <button
                          type="button"
                          className="cart-step-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="cart-step-value">{item.quantity}</span>
                        <button
                          type="button"
                          className="cart-step-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Drawer Footer with interactive Checkout */}
        {items.length > 0 && (
          <div className="cart-footer">
            {/* Price Calculations */}
            <div className="cart-price-summary">
              {promoApplied && (
                <div className="cart-summary-line cart-discount-line">
                  <span>Discount (10%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="cart-summary-line">
                <span>Shipping</span>
                <span>{subtotal >= FREE_SHIPPING_THRESHOLD ? (
                  <span className="cart-free-tag">FREE</span>
                ) : (
                  'Calculated at checkout'
                )}</span>
              </div>
              <div className="cart-summary-line cart-total-line">
                <span>Estimated Total</span>
                <span className="cart-grand-price">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="cart-actions-group">
              <Link
                href={user ? '/checkout' : '/login?from=/checkout'}
                onClick={onClose}
                className="cart-checkout-btn"
              >
                <Lock size={17} />
                <span>{user ? 'Checkout' : 'Log In to Checkout'}</span>
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/cart"
                onClick={onClose}
                className="cart-view-cart-btn"
              >
                View Full Cart Page
              </Link>
            </div>

            {/* Trust Assurance Strip */}
            <div className="cart-trust-footer">
              <div className="cart-trust-item">
                <ShieldCheck size={14} />
                <span>Secure Checkout</span>
              </div>
              <span>•</span>
              <div className="cart-trust-item">
                <Truck size={14} />
                <span>Discreet Delivery</span>
              </div>
              <span>•</span>
              <div className="cart-trust-item">
                <Sparkles size={14} />
                <span>Lab Certified</span>
              </div>
            </div>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
