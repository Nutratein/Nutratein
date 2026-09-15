'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from '@/lib/promoCodes';
import {
  Tag,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  RefreshCw,
  Edit2,
  X,
  Check,
} from 'lucide-react';

const BLANK = { id: null, code: '', label: '', discount_percent: 10, is_active: true, max_uses: '', expires_at: '' };

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState(BLANK);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 2500);
  };

  async function load() {
    setLoading(true);
    try {
      setCodes(await getAllPromoCodes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setForm(BLANK);
    setError('');
    setShowDrawer(true);
  }

  function startEdit(c) {
    setForm({
      id: c.id,
      code: c.code,
      label: c.label || '',
      discount_percent: c.discount_percent,
      is_active: c.is_active,
      max_uses: c.max_uses ?? '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
    });
    setError('');
    setShowDrawer(true);
  }

  async function toggleActive(c) {
    setCodes((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
    const { error: err } = await updatePromoCode(c.id, { is_active: !c.is_active });
    if (err) {
      showToast('Failed to update status.');
      await load();
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.code.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        label: form.label.trim() || null,
        discount_percent: Number(form.discount_percent),
        is_active: !!form.is_active,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };
      const { error: err } = form.id
        ? await updatePromoCode(form.id, payload)
        : await createPromoCode(payload);
      if (err) throw err;

      showToast(form.id ? 'Promo code updated!' : `Promo code "${payload.code}" created!`);
      setShowDrawer(false);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save promo code (code may already exist).');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, code) {
    if (!window.confirm(`Delete promo code "${code}"? This cannot be undone.`)) return;
    try {
      const { error: err } = await deletePromoCode(id);
      if (err) throw err;
      showToast(`"${code}" deleted.`);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete.');
    }
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return codes.filter((c) => !q || c.code.toLowerCase().includes(q) || (c.label || '').toLowerCase().includes(q));
  }, [codes, searchQuery]);

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
          <h1>Promo Codes</h1>
          <p className="admin-dash-subtitle">
            Create and manage discount coupons customers can apply at checkout.
          </p>
        </div>

        <div className="admin-dash-actions">
          <button onClick={load} className="account-btn-secondary" title="Refresh">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button onClick={startNew} className="account-btn-primary">
            <Plus size={16} />
            <span>Add Promo Code</span>
          </button>
        </div>
      </div>

      <div className="admin-card-section">
        <div className="admin-card-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag size={18} style={{ color: 'var(--color-brand)' }} />
            <h3 style={{ margin: 0 }}>All Codes ({filtered.length})</h3>
          </div>
          <div className="admin-table-controls">
            <div className="admin-table-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search code or label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="account-skeleton-box" style={{ height: 50, width: '100%' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Tag size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <p style={{ color: '#a8adb4', fontSize: 14, marginBottom: 16 }}>No promo codes yet.</p>
            <button onClick={startNew} className="account-btn-primary">
              <Plus size={15} /> Add First Code
            </button>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Usage</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <code style={{ fontWeight: 700 }}>{c.code}</code>
                      {c.label && <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.label}</div>}
                    </td>
                    <td><strong>{Number(c.discount_percent)}%</strong></td>
                    <td style={{ fontSize: 13, color: '#a8adb4' }}>
                      {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td style={{ fontSize: 13, color: '#a8adb4' }}>
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleActive(c)}
                        style={{
                          border: 'none',
                          background: c.is_active ? 'rgba(52,211,153,0.15)' : '#232830',
                          color: c.is_active ? '#34d399' : '#a8adb4',
                          padding: '4px 10px',
                          borderRadius: 9999,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {c.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="account-btn-secondary"
                          style={{ padding: '5px 12px', fontSize: 12 }}
                          onClick={() => startEdit(c)}
                        >
                          <Edit2 size={13} /><span>Edit</span>
                        </button>
                        <button
                          className="admin-copy-icon-btn"
                          style={{ color: '#dc2626', padding: 6 }}
                          onClick={() => handleDelete(c.id, c.code)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDrawer && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
              zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: 'var(--color-surface)', borderRadius: 20, maxWidth: 480, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.55)', overflow: 'hidden' }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#171b23' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{form.id ? `Edit: ${form.code}` : 'Create Promo Code'}</h3>
                <button onClick={() => setShowDrawer(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a8adb4' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ padding: 24 }}>
                {error && (
                  <div style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Code *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. WELCOME10"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, textTransform: 'uppercase', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Label (Optional)</label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. Welcome Discount"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Discount (%) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="100"
                      value={form.discount_percent}
                      onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Max Uses (Optional)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.max_uses}
                      onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                      placeholder="Unlimited"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Expires On (Optional)</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="checkbox-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    <span style={{ fontWeight: 650 }}>Active (customers can use this code)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="account-btn-secondary" onClick={() => setShowDrawer(false)}>Cancel</button>
                  <button type="submit" className="account-btn-primary" disabled={saving}>
                    <Check size={16} />
                    <span>{saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Code'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
