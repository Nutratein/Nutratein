'use client';

import { Fragment, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveProductImage } from '@/context/CartContext';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Package,
  AlertCircle
} from 'lucide-react';

const STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 2500);
  };

  async function load() {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data ?? []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      showToast(`Order #${id.slice(0, 8).toUpperCase()} updated to "${status}"`);
    } catch (err) {
      showToast('Failed to update status in Supabase.');
    }
  }

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Order #${id.slice(0, 8).toUpperCase()} copied!`);
    setTimeout(() => {
      setCopiedId((c) => (c === id ? null : c));
    }, 2000);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === 'all' || (o.status || '').toLowerCase() === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.full_name && o.full_name.toLowerCase().includes(q)) ||
        (o.email && o.email.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [orders]);

  const pendingCount = orders.filter((o) => (o.status || '').toLowerCase() === 'pending').length;
  const processingCount = orders.filter((o) => (o.status || '').toLowerCase() === 'processing').length;
  const completedCount = orders.filter((o) => ['completed', 'delivered'].includes((o.status || '').toLowerCase())).length;

  return (
    <div>
      {/* Toast Alert */}
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

      {/* Header */}
      <div className="admin-dash-header">
        <div className="admin-dash-title-group">
          <h1>Orders Fulfillment & Management</h1>
          <p className="admin-dash-subtitle">
            Update order dispatch stages in real-time. Status changes reflect in customer dashboards instantly.
          </p>
        </div>

        <div className="admin-dash-actions">
          <button onClick={load} className="account-btn-secondary" disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon blue">
              <ShoppingBag size={20} />
            </div>
            <span className="admin-stat-pill neutral">Total</span>
          </div>
          <div>
            <span className="stat-title">Total Orders</span>
            <div>
              <strong>{orders.length}</strong>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon amber">
              <Clock size={20} />
            </div>
            {pendingCount > 0 ? (
              <span className="admin-stat-pill warning">Action Needed</span>
            ) : (
              <span className="admin-stat-pill success">All Clear</span>
            )}
          </div>
          <div>
            <span className="stat-title">Pending Orders</span>
            <div>
              <strong>{pendingCount}</strong>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon emerald">
              <CheckCircle2 size={20} />
            </div>
            <span className="admin-stat-pill success">Shipped/Done</span>
          </div>
          <div>
            <span className="stat-title">Completed Orders</span>
            <div>
              <strong>{completedCount}</strong>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon purple">
              <Package size={20} />
            </div>
            <span className="admin-stat-pill neutral">Revenue</span>
          </div>
          <div>
            <span className="stat-title">Gross Volume</span>
            <div>
              <strong>${totalRevenue.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="admin-card-section">
        <div className="admin-card-section-header">
          <div className="admin-table-controls" style={{ width: '100%', justifyContent: 'space-between' }}>
            {/* Search */}
            <div className="admin-table-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search order ID, customer name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="account-status-pills">
              {['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  className={`account-status-pill-btn ${
                    statusFilter === st ? 'active' : ''
                  }`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'all'
                    ? `All (${orders.length})`
                    : `${st.charAt(0).toUpperCase() + st.slice(1)} (${
                        orders.filter((o) => (o.status || '').toLowerCase() === st).length
                      })`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="account-skeleton-box" style={{ height: 52, width: '100%' }} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertCircle size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', color: 'var(--color-ink)' }}>No Orders Matching</h4>
            <p style={{ fontSize: 13, color: '#a8adb4', margin: 0 }}>
              Try adjusting your search query or filter selection.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status &amp; Actions</th>
                  <th style={{ textAlign: 'right' }}>Items Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const isExp = expanded === o.id;
                  const dateStr = new Date(o.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <Fragment key={o.id}>
                      <tr>
                        <td>
                          <div className="admin-order-id-cell">
                            <span>#{o.id.slice(0, 8).toUpperCase()}</span>
                            <button
                              className="admin-copy-icon-btn"
                              onClick={() => handleCopyId(o.id)}
                              title="Copy Order ID"
                            >
                              {copiedId === o.id ? (
                                <Check size={13} style={{ color: '#10b981' }} />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: '#232830',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 12,
                                color: '#a8adb4',
                              }}
                            >
                              {(o.full_name || o.email || 'C')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 650 }}>{o.full_name || 'Guest'}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>{o.email}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ fontSize: 13, color: '#a8adb4' }}>{dateStr}</td>

                        <td>
                          <strong style={{ color: 'var(--color-ink)', fontSize: 14 }}>
                            ${Number(o.total).toFixed(2)}
                          </strong>
                        </td>

                        <td>
                          <select
                            value={o.status || 'pending'}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            style={{
                              padding: '5px 10px',
                              fontSize: 12.5,
                              fontWeight: 650,
                              borderRadius: 8,
                              border: '1.5px solid var(--color-border)',
                              background: '#171b23',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="account-btn-secondary"
                            style={{ padding: '5px 12px', fontSize: 12 }}
                            onClick={() => setExpanded(isExp ? null : o.id)}
                          >
                            <span>{isExp ? 'Hide Details' : `View Items (${o.order_items?.length || 0})`}</span>
                            {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Items & Address Accordion */}
                      {isExp && (
                        <tr>
                          <td colSpan={6} style={{ background: '#171b23', padding: '18px 24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                              <div>
                                <h4 style={{ margin: '0 0 10px', fontSize: 13, textTransform: 'uppercase', color: '#a8adb4', letterSpacing: '0.04em' }}>
                                  Line Items ({o.order_items?.length || 0})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {o.order_items?.map((item) => {
                                    const itemImg = resolveProductImage(item);
                                    return (
                                      <div
                                        key={item.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: 12,
                                          fontSize: 13.5,
                                          background: '#12151b',
                                          padding: '8px 12px',
                                          borderRadius: 8,
                                          border: '1px solid var(--color-border)',
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                          <div
                                            style={{
                                              width: 38,
                                              height: 38,
                                              borderRadius: 6,
                                              background: '#171b23',
                                              border: '1px solid var(--color-border)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              overflow: 'hidden',
                                              padding: 2,
                                              flexShrink: 0,
                                            }}
                                          >
                                            <img
                                              src={itemImg}
                                              alt={item.product_name}
                                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                              onError={(e) => { e.currentTarget.src = '/images/fragment-1-300x300.webp'; }}
                                            />
                                          </div>
                                          <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: '#f1f5f9' }}>
                                              {item.product_name}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#a8adb4' }}>
                                              Qty: {item.quantity} &bull; ${Number(item.unit_price || 0).toFixed(2)} each
                                            </div>
                                          </div>
                                        </div>
                                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>
                                          ${Number(item.line_total).toFixed(2)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <h4 style={{ margin: '0 0 10px', fontSize: 13, textTransform: 'uppercase', color: '#a8adb4', letterSpacing: '0.04em' }}>
                                  Shipping Address &amp; Contact
                                </h4>
                                <div style={{ background: '#12151b', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, lineHeight: 1.6 }}>
                                  {o.shipping_address ? (
                                    <>
                                      <div>{o.shipping_address.address1}</div>
                                      {o.shipping_address.address2 && <div>{o.shipping_address.address2}</div>}
                                      <div>
                                        {o.shipping_address.city}, {o.shipping_address.state}{' '}
                                        {o.shipping_address.postal_code}
                                      </div>
                                      <div>{o.shipping_address.country}</div>
                                    </>
                                  ) : (
                                    <span style={{ color: '#94a3b8' }}>Standard Ground Delivery</span>
                                  )}
                                  {o.phone && <div style={{ marginTop: 4 }}>Phone: {o.phone}</div>}
                                  {o.notes && (
                                    <div style={{ marginTop: 6, color: '#dc2626' }}>
                                      <em>Notes: {o.notes}</em>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
