'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCart, resolveProductImage } from '@/context/CartContext';
import { supabase } from '@/lib/supabaseClient';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import { PRODUCTS } from '@/lib/shopData';
import {
  Package,
  User,
  MapPin,
  Sparkles,
  LogOut,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Search,
  ArrowRight,
  Tag,
  Award,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';

function AccountContent() {
  const { user, profile, signOut } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile' | 'addresses' | 'perks'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Trigger temporary toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Fetch orders for this user
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        let query = supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });

        if (user.id || user.email) {
          query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
        }

        const { data, error } = await query;
        if (error) {
          // Fallback if OR filter has syntax limitation in specific RLS setups
          const { data: fallbackData } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });
          if (isMounted) setOrders(fallbackData ?? []);
        } else {
          if (isMounted) setOrders(data ?? []);
        }
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Sign out handler
  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      setIsLoggingOut(false);
      showToast('Error signing out. Please try again.');
    }
  };

  // Copy order ID
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Order #${id.slice(0, 8).toUpperCase()} copied to clipboard!`);
    setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2500);
  };

  // Reorder product
  const handleReorderItem = (item) => {
    const imageUrl = resolveProductImage(item);
    const rawName = (item?.product_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = PRODUCTS.find((p) => {
      const pClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const pSlug = p.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      return pClean === rawName || pSlug === rawName || pClean.includes(rawName) || rawName.includes(pClean);
    });

    addItem(
      {
        id: item.product_id || matched?.id || item.id,
        name: item.product_name,
        price: item.unit_price,
        slug: item.product_slug || matched?.slug || 'frag-176-191',
        image_url: imageUrl,
      },
      item.quantity || 1
    );
    showToast(`Added "${item.product_name}" to your cart!`);
  };

  // User details computed
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Nutratein Athlete');

  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'N';

  // Stats calculation
  const totalOrdersCount = orders.length;
  const totalSpent = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status &&
        !['delivered', 'completed', 'cancelled'].includes(o.status.toLowerCase())
    ).length;
  }, [orders]);

  const nutraPoints = Math.floor(totalSpent * 10) + 150; // Base welcome bonus + 10x per dollar

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (order.status || '').toLowerCase() === statusFilter.toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_items?.some((i) =>
          i.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Extract address if available from orders
  const latestShippingAddress = orders.find((o) => o.shipping_address)?.shipping_address;

  return (
    <div className="account-dashboard-wrapper">
      {/* Ambient background glows */}
      <div className="account-ambient-glow account-ambient-glow-1" />
      <div className="account-ambient-glow account-ambient-glow-2" />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="account-toast"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle2 size={18} className="text-brand" style={{ color: '#c8102e' }} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="account-container">
        {/* HERO BANNER */}
        <motion.div
          className="account-hero"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="account-profile-summary">
            <div className="account-avatar-wrapper">
              <div className="account-avatar">{userInitials}</div>
              <span className="account-status-dot" title="Active member" />
            </div>

            <div className="account-meta">
              <h1>{displayName}</h1>
              <div className="account-email">
                <ShieldCheck size={16} style={{ color: '#10b981' }} />
                <span>{user?.email}</span>
              </div>
              <span className="account-badge-pill">
                <Sparkles size={13} />
                Nutratein Elite Club
              </span>
            </div>
          </div>

          <div className="account-hero-actions">
            <Link href="/shop" className="account-btn-primary">
              <ShoppingBag size={16} />
              <span>Shop</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="account-btn-danger"
              disabled={isLoggingOut}
            >
              <LogOut size={16} />
              <span>{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
            </button>
          </div>
        </motion.div>

        {/* QUICK STATS RIBBON */}
        <div className="account-stats-grid">
          <motion.div
            className="account-stat-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <div className="account-stat-icon red">
              <Package size={22} />
            </div>
            <div>
              <div className="account-stat-label">Total Orders</div>
              <div className="account-stat-value">{loading ? '—' : totalOrdersCount}</div>
            </div>
          </motion.div>

          <motion.div
            className="account-stat-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="account-stat-icon emerald">
              <DollarSign size={22} />
            </div>
            <div>
              <div className="account-stat-label">Total Spent</div>
              <div className="account-stat-value">
                {loading ? '—' : `$${totalSpent.toFixed(2)}`}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="account-stat-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="account-stat-icon blue">
              <Truck size={22} />
            </div>
            <div>
              <div className="account-stat-label">In Transit</div>
              <div className="account-stat-value">
                {loading ? '—' : activeOrdersCount}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="account-stat-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="account-stat-icon amber">
              <Award size={22} />
            </div>
            <div>
              <div className="account-stat-label">NutraPoints</div>
              <div className="account-stat-value">
                {loading ? '—' : nutraPoints.toLocaleString()}
              </div>
            </div>
          </motion.div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="account-tabs-wrapper">
          <button
            className={`account-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={17} />
            <span>Order History</span>
            <span className="account-tab-count">{orders.length}</span>
          </button>

          <button
            className={`account-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={17} />
            <span>Profile & Security</span>
          </button>

          <button
            className={`account-tab ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={17} />
            <span>Saved Addresses</span>
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter & Search Bar */}
            <div className="account-orders-bar">
              <div className="account-search-box">
                <Search size={16} className="account-search-icon" />
                <input
                  type="text"
                  placeholder="Search by Order ID or Product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="account-search-input"
                />
              </div>

              <div className="account-status-pills">
                {['all', 'delivered', 'processing', 'pending'].map((st) => (
                  <button
                    key={st}
                    className={`account-status-pill-btn ${
                      statusFilter === st ? 'active' : ''
                    }`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st === 'all'
                      ? 'All Orders'
                      : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Content */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="account-skeleton-box"
                    style={{ height: 160, width: '100%' }}
                  />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <motion.div
                className="account-empty-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="account-empty-icon">
                  <ShoppingBag size={34} />
                </div>
                <h3>No Orders Found</h3>
                <p>
                  {searchQuery || statusFilter !== 'all'
                    ? 'No orders match your search or filter criteria. Try resetting filters.'
                    : "You haven't placed any nutrition orders yet. Fuel your body with our premium protein blends and science-backed supplements."}
                </p>
                <Link href="/shop" className="account-btn-primary" style={{ display: 'inline-flex' }}>
                  <span>Explore Nutratein Shop</span>
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            ) : (
              <div>
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  const status = (order.status || 'processing').toLowerCase();
                  const totalItems =
                    order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                  return (
                    <motion.div
                      key={order.id}
                      className="account-order-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Order Header */}
                      <div className="account-order-header">
                        <div className="account-order-id-group">
                          <span className="account-order-id-text">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <button
                            className="account-copy-id-btn"
                            onClick={() => handleCopyId(order.id)}
                            title="Copy Order ID"
                          >
                            {copiedId === order.id ? (
                              <Check size={15} style={{ color: '#10b981' }} />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                          <span className="account-order-date">
                            <Calendar size={13} />
                            {orderDate}
                          </span>
                        </div>

                        <div className="account-order-header-right">
                          <span className={`account-status-tag ${status}`}>
                            {status === 'delivered' && <CheckCircle2 size={13} />}
                            {status === 'processing' && <Clock size={13} />}
                            {status === 'pending' && <Truck size={13} />}
                            {order.status || 'Processing'}
                          </span>
                          <span className="account-order-total-highlight">
                            ${Number(order.total).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items Summary Preview */}
                      <div className="account-order-items">
                        {order.order_items?.map((item) => {
                          const itemImg = resolveProductImage(item);

                          return (
                            <div key={item.id} className="account-order-item-row">
                              <div className="account-order-item-info">
                                <div 
                                  className="account-item-icon-box" 
                                  style={{ 
                                    width: 44, 
                                    height: 44, 
                                    overflow: 'hidden', 
                                    padding: 3, 
                                    background: '#171b23',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0 
                                  }}
                                >
                                  <img 
                                    src={itemImg} 
                                    alt={item.product_name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={(e) => { e.currentTarget.src = '/images/fragment-1-300x300.webp'; }}
                                  />
                                </div>
                                <div>
                                  <span className="account-order-item-name">
                                    {item.product_name}
                                  </span>
                                  <span className="account-order-item-qty">
                                    &times; {item.quantity}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className="account-order-item-price">
                                  ${Number(item.line_total).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => handleReorderItem(item)}
                                  className="account-btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: 12 }}
                                  title="Re-order this item"
                                >
                                  Reorder
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Expandable Accordion with Delivery Timeline & Address */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className="account-order-details-pane"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            {/* Visual Delivery Timeline */}
                            <div className="account-timeline-box">
                              <div className="account-timeline-title">Shipment Progress</div>
                              <div className="account-order-timeline">
                                <div className="account-timeline-step">
                                  <div className="account-step-bubble completed">
                                    <Check size={14} />
                                  </div>
                                  <span className="account-step-label">Placed</span>
                                </div>
                                <div className="account-timeline-step">
                                  <div
                                    className={`account-step-bubble ${
                                      status !== 'pending' ? 'completed' : 'current'
                                    }`}
                                  >
                                    <Clock size={14} />
                                  </div>
                                  <span className="account-step-label">Confirmed</span>
                                </div>
                                <div className="account-timeline-step">
                                  <div
                                    className={`account-step-bubble ${
                                      status === 'delivered'
                                        ? 'completed'
                                        : status === 'processing'
                                        ? 'current'
                                        : ''
                                    }`}
                                  >
                                    <Truck size={14} />
                                  </div>
                                  <span className="account-step-label">Shipped</span>
                                </div>
                                <div className="account-timeline-step">
                                  <div
                                    className={`account-step-bubble ${
                                      status === 'delivered' ? 'completed' : ''
                                    }`}
                                  >
                                    <CheckCircle2 size={14} />
                                  </div>
                                  <span className="account-step-label">Delivered</span>
                                </div>
                              </div>
                            </div>

                            {/* Shipping Details */}
                            <div className="account-shipping-info-grid">
                              <div>
                                <div className="account-info-block-title">
                                  Shipping Destination
                                </div>
                                <div className="account-info-block-content">
                                  <strong>{order.full_name || displayName}</strong>
                                  <br />
                                  {order.shipping_address ? (
                                    <>
                                      {order.shipping_address.address1}
                                      {order.shipping_address.address2
                                        ? `, ${order.shipping_address.address2}`
                                        : ''}
                                      <br />
                                      {order.shipping_address.city},{' '}
                                      {order.shipping_address.state}{' '}
                                      {order.shipping_address.postal_code}
                                      <br />
                                      {order.shipping_address.country}
                                    </>
                                  ) : (
                                    <span style={{ color: '#94a3b8' }}>
                                      Standard Express Delivery
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="account-info-block-title">
                                  Order Reference & Contact
                                </div>
                                <div className="account-info-block-content">
                                  <div>Email: {order.email || user?.email}</div>
                                  {order.phone && <div>Phone: {order.phone}</div>}
                                  {order.notes && (
                                    <div style={{ marginTop: 4 }}>
                                      <em>Note: {order.notes}</em>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Card Footer Actions */}
                      <div className="account-order-footer">
                        <button
                          className="account-toggle-details-btn"
                          onClick={() =>
                            setExpandedOrderId(isExpanded ? null : order.id)
                          }
                        >
                          <span>{isExpanded ? 'Hide Details' : 'View Details & Tracking'}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <div className="account-order-card-buttons">
                          <Link
                            href={`/order-confirmation/${order.id}`}
                            className="account-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: 12.5 }}
                          >
                            Order Receipt
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <motion.div
            className="account-profile-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="account-card-panel">
              <div className="account-panel-header">
                <div className="account-panel-title">
                  <User size={18} className="text-brand" style={{ color: '#c8102e' }} />
                  <span>Personal Details</span>
                </div>
              </div>

              <div className="account-data-row">
                <span className="account-data-label">Full Name</span>
                <span className="account-data-val">{displayName}</span>
              </div>
              <div className="account-data-row">
                <span className="account-data-label">Email Address</span>
                <span className="account-data-val">{user?.email}</span>
              </div>
              <div className="account-data-row">
                <span className="account-data-label">Account ID</span>
                <span className="account-data-val font-mono">
                  {user?.id ? `${user.id.slice(0, 12)}...` : 'Active'}
                </span>
              </div>
              <div className="account-data-row">
                <span className="account-data-label">Membership Status</span>
                <span className="account-data-val" style={{ color: '#34d399' }}>
                  Verified Active
                </span>
              </div>
              <div className="account-data-row">
                <span className="account-data-label">Tier</span>
                <span className="account-data-val">Nutratein Elite Athlete</span>
              </div>

              <div style={{ marginTop: 20 }}>
                <button
                  className="account-btn-secondary"
                  onClick={() => showToast('Profile details are synchronized with Supabase!')}
                >
                  Edit Profile Info
                </button>
              </div>
            </div>

            <div className="account-card-panel">
              <div className="account-panel-header">
                <div className="account-panel-title">
                  <ShieldCheck size={18} className="text-brand" style={{ color: '#c8102e' }} />
                  <span>Security & Credentials</span>
                </div>
              </div>

              <div className="account-data-row">
                <span className="account-data-label">Password Protection</span>
                <span className="account-data-val">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
              </div>
              <div className="account-data-row">
                <span className="account-data-label">Authentication Method</span>
                <span className="account-data-val">Encrypted Supabase Auth</span>
              </div>
              <div className="account-data-row">
                <span className="account-data-label">Session Status</span>
                <span className="account-data-val" style={{ color: '#34d399' }}>
                  Secure SSL Protected
                </span>
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/contact-us" className="account-btn-secondary">
                  Request Password Reset
                </Link>
                <button onClick={handleSignOut} className="account-btn-danger">
                  End Active Session
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: SAVED ADDRESSES */}
        {activeTab === 'addresses' && (
          <motion.div
            className="account-card-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="account-panel-header">
              <div className="account-panel-title">
                <MapPin size={18} className="text-brand" style={{ color: '#c8102e' }} />
                <span>Default Shipping Address</span>
              </div>
              <span className="account-badge-pill">Primary</span>
            </div>

            {latestShippingAddress ? (
              <div style={{ lineHeight: 1.7, fontSize: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  {displayName}
                </div>
                <div>{latestShippingAddress.address1}</div>
                {latestShippingAddress.address2 && (
                  <div>{latestShippingAddress.address2}</div>
                )}
                <div>
                  {latestShippingAddress.city}, {latestShippingAddress.state}{' '}
                  {latestShippingAddress.postal_code}
                </div>
                <div>{latestShippingAddress.country}</div>
              </div>
            ) : (
              <p style={{ color: '#a8adb4', fontSize: 14 }}>
                You haven&apos;t saved a shipping address yet. Your address will be automatically
                remembered when you place your next checkout order.
              </p>
            )}

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <Link href="/shop" className="account-btn-primary">
                Order to this Address
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function Account() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}
