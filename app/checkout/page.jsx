'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, resolveProductImage } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import { 
  Lock, 
  ShieldCheck, 
  Truck, 
  ChevronRight, 
  Check, 
  CreditCard, 
  ArrowRight, 
  ShoppingBag,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  AlertCircle
} from 'lucide-react';

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United States',
  notes: '',
};

function CheckoutContent() {
  const { items, subtotal, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ ...EMPTY_FORM, email: user?.email || '', fullName: user?.user_metadata?.full_name || '' });
  const [shippingMethod, setShippingMethod] = useState('express'); // 'express' | 'cold-chain'
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'wire'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isFreeShipping = subtotal >= 100;
  const expressFee = isFreeShipping ? 0 : 9.99;
  const shippingFee = shippingMethod === 'cold-chain' ? (isFreeShipping ? 6.99 : 14.99) : expressFee;
  const finalTotal = Math.max(0, subtotal + shippingFee);

  if (items.length === 0) {
    return (
      <div className="modern-page-wrapper">
        <div className="container" style={{ padding: '60px 20px', maxWidth: 800, margin: '0 auto' }}>
          <div className="empty-cart-card">
            <div className="empty-cart-icon-wrap">
              <div className="empty-cart-icon-bg">
                <ShoppingBag size={40} />
              </div>
            </div>
            <h2 className="empty-cart-title">Your Cart is Empty</h2>
            <p className="empty-cart-desc">
              You do not have any items in your cart to checkout. Please explore our research catalog.
            </p>
            <Link href="/shop" className="btn btn-primary" style={{ padding: '12px 28px' }}>
              Explore Catalog <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const required = ['fullName', 'email', 'address1', 'city', 'state', 'postalCode', 'country'];
    if (required.some((f) => !form[f].trim())) {
      setError('Please complete all required fields indicated with an asterisk (*).');
      return;
    }

    setSubmitting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id ?? null,
          email: form.email,
          full_name: form.fullName,
          phone: form.phone,
          total: Number(finalTotal.toFixed(2)),
          notes: `${form.notes || ''} [Method: ${paymentMethod.toUpperCase()}, Shipping: ${shippingMethod}]`.trim(),
          shipping_address: {
            address1: form.address1,
            address2: form.address2,
            city: form.city,
            state: form.state,
            postal_code: form.postalCode,
            country: form.country,
            shipping_method: shippingMethod,
            payment_preference: paymentMethod
          },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Ensure product_id is a valid UUID or null if static alphanumeric string
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: uuidRegex.test(item.id) ? item.id : null,
        product_name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        line_total: Number((item.price * item.quantity).toFixed(2)),
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      router.push(`/order-confirmation/${order.id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong placing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modern-page-wrapper">
      {/* Header */}
      <div className="modern-header-section">
        <div className="container">
          <div className="modern-breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={13} />
            <Link href="/cart">Cart</Link>
            <ChevronRight size={13} />
            <span className="current">Secure Checkout</span>
          </div>

          <div className="modern-header-title-row">
            <div>
              <h1 className="modern-main-heading">Secure Checkout</h1>
              <p className="modern-subheading">Complete your delivery destination and confirm your order.</p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.12)', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.35)' }}>
              <Lock size={14} /> 256-Bit SSL Encrypted
            </div>
          </div>

          {/* Stepper */}
          <div className="modern-stepper">
            <div className="step completed">
              <span className="step-num"><Check size={13} /></span>
              <span className="step-label">Cart Review</span>
            </div>
            <div className="step-divider active" />
            <div className="step active">
              <span className="step-num">2</span>
              <span className="step-label">Delivery & Payment</span>
            </div>
            <div className="step-divider" />
            <div className="step">
              <span className="step-num">3</span>
              <span className="step-label">Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="modern-layout-grid">
          
          {/* Left Column: Form Cards */}
          <div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', color: '#f87171', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form id="checkout-form" onSubmit={handleSubmit}>
              
              {/* Card 1: Contact Information */}
              <div className="checkout-form-card">
                <div className="checkout-section-header">
                  <div className="checkout-section-badge">1</div>
                  <h2 className="checkout-section-title">Contact Information</h2>
                </div>

                <div className="checkout-input-row">
                  <div className="checkout-input-group">
                    <label className="checkout-input-label">Email Address *</label>
                    <div className="checkout-input-control">
                      <Mail size={16} className="checkout-input-icon" />
                      <input 
                        type="email" 
                        value={form.email} 
                        onChange={update('email')} 
                        required 
                        className="checkout-field"
                        placeholder="researcher@lab.org"
                      />
                    </div>
                  </div>

                  <div className="checkout-input-group">
                    <label className="checkout-input-label">Phone Number (For Tracking Alerts)</label>
                    <div className="checkout-input-control">
                      <Phone size={16} className="checkout-input-icon" />
                      <input 
                        type="tel" 
                        value={form.phone} 
                        onChange={update('phone')} 
                        className="checkout-field"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Shipping Destination */}
              <div className="checkout-form-card">
                <div className="checkout-section-header">
                  <div className="checkout-section-badge">2</div>
                  <h2 className="checkout-section-title">Shipping Address</h2>
                </div>

                <div className="checkout-input-group">
                  <label className="checkout-input-label">Full Name / Lab Attn *</label>
                  <div className="checkout-input-control">
                    <User size={16} className="checkout-input-icon" />
                    <input 
                      type="text" 
                      value={form.fullName} 
                      onChange={update('fullName')} 
                      required 
                      className="checkout-field"
                      placeholder="Dr. Jane Doe"
                    />
                  </div>
                </div>

                <div className="checkout-input-group">
                  <label className="checkout-input-label">Street Address *</label>
                  <div className="checkout-input-control">
                    <MapPin size={16} className="checkout-input-icon" />
                    <input 
                      type="text" 
                      value={form.address1} 
                      onChange={update('address1')} 
                      required 
                      className="checkout-field"
                      placeholder="123 Research Parkway"
                    />
                  </div>
                </div>

                <div className="checkout-input-group">
                  <label className="checkout-input-label">Suite, Building, Lab Room (Optional)</label>
                  <div className="checkout-input-control">
                    <Building size={16} className="checkout-input-icon" />
                    <input 
                      type="text" 
                      value={form.address2} 
                      onChange={update('address2')} 
                      className="checkout-field"
                      placeholder="Lab Suite 4B"
                    />
                  </div>
                </div>

                <div className="checkout-input-row">
                  <div className="checkout-input-group">
                    <label className="checkout-input-label">City *</label>
                    <input 
                      type="text" 
                      value={form.city} 
                      onChange={update('city')} 
                      required 
                      className="checkout-field no-icon"
                      placeholder="Boston"
                    />
                  </div>

                  <div className="checkout-input-group">
                    <label className="checkout-input-label">State / Province *</label>
                    <input 
                      type="text" 
                      value={form.state} 
                      onChange={update('state')} 
                      required 
                      className="checkout-field no-icon"
                      placeholder="MA"
                    />
                  </div>
                </div>

                <div className="checkout-input-row">
                  <div className="checkout-input-group">
                    <label className="checkout-input-label">Postal / ZIP Code *</label>
                    <input 
                      type="text" 
                      value={form.postalCode} 
                      onChange={update('postalCode')} 
                      required 
                      className="checkout-field no-icon"
                      placeholder="02115"
                    />
                  </div>

                  <div className="checkout-input-group">
                    <label className="checkout-input-label">Country *</label>
                    <input 
                      type="text" 
                      value={form.country} 
                      onChange={update('country')} 
                      required 
                      className="checkout-field no-icon"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Shipping Method */}
              <div className="checkout-form-card">
                <div className="checkout-section-header">
                  <div className="checkout-section-badge">3</div>
                  <h2 className="checkout-section-title">Shipping Method</h2>
                </div>

                <div className="shipping-options-grid">
                  <div 
                    className={`shipping-option-card ${shippingMethod === 'express' ? 'selected' : ''}`}
                    onClick={() => setShippingMethod('express')}
                  >
                    <div className="shipping-option-radio" />
                    <div className="shipping-option-info">
                      <strong>Priority Express (Cold-Packed)</strong>
                      <span>2–3 Business Days • Discreet Thermal Pouch</span>
                    </div>
                    <div className="shipping-option-price">
                      {isFreeShipping ? <span style={{ color: '#34d399' }}>FREE</span> : '$9.99'}
                    </div>
                  </div>

                  <div 
                    className={`shipping-option-card ${shippingMethod === 'cold-chain' ? 'selected' : ''}`}
                    onClick={() => setShippingMethod('cold-chain')}
                  >
                    <div className="shipping-option-radio" />
                    <div className="shipping-option-info">
                      <strong>Insulated Cold-Chain Courier</strong>
                      <span>1–2 Days • Dry ice / active temp log</span>
                    </div>
                    <div className="shipping-option-price">
                      {isFreeShipping ? '$6.99' : '$14.99'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Payment Preference */}
              <div className="checkout-form-card">
                <div className="checkout-section-header">
                  <div className="checkout-section-badge">4</div>
                  <h2 className="checkout-section-title">Payment Preference</h2>
                </div>

                <div className="payment-methods-grid">
                  <div 
                    className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="shipping-option-radio" />
                    <CreditCard size={20} color="#f1f5f9" />
                    <div>
                      <strong style={{ fontSize: 14, display: 'block', color: '#f1f5f9' }}>Credit / Debit Card</strong>
                      <span style={{ fontSize: 12, color: '#a8adb4' }}>Discreet invoice link provided immediately on next screen</span>
                    </div>
                  </div>


                  <div
                    className={`payment-method-card ${paymentMethod === 'wire' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('wire')}
                  >
                    <div className="shipping-option-radio" />
                    <Building size={20} color="#f1f5f9" />
                    <div>
                      <strong style={{ fontSize: 14, display: 'block', color: '#f1f5f9' }}>Institutional Bank Wire / ACH / Zelle</strong>
                      <span style={{ fontSize: 12, color: '#a8adb4' }}>Wire instructions will be issued on the confirmation page</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: '#a8adb4', margin: 0, padding: '10px 12px', background: '#171b23', borderRadius: 8 }}>
                  🔒 <strong>Discreet Billing Guarantee:</strong> No compound names or research designations appear on your statement.
                </p>
              </div>

              {/* Card 5: Optional Laboratory Delivery Notes */}
              <div className="checkout-form-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <FileText size={16} color="#a8adb4" />
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>Order Notes (Optional)</h3>
                </div>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={update('notes')}
                  placeholder="e.g. Leave package at Building C security desk, gate passcode #1234..."
                  style={{ width: '100%', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

            </form>
          </div>

          {/* Right Column: Sticky Order Summary */}
          <div>
            <div className="modern-summary-card">
              <h2 className="summary-title">Order Review ({itemCount} {itemCount === 1 ? 'item' : 'items'})</h2>

              {/* Items Mini List */}
              <div className="checkout-items-list">
                {items.map((item) => (
                  <div key={item.id} className="checkout-item-mini">
                    <div className="checkout-item-mini-img">
                      <img 
                        src={resolveProductImage(item)} 
                        alt={item.name} 
                        onError={(e) => { e.currentTarget.src = '/images/fragment-1-300x300.webp'; }}
                      />
                      <span className="checkout-item-mini-qty">{item.quantity}</span>
                    </div>
                    <div className="checkout-item-mini-info">
                      <div className="checkout-item-mini-name">{item.name}</div>
                      <div className="checkout-item-mini-sku">SKU: {item.id.toUpperCase()}</div>
                    </div>
                    <div className="checkout-item-mini-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="summary-breakdown" style={{ marginTop: 14 }}>
                <div className="breakdown-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>


                <div className="breakdown-row">
                  <span>Shipping ({shippingMethod === 'cold-chain' ? 'Cold-Chain' : 'Express'})</span>
                  <span>{shippingFee === 0 ? <span className="free-shipping-tag">FREE</span> : `$${shippingFee.toFixed(2)}`}</span>
                </div>

                <div className="summary-divider" />

                <div className="breakdown-row total">
                  <span>Total Amount</span>
                  <span className="total-price">${finalTotal.toFixed(2)}</span>
                </div>
                <div className="currency-notice">All prices in USD. No hidden handling fees.</div>
              </div>

              {/* Submit Order Button */}
              <button 
                type="submit" 
                form="checkout-form"
                disabled={submitting}
                className="checkout-cta-btn"
                style={{ width: '100%', border: 'none', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                <Lock size={17} />
                <span>{submitting ? 'Placing Order...' : `Confirm & Place Order`}</span>
                <ArrowRight size={17} />
              </button>

              <Link 
                href="/cart" 
                className="btn btn-outline" 
                style={{ width: '100%', marginTop: 12, borderRadius: 12, fontSize: 13.5, borderColor: 'rgba(255,255,255,0.15)', boxSizing: 'border-box' }}
              >
                ← Return to Cart
              </Link>

              {/* Guarantees */}
              <div className="cart-trust-section">
                <div className="trust-item">
                  <ShieldCheck size={18} className="text-brand" />
                  <div>
                    <strong>Third-Party HPLC Certified</strong>
                    <span>≥99% Purity with batch documentation</span>
                  </div>
                </div>
                <div className="trust-item">
                  <Truck size={18} className="text-brand" />
                  <div>
                    <strong>Discreet Temperature Packaging</strong>
                    <span>Dispatched in unmarked sturdy boxes</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
