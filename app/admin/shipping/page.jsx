'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getShippingSettings, saveShippingSettings, DEFAULT_SHIPPING_SETTINGS } from '@/lib/shippingSettings';
import { Truck, Save, CheckCircle2 } from 'lucide-react';

export default function AdminShipping() {
  const [shipping, setShipping] = useState(DEFAULT_SHIPPING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 2500);
  };

  useEffect(() => {
    getShippingSettings().then((s) => {
      setShipping(s);
      setLoading(false);
    });
  }, []);

  function updateShipping(field, val) {
    setShipping((s) => ({ ...s, [field]: Number(val) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await saveShippingSettings(shipping);
      if (error) throw error;
      showToast('Shipping settings updated live!');
    } catch (err) {
      showToast('Failed to save shipping settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2].map((i) => (
          <div key={i} className="account-skeleton-box" style={{ height: 50, width: '100%' }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="account-toast"
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="admin-dash-header">
        <div className="admin-dash-title-group">
          <h1>Shipping &amp; Fees</h1>
          <p className="admin-dash-subtitle">
            Shared by both the Cart and Checkout pages — change a number here once and it updates everywhere,
            instead of drifting out of sync.
          </p>
        </div>
      </div>

      <div className="admin-card-section" style={{ padding: '24px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Truck size={18} style={{ color: 'var(--color-brand)' }} />
          <h3 style={{ margin: 0 }}>Fee Configuration</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Free Shipping Threshold ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={shipping.free_shipping_threshold}
              onChange={(e) => updateShipping('free_shipping_threshold', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>Orders at or above this subtotal ship free.</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Standard / Express Fee ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={shipping.standard_fee}
              onChange={(e) => updateShipping('standard_fee', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Cold-Chain Fee ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={shipping.cold_chain_fee}
              onChange={(e) => updateShipping('cold_chain_fee', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>Charged when the order is below the free-shipping threshold.</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Cold-Chain Fee, Discounted ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={shipping.cold_chain_fee_discounted}
              onChange={(e) => updateShipping('cold_chain_fee_discounted', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>Charged for cold-chain shipping once the order already qualifies for free standard shipping.</p>
          </div>
        </div>

        <button className="account-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Shipping Settings'}</span>
        </button>
      </div>
    </div>
  );
}
