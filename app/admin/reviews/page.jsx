'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Search,
  Filter,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 2500);
  };

  const loadReviews = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/reviews?admin=true');
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
        showToast(`Review ${status === 'approved' ? 'Approved & Accepted' : 'Rejected'}!`);
      }
    } catch (err) {
      showToast('Error updating review status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        showToast('Review deleted successfully.');
      }
    } catch (err) {
      showToast('Error deleting review.');
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        (r.product_name && r.product_name.toLowerCase().includes(q)) ||
        (r.user_name && r.user_name.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [reviews, filterStatus, searchQuery]);

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;

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
          <h1>Customer Reviews Moderation</h1>
          <p className="admin-dash-subtitle">
            Review, approve or reject customer feedback before it publishes to the storefront.
          </p>
        </div>

        <div className="admin-dash-actions">
          <button
            onClick={loadReviews}
            className="account-btn-secondary"
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon amber">
              <Clock size={20} />
            </div>
            {pendingCount > 0 ? (
              <span className="admin-stat-pill warning">Needs Action</span>
            ) : (
              <span className="admin-stat-pill success">All Reviewed</span>
            )}
          </div>
          <div>
            <span className="stat-title">Pending Approvals</span>
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
            <span className="admin-stat-pill success">Live on Store</span>
          </div>
          <div>
            <span className="stat-title">Approved Reviews</span>
            <div>
              <strong>{approvedCount}</strong>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon blue">
              <MessageSquare size={20} />
            </div>
            <span className="admin-stat-pill neutral">Total</span>
          </div>
          <div>
            <span className="stat-title">Total Submissions</span>
            <div>
              <strong>{reviews.length}</strong>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon purple">
              <Star size={20} />
            </div>
            <span className="admin-stat-pill neutral">Quality</span>
          </div>
          <div>
            <span className="stat-title">Default Setting</span>
            <div>
              <strong style={{ fontSize: 18 }}>0 by Default</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Review List Card */}
      <div className="admin-card-section">
        <div className="admin-card-section-header">
          <div className="admin-table-controls" style={{ width: '100%', justifyContent: 'space-between' }}>
            {/* Search */}
            <div className="admin-table-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search reviews, product, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="account-status-pills">
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  className={`account-status-pill-btn ${
                    filterStatus === st ? 'active' : ''
                  }`}
                  onClick={() => setFilterStatus(st)}
                >
                  {st === 'all'
                    ? `All (${reviews.length})`
                    : `${st.charAt(0).toUpperCase() + st.slice(1)} (${
                        reviews.filter((r) => r.status === st).length
                      })`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="account-skeleton-box" style={{ height: 90, width: '100%' }} />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertCircle size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', color: 'var(--color-ink)' }}>No Reviews Found</h4>
            <p style={{ fontSize: 13, color: '#a8adb4', margin: 0 }}>
              {searchQuery || filterStatus !== 'all'
                ? 'No reviews match your filter criteria.'
                : 'All product reviews are currently set to 0. When customers submit a review on a product page, it will appear here for your approval!'}
            </p>
          </div>
        ) : (
          <div style={{ padding: '12px 20px' }}>
            {filteredReviews.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.user_name}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`admin-table-status ${
                        r.status === 'approved'
                          ? 'delivered'
                          : r.status === 'pending'
                          ? 'pending'
                          : 'cancelled'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          fill={s <= r.rating ? '#dc2626' : '#2a2e37'}
                          stroke={s <= r.rating ? '#dc2626' : '#454a56'}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{r.rating}/5</span>
                    <span style={{ fontSize: 12, color: '#a8adb4' }}>
                      on <strong>{r.product_name || 'Product'}</strong>
                    </span>
                  </div>

                  <p style={{ fontSize: 13.5, color: 'var(--color-ink)', margin: 0, lineHeight: 1.5 }}>
                    &ldquo;{r.comment}&rdquo;
                  </p>
                </div>

                {/* Moderation Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {r.status !== 'approved' && (
                    <button
                      className="account-btn-primary"
                      style={{ padding: '6px 14px', fontSize: 12.5, background: '#059669' }}
                      onClick={() => handleUpdateStatus(r.id, 'approved')}
                      title="Accept and publish to product page"
                    >
                      <CheckCircle2 size={14} />
                      <span>Accept / Approve</span>
                    </button>
                  )}

                  {r.status !== 'rejected' && (
                    <button
                      className="account-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 12.5, color: '#dc2626' }}
                      onClick={() => handleUpdateStatus(r.id, 'rejected')}
                      title="Reject review"
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    className="admin-copy-icon-btn"
                    style={{ padding: 8, color: '#94a3b8' }}
                    onClick={() => handleDelete(r.id)}
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
