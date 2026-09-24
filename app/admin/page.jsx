'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import {
  Package,
  ShoppingBag,
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Plus,
  ExternalLink,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Sliders,
  AlertCircle,
  Truck,
  XCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, pending: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
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

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      const [{ count: productCount }, { data: orders }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      const allOrders = orders ?? [];
      const revenue = allOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const pending = allOrders.filter(
        (o) => (o.status || '').toLowerCase() === 'pending'
      ).length;

      setStats({
        products: productCount ?? 0,
        orders: allOrders.length,
        pending,
        revenue,
      });
      setRecentOrders(allOrders);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Order #${id.slice(0, 8).toUpperCase()} copied!`);
    setTimeout(() => {
      setCopiedId((c) => (c === id ? null : c));
    }, 2000);
  };

  // Filtered recent orders
  const filteredOrders = useMemo(() => {
    return recentOrders.filter((order) => {
      const status = (order.status || 'processing').toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesQuery =
        !query ||
        order.id.toLowerCase().includes(query) ||
        (order.full_name && order.full_name.toLowerCase().includes(query)) ||
        (order.email && order.email.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [recentOrders, statusFilter, searchQuery]);

  // Insights
  const aov = stats.orders > 0 ? (stats.revenue / stats.orders).toFixed(2) : '0.00';
  const deliveredCount = recentOrders.filter(
    (o) => (o.status || '').toLowerCase() === 'delivered'
  ).length;
  const fulfillmentRate =
    stats.orders > 0 ? Math.round((deliveredCount / stats.orders) * 100) : 100;

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

      {/* DASHBOARD HEADER */}
      <div className="admin-dash-header">
        <div className="admin-dash-title-group">
          <h1>Executive Dashboard</h1>
          <p className="admin-dash-subtitle">
            Real-time sales telemetry, order fulfillment, and catalog controls.
          </p>
        </div>

        <div className="admin-dash-actions">
          <button
            onClick={loadDashboardData}
            className="account-btn-secondary"
            disabled={refreshing}
            title="Refresh statistics"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link href="/admin/products" className="account-btn-primary">
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* METRICS / STATS GRID */}
      <div className="admin-stat-grid">
        {/* Revenue */}
        <motion.div
          className="admin-stat-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon emerald">
              <DollarSign size={22} />
            </div>
            <span className="admin-stat-pill success">+12.4%</span>
          </div>
          <div>
            <span className="stat-title">Gross Revenue</span>
            <div>
              <strong>{loading ? '—' : `$${stats.revenue.toFixed(2)}`}</strong>
            </div>
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          className="admin-stat-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon blue">
              <ShoppingBag size={22} />
            </div>
            <span className="admin-stat-pill neutral">{stats.orders} Total</span>
          </div>
          <div>
            <span className="stat-title">Orders Placed</span>
            <div>
              <strong>{loading ? '—' : stats.orders}</strong>
            </div>
          </div>
        </motion.div>

        {/* Pending Orders */}
        <motion.div
          className="admin-stat-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon amber">
              <Clock size={22} />
            </div>
            {stats.pending > 0 ? (
              <span className="admin-stat-pill warning">Action Needed</span>
            ) : (
              <span className="admin-stat-pill success">All Cleared</span>
            )}
          </div>
          <div>
            <span className="stat-title">Pending Orders</span>
            <div>
              <strong>{loading ? '—' : stats.pending}</strong>
            </div>
          </div>
        </motion.div>

        {/* Products in Catalog */}
        <motion.div
          className="admin-stat-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon purple">
              <Package size={22} />
            </div>
            <span className="admin-stat-pill neutral">Active SKU</span>
          </div>
          <div>
            <span className="stat-title">Catalog Products</span>
            <div>
              <strong>{loading ? '—' : stats.products}</strong>
            </div>
          </div>
        </motion.div>
      </div>

      {/* QUICK INSIGHTS BAR */}
      <div className="admin-quick-strip">
        <div className="admin-strip-title">
          <TrendingUp size={18} style={{ color: '#0066ff' }} />
          <span>Store Health: <strong>${aov}</strong> Avg Order Value &bull; <strong>{fulfillmentRate}%</strong> Fulfillment Rate</span>
        </div>

        <div className="admin-strip-actions">
          <Link href="/admin/orders" className="account-btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>
            <ShoppingBag size={14} />
            <span>Manage Orders</span>
          </Link>
          <Link href="/admin/homepage" className="account-btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>
            <Sliders size={14} />
            <span>Customize Home</span>
          </Link>
        </div>
      </div>

      {/* RECENT ORDERS TABLE SECTION */}
      <div className="admin-card-section">
        <div className="admin-card-section-header">
          <div>
            <h3>Recent Store Orders</h3>
            <p style={{ fontSize: 13, color: '#a8adb4', margin: '2px 0 0' }}>
              Showing latest {filteredOrders.length} customer purchases
            </p>
          </div>

          <div className="admin-table-controls">
            {/* Search Input */}
            <div className="admin-table-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search order or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Pills */}
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
                    ? 'All'
                    : st === 'completed'
                    ? 'Delivered'
                    : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>

            <Link href="/admin/orders" className="account-btn-secondary" style={{ padding: '7px 14px', fontSize: 12.5 }}>
              View All
            </Link>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="account-skeleton-box" style={{ height: 48, width: '100%' }} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertCircle size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', color: 'var(--color-ink)' }}>No Orders Matching</h4>
            <p style={{ fontSize: 13, color: '#a8adb4', margin: 0 }}>
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 8).map((order) => {
                  const status = (order.status || 'processing').toLowerCase();
                  const dateStr = new Date(order.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr key={order.id}>
                      <td>
                        <div className="admin-order-id-cell">
                          <span>#{order.id.slice(0, 8).toUpperCase()}</span>
                          <button
                            className="admin-copy-icon-btn"
                            onClick={() => handleCopyId(order.id)}
                            title="Copy Order ID"
                          >
                            {copiedId === order.id ? (
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
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: '#232830',
                              color: '#a8adb4',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          >
                            {(order.full_name || order.email || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 650 }}>{order.full_name || 'Guest Checkout'}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{order.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-table-status ${status}`}>
                          {(status === 'completed' || status === 'delivered') && <CheckCircle2 size={12} />}
                          {status === 'shipped' && <Truck size={12} />}
                          {status === 'processing' && <RefreshCw size={12} className="animate-spin" />}
                          {status === 'pending' && <Clock size={12} />}
                          {status === 'cancelled' && <XCircle size={12} />}
                          {status === 'completed' ? 'Delivered' : (order.status || 'Processing')}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-ink)' }}>
                          ${Number(order.total || 0).toFixed(2)}
                        </strong>
                      </td>
                      <td style={{ color: '#a8adb4', fontSize: 13 }}>
                        {dateStr}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href="/admin/orders"
                          className="account-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
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
