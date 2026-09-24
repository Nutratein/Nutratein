'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { getAllTopups, reviewTopup, getWalletSettings, saveWalletSettings } from '@/lib/wallet';
import {
  Wallet,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Settings,
  Save,
  X,
  Image as ImageIcon,
} from 'lucide-react';

export default function AdminWallet() {
  const [topups, setTopups] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 2500);
  };

  async function load() {
    setLoading(true);
    try {
      const data = await getAllTopups(statusFilter);
      setTopups(data);

      const userIds = [...new Set(data.map((t) => t.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        const map = {};
        (profiles || []).forEach((p) => { map[p.id] = p; });
        setProfilesById(map);
      }
    } catch (err) {
      console.error('Failed to load top-ups', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function openSettings() {
    const s = await getWalletSettings();
    setSettings(s);
    setShowSettings(true);
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { error } = await saveWalletSettings(settings);
      if (error) throw error;
      showToast('Wallet settings saved!');
      setShowSettings(false);
    } catch (err) {
      showToast(err.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleApprove(topup) {
    setBusyId(topup.id);
    try {
      const { error } = await reviewTopup(topup.id, true);
      if (error) throw error;
      showToast(`Approved ${topup.currency.toUpperCase()} ${Number(topup.amount).toFixed(2)} for wallet credit.`);
      await load();
    } catch (err) {
      showToast(err.message || 'Failed to approve top-up.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(topup) {
    setBusyId(topup.id);
    try {
      const { error } = await reviewTopup(topup.id, false, rejectNote);
      if (error) throw error;
      showToast('Top-up request rejected.');
      setRejectingId(null);
      setRejectNote('');
      await load();
    } catch (err) {
      showToast(err.message || 'Failed to reject top-up.');
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return topups.filter((t) => {
      const name = profilesById[t.user_id]?.full_name || '';
      return !q || name.toLowerCase().includes(q) || (t.reference_note || '').toLowerCase().includes(q);
    });
  }, [topups, searchQuery, profilesById]);

  const pendingCount = topups.filter((t) => t.status === 'pending').length;

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
          <h1>Wallet Top-ups</h1>
          <p className="admin-dash-subtitle">
            Review wire-transfer top-up requests and manage wallet bank details / exchange rate.
          </p>
        </div>

        <div className="admin-dash-actions">
          <button onClick={openSettings} className="account-btn-secondary">
            <Settings size={15} />
            <span>Wallet Settings</span>
          </button>
          <button onClick={load} className="account-btn-secondary" title="Refresh">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="admin-card-section" style={{ marginBottom: 24 }}>
        <div className="admin-card-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wallet size={18} style={{ color: 'var(--color-brand)' }} />
            <h3 style={{ margin: 0 }}>
              Requests ({filtered.length}){pendingCount > 0 && statusFilter !== 'pending' ? ` — ${pendingCount} pending` : ''}
            </h3>
          </div>

          <div className="admin-table-controls">
            <div className="admin-table-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by customer or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: '#171b23',
                outline: 'none',
              }}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
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
            <Wallet size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <p style={{ color: '#a8adb4', fontSize: 14 }}>No top-up requests found.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>{profilesById[t.user_id]?.full_name || t.user_id.slice(0, 8)}</td>
                    <td>
                      <strong>{t.currency.toUpperCase()} {Number(t.amount).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: t.method === 'etransfer' ? 'rgba(59,130,246,0.12)' : 'rgba(168,173,180,0.12)',
                          color: t.method === 'etransfer' ? '#3b82f6' : '#a8adb4',
                        }}
                      >
                        {t.method === 'etransfer' ? 'e-Transfer' : 'Wire'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: '#a8adb4' }}>
                      <div>{t.reference_note || '—'}</div>
                      {t.proof_url && (
                        <a
                          href={t.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--color-brand)', fontSize: 11.5, fontWeight: 700 }}
                        >
                          <ImageIcon size={12} /> View Proof
                        </a>
                      )}
                    </td>
                    <td style={{ fontSize: 12.5, color: '#a8adb4' }}>
                      {new Date(t.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <span className={`admin-table-status ${t.status === 'approved' ? 'delivered' : t.status === 'rejected' ? 'cancelled' : 'pending'}`}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {t.status === 'pending' ? (
                        rejectingId === t.id ? (
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            <input
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              placeholder="Reason (optional)"
                              style={{ padding: '5px 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--color-border)' }}
                            />
                            <button
                              className="account-btn-secondary"
                              style={{ padding: '5px 10px', fontSize: 12, color: '#dc2626' }}
                              onClick={() => handleReject(t)}
                              disabled={busyId === t.id}
                            >
                              Confirm Reject
                            </button>
                            <button
                              className="admin-copy-icon-btn"
                              onClick={() => { setRejectingId(null); setRejectNote(''); }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="account-btn-primary"
                              style={{ padding: '5px 12px', fontSize: 12 }}
                              onClick={() => handleApprove(t)}
                              disabled={busyId === t.id}
                            >
                              <CheckCircle2 size={13} />
                              <span>{busyId === t.id ? 'Working...' : 'Approve'}</span>
                            </button>
                            <button
                              className="account-btn-secondary"
                              style={{ padding: '5px 12px', fontSize: 12, color: '#dc2626' }}
                              onClick={() => setRejectingId(t.id)}
                              disabled={busyId === t.id}
                            >
                              <XCircle size={13} />
                              <span>Reject</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {t.reviewed_at ? new Date(t.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WALLET SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && settings && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              overflowY: 'auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                background: 'var(--color-surface)',
                borderRadius: 20,
                maxWidth: 640,
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#171b23',
                }}
              >
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Wallet Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a8adb4' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} style={{ overflowY: 'auto', padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                    CAD → USD Exchange Rate
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.cad_to_usd_rate}
                    onChange={(e) => setSettings({ ...settings, cad_to_usd_rate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 0' }}>
                    A $1 USD order deducts this many CAD from a customer&apos;s CAD wallet. Update periodically to match current bank rates.
                  </p>
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', color: 'var(--color-brand)' }}>Top-up Limits</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: '#94a3b8', marginBottom: 4 }}>Min USD Top-up</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.min_topup_usd}
                      onChange={(e) => setSettings({ ...settings, min_topup_usd: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: '#94a3b8', marginBottom: 4 }}>Max USD Top-up</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.max_topup_usd}
                      onChange={(e) => setSettings({ ...settings, max_topup_usd: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: '#94a3b8', marginBottom: 4 }}>Min CAD Top-up</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.min_topup_cad}
                      onChange={(e) => setSettings({ ...settings, min_topup_cad: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, color: '#94a3b8', marginBottom: 4 }}>Max CAD Top-up</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.max_topup_cad}
                      onChange={(e) => setSettings({ ...settings, max_topup_cad: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', color: 'var(--color-brand)' }}>USD Wire Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {['bank_name', 'account_name', 'account_number', 'routing_number', 'swift'].map((field) => (
                    <input
                      key={field}
                      value={settings.usd_bank?.[field] || ''}
                      onChange={(e) => setSettings({ ...settings, usd_bank: { ...settings.usd_bank, [field]: e.target.value } })}
                      placeholder={field.replace(/_/g, ' ')}
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, textTransform: 'capitalize' }}
                    />
                  ))}
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', color: 'var(--color-brand)' }}>USD e-Transfer Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                  <input
                    type="email"
                    value={settings.usd_etransfer?.email || ''}
                    onChange={(e) => setSettings({ ...settings, usd_etransfer: { ...settings.usd_etransfer, email: e.target.value } })}
                    placeholder="e-transfer email"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
                  />
                  <input
                    value={settings.usd_etransfer?.recipient_name || ''}
                    onChange={(e) => setSettings({ ...settings, usd_etransfer: { ...settings.usd_etransfer, recipient_name: e.target.value } })}
                    placeholder="recipient name"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
                  />
                  <input
                    value={settings.usd_etransfer?.security_question || ''}
                    onChange={(e) => setSettings({ ...settings, usd_etransfer: { ...settings.usd_etransfer, security_question: e.target.value } })}
                    placeholder="security question"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
                  />
                  <input
                    value={settings.usd_etransfer?.security_answer || ''}
                    onChange={(e) => setSettings({ ...settings, usd_etransfer: { ...settings.usd_etransfer, security_answer: e.target.value } })}
                    placeholder="security answer"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
                  />
                </div>
                <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '0 0 20px' }}>
                  Shown to customers topping up their USD wallet who choose e-Transfer instead of a bank wire.
                </p>

                <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', color: 'var(--color-brand)' }}>CAD Wire Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {['bank_name', 'account_name', 'account_number', 'transit_number', 'institution_number', 'swift'].map((field) => (
                    <input
                      key={field}
                      value={settings.cad_bank?.[field] || ''}
                      onChange={(e) => setSettings({ ...settings, cad_bank: { ...settings.cad_bank, [field]: e.target.value } })}
                      placeholder={field.replace(/_/g, ' ')}
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, textTransform: 'capitalize' }}
                    />
                  ))}
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', color: 'var(--color-brand)' }}>CAD Interac e-Transfer Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                  <input
                    type="email"
                    value={settings.cad_etransfer?.email || ''}
                    onChange={(e) => setSettings({ ...settings, cad_etransfer: { ...settings.cad_etransfer, email: e.target.value } })}
                    placeholder="e-transfer email"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
                  />
                  <input
                    value={settings.cad_etransfer?.recipient_name || ''}
                    onChange={(e) => setSettings({ ...settings, cad_etransfer: { ...settings.cad_etransfer, recipient_name: e.target.value } })}
                    placeholder="recipient name"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
                  />
                  <input
                    value={settings.cad_etransfer?.security_question || ''}
                    onChange={(e) => setSettings({ ...settings, cad_etransfer: { ...settings.cad_etransfer, security_question: e.target.value } })}
                    placeholder="security question"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
                  />
                  <input
                    value={settings.cad_etransfer?.security_answer || ''}
                    onChange={(e) => setSettings({ ...settings, cad_etransfer: { ...settings.cad_etransfer, security_answer: e.target.value } })}
                    placeholder="security answer"
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
                  />
                </div>
                <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '0 0 20px' }}>
                  Shown to customers topping up their CAD wallet who choose Interac e-Transfer instead of a bank wire.
                </p>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                    Customer Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={settings.instructions || ''}
                    onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="account-btn-secondary" onClick={() => setShowSettings(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="account-btn-primary" disabled={savingSettings}>
                    <Save size={16} />
                    <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
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
