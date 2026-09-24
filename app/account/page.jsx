'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCart, resolveProductImage } from '@/context/CartContext';
import { supabase } from '@/lib/supabaseClient';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import { PRODUCTS } from '@/lib/shopData';
import { getWallet, getWalletTransactions, getWalletTopups, createTopupRequest, getWalletSettings } from '@/lib/wallet';
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
  ArrowLeftRight,
  Tag,
  Award,
  DollarSign,
  Calendar,
  AlertCircle,
  Wallet,
  Plus,
  X,
  Building,
  ArrowDownCircle,
  ArrowUpCircle,
  XCircle,
  Info,
  RefreshCw,
} from 'lucide-react';

// Real order.status values (see supabase/schema.sql): pending, processing, shipped, completed, cancelled.
// "Delivered" is a customer-facing label for the "completed" status in Supabase.
const ORDER_STATUS_META = {
  pending: { label: 'Pending', icon: Clock, css: 'pending' },
  processing: { label: 'Processing', icon: RefreshCw, css: 'processing' },
  shipped: { label: 'Shipped', icon: Truck, css: 'shipped' },
  completed: { label: 'Delivered', icon: CheckCircle2, css: 'completed' },
  cancelled: { label: 'Cancelled', icon: XCircle, css: 'cancelled' },
};

function getOrderStatusMeta(status) {
  const s = (status || 'pending').toLowerCase();
  const normalized = s === 'delivered' ? 'completed' : s;
  return ORDER_STATUS_META[normalized] || ORDER_STATUS_META.pending;
}

function getOrderTimelineInfo(rawStatus) {
  const status = (rawStatus || 'pending').toLowerCase();
  const normalized = status === 'delivered' ? 'completed' : status;

  if (normalized === 'cancelled') {
    return {
      isCancelled: true,
      progress: 0,
      steps: [],
    };
  }

  let progress = 18;
  let placedState = 'completed';
  let processingState = 'current';
  let shippedState = 'upcoming';
  let deliveredState = 'upcoming';

  if (normalized === 'processing') {
    progress = 48;
    placedState = 'completed';
    processingState = 'current';
    shippedState = 'upcoming';
    deliveredState = 'upcoming';
  } else if (normalized === 'shipped') {
    progress = 78;
    placedState = 'completed';
    processingState = 'completed';
    shippedState = 'current';
    deliveredState = 'upcoming';
  } else if (normalized === 'completed') {
    progress = 100;
    placedState = 'completed';
    processingState = 'completed';
    shippedState = 'completed';
    deliveredState = 'completed';
  }

  return {
    isCancelled: false,
    progress,
    steps: [
      { key: 'placed', label: 'Placed', state: placedState },
      { key: 'processing', label: 'Processing', state: processingState },
      { key: 'shipped', label: 'Shipped', state: shippedState },
      { key: 'delivered', label: 'Delivered', state: deliveredState },
    ],
  };
}

function AccountContent() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const urlParams = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wallet' | 'profile' | 'addresses'

  // Deep-link support: /account?tab=wallet opens straight on a specific tab
  useEffect(() => {
    const tab = urlParams.get('tab');
    if (tab && ['orders', 'wallet', 'profile', 'addresses'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [urlParams]);

  // Deep-link support: /account?tab=profile#membership-panel also scrolls straight to that card
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash?.slice(1) : '';
    if (!hash) return;
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Wallet state
  const [wallet, setWallet] = useState({ usd_balance: 0, cad_balance: 0 });
  const [walletTxns, setWalletTxns] = useState([]);
  const [walletTopups, setWalletTopups] = useState([]);
  const [walletSettings, setWalletSettings] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [topupCurrency, setTopupCurrency] = useState('usd');
  const [topupMethod, setTopupMethod] = useState('wire'); // 'wire' | 'etransfer' (etransfer only offered for CAD)
  const [topupAmount, setTopupAmount] = useState('');
  const [topupRef, setTopupRef] = useState('');
  const [topupProofUrl, setTopupProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupStep, setTopupStep] = useState(1); // 1: amount+currency, 2: bank details + reference

  // Edit profile modal state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [showMethodInfoModal, setShowMethodInfoModal] = useState(false);

  // Trigger temporary toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Fetch orders for this user & sync live with Supabase Realtime
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async (showLoading = true) => {
      if (!user) return;
      if (showLoading) setLoading(true);
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
        if (isMounted && showLoading) setLoading(false);
      }
    };

    fetchOrders(true);

    // Live sync: Listen for status & dispatch changes made by admin
    const channel = supabase
      .channel(`realtime-orders-${user?.id || 'guest'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new && isMounted) {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === payload.new.id
                  ? {
                      ...o,
                      ...payload.new,
                      order_items: o.order_items || [],
                    }
                  : o
              )
            );
          } else if (isMounted) {
            fetchOrders(false);
          }
        }
      )
      .subscribe();

    // Auto-poll interval (12s) to guarantee updates even if realtime replication is inactive
    const pollTimer = setInterval(() => {
      if (isMounted) fetchOrders(false);
    }, 12000);

    // Window focus refresh: user tabs between admin and customer view
    const handleFocus = () => {
      if (isMounted) fetchOrders(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch wallet data
  const loadWallet = async () => {
    if (!user?.id) return;
    setWalletLoading(true);
    try {
      const [w, txns, topups, settings] = await Promise.all([
        getWallet(user.id),
        getWalletTransactions(user.id),
        getWalletTopups(user.id),
        getWalletSettings(),
      ]);
      setWallet(w);
      setWalletTxns(txns);
      setWalletTopups(topups);
      setWalletSettings(settings);
    } catch (err) {
      console.error('Failed to load wallet', err);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function openAddMoney() {
    setTopupCurrency('usd');
    setTopupMethod('wire');
    setTopupAmount('');
    setTopupRef('');
    setTopupProofUrl('');
    setTopupStep(1);
    setShowAddMoney(true);
  }

  async function handleProofUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      setTopupProofUrl(data.url);
    } catch (err) {
      showToast(err.message || 'Failed to upload proof image.');
    } finally {
      setUploadingProof(false);
      e.target.value = '';
    }
  }

  async function handleSubmitTopup(e) {
    e.preventDefault();
    if (!topupAmount || Number(topupAmount) <= 0) return;
    setTopupSubmitting(true);
    try {
      const { error } = await createTopupRequest(user.id, topupCurrency, topupAmount, topupRef, topupProofUrl, topupMethod);
      if (error) throw error;
      showToast(`Top-up request for ${topupCurrency.toUpperCase()} ${Number(topupAmount).toFixed(2)} submitted!`);
      setShowAddMoney(false);
      await loadWallet();
    } catch (err) {
      showToast(err.message || 'Failed to submit top-up request.');
    } finally {
      setTopupSubmitting(false);
    }
  }

  function openEditProfile() {
    setProfileForm({
      full_name: profile?.full_name || user?.user_metadata?.full_name || '',
      phone: profile?.phone || '',
      address_line1: profile?.address_line1 || '',
      address_line2: profile?.address_line2 || '',
      city: profile?.city || '',
      state: profile?.state || '',
      postal_code: profile?.postal_code || '',
      country: profile?.country || '',
    });
    setProfileSaveError('');
    setShowEditProfile(true);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);
    setProfileSaveError('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name.trim() || null,
          phone: profileForm.phone.trim() || null,
          address_line1: profileForm.address_line1.trim() || null,
          address_line2: profileForm.address_line2.trim() || null,
          city: profileForm.city.trim() || null,
          state: profileForm.state.trim() || null,
          postal_code: profileForm.postal_code.trim() || null,
          country: profileForm.country.trim() || null,
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      setShowEditProfile(false);
      showToast('Profile updated successfully!');
    } catch (err) {
      setProfileSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

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

  // Apex Vault membership status
  const isActiveMember = profile?.is_member && profile?.membership_expires_at && new Date(profile.membership_expires_at) > new Date();
  const daysRemaining = isActiveMember
    ? Math.max(0, Math.ceil((new Date(profile.membership_expires_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  // User details computed
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'The Pep Shop Member');

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

  const pepPoints = Math.floor(totalSpent * 10) + 150; // Base welcome bonus + 10x per dollar

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
            <CheckCircle2 size={18} className="text-brand" style={{ color: '#0066ff' }} />
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span className="account-badge-pill">
                  <Sparkles size={13} />
                  The Pep Shop Elite Club
                </span>
                {isActiveMember && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="account-badge-pill"
                    style={{
                      background: 'rgba(212,175,55,0.12)',
                      color: '#d4af37',
                      borderColor: 'rgba(212,175,55,0.35)',
                      cursor: 'pointer',
                    }}
                    title="View membership details"
                  >
                    <ShieldCheck size={13} />
                    Apex Vault Member &bull; {daysRemaining}d left
                  </button>
                )}
              </div>
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
              <div className="account-stat-label">PepPoints</div>
              <div className="account-stat-value">
                {loading ? '—' : pepPoints.toLocaleString()}
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
            className={`account-tab ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
          >
            <Wallet size={17} />
            <span>Wallet</span>
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
                {['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    className={`account-status-pill-btn ${
                      statusFilter === st ? 'active' : ''
                    }`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st === 'all' ? 'All Orders' : getOrderStatusMeta(st).label}
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
                    : "You haven't placed any orders yet. Explore our premium catalog of high-purity peptides and research compounds."}
                </p>
                <Link href="/shop" className="account-btn-primary" style={{ display: 'inline-flex' }}>
                  <span>Explore The Pep Shop</span>
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
                  const statusMeta = getOrderStatusMeta(order.status);
                  const StatusIcon = statusMeta.icon;
                  const timelineInfo = getOrderTimelineInfo(order.status);
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
                          <span className={`account-status-tag ${statusMeta.css}`}>
                            <StatusIcon
                              size={13}
                              className={statusMeta.css === 'processing' ? 'animate-spin' : ''}
                            />
                            {statusMeta.label}
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
                                    {item.variant_label && (
                                      <span style={{ color: 'var(--color-brand)', fontWeight: 650 }}> · {item.variant_label}</span>
                                    )}
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
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: 14,
                                }}
                              >
                                <div className="account-timeline-title" style={{ margin: 0 }}>
                                  Fulfillment &amp; Dispatch Tracking
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 11.5,
                                    color: '#34d399',
                                    fontWeight: 650,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 7,
                                      height: 7,
                                      borderRadius: '50%',
                                      background: '#10b981',
                                      display: 'inline-block',
                                      boxShadow: '0 0 6px #10b981',
                                    }}
                                  />
                                  Live Sync
                                </div>
                              </div>

                              {timelineInfo.isCancelled ? (
                                <div className="account-cancelled-banner">
                                  <XCircle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
                                  <div>
                                    <strong style={{ color: '#f87171', display: 'block', marginBottom: 2 }}>
                                      Order Cancelled
                                    </strong>
                                    <span>
                                      This order has been cancelled by administration. No further courier dispatch is scheduled.
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="account-order-timeline">
                                    <div className="account-order-timeline-track">
                                      <div
                                        className="account-order-timeline-fill"
                                        style={{ width: `${timelineInfo.progress}%` }}
                                      />
                                    </div>

                                    {timelineInfo.steps.map((step) => {
                                      const isDone = step.state === 'completed';
                                      const isCurrent = step.state === 'current';
                                      return (
                                        <div key={step.key} className="account-timeline-step">
                                          <div
                                            className={`account-step-bubble ${
                                              isDone ? 'completed' : isCurrent ? 'current' : ''
                                            }`}
                                          >
                                            {isDone ? (
                                              <Check size={15} strokeWidth={2.8} />
                                            ) : isCurrent ? (
                                              step.key === 'processing' ? (
                                                <RefreshCw size={13} className="animate-spin" />
                                              ) : step.key === 'shipped' ? (
                                                <Truck size={14} />
                                              ) : (
                                                <Clock size={13} />
                                              )
                                            ) : step.key === 'shipped' ? (
                                              <Truck size={14} />
                                            ) : step.key === 'delivered' ? (
                                              <CheckCircle2 size={14} />
                                            ) : (
                                              <Package size={14} />
                                            )}
                                          </div>
                                          <span className="account-step-label">{step.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Courier & Tracking Number Banner */}
                                  {order.shipping_address?.tracking_number && (
                                    <div className="account-tracking-info-banner">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div
                                          style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            background: 'rgba(0,102,255,0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--color-brand)',
                                          }}
                                        >
                                          <Truck size={17} />
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            Carrier:{' '}
                                            <strong style={{ color: 'var(--color-ink)' }}>
                                              {order.shipping_address.carrier || 'Express Tracked Courier'}
                                            </strong>
                                          </div>
                                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '0.03em' }}>
                                            Tracking #: {order.shipping_address.tracking_number}
                                          </div>
                                        </div>
                                      </div>
                                      {order.shipping_address.tracking_url ? (
                                        <a
                                          href={order.shipping_address.tracking_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="account-btn-secondary"
                                          style={{ padding: '6px 14px', fontSize: 12, textDecoration: 'none' }}
                                        >
                                          <span>Track with Courier</span>
                                          <ExternalLink size={13} />
                                        </a>
                                      ) : (
                                        <button
                                          type="button"
                                          className="account-btn-secondary"
                                          style={{ padding: '6px 14px', fontSize: 12 }}
                                          onClick={() => {
                                            navigator.clipboard.writeText(order.shipping_address.tracking_number);
                                            showToast(`Tracking #${order.shipping_address.tracking_number} copied!`);
                                          }}
                                        >
                                          <Copy size={13} />
                                          <span>Copy Tracking #</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
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
                            style={{ padding: '6px 14px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            <Truck size={13} style={{ color: '#38bdf8' }} />
                            <span>Live Tracking & Receipt</span>
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

        {/* TAB: WALLET */}
        {activeTab === 'wallet' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* How it works explainer */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                background: 'rgba(0,102,255,0.06)',
                border: '1px solid rgba(0,102,255,0.25)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20,
              }}
            >
              <Info size={18} style={{ color: 'var(--color-brand)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--color-ink-soft)' }}>
                <strong style={{ color: 'var(--color-ink)' }}>How it works:</strong> Send an Interac e-Transfer or wire transfer,
                submit the confirmation / reference number below, and we&apos;ll credit your Wallet once the funds arrive
                (usually within a few hours). After that, pay for any order or membership instantly from your
                Wallet — no waiting on new transfers for every purchase.{' '}
                <button
                  type="button"
                  onClick={() => setShowMethodInfoModal(true)}
                  style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-brand)', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Compare Wire vs e-Transfer
                  <ArrowLeftRight size={13} />
                </button>
                {' · '}
                <Link href="/faq#wallet-etransfer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-brand)', fontWeight: 700 }}>
                  Read the full FAQ
                  <ArrowRight size={13} />
                </Link>
              </p>
            </div>

            {/* Balance Cards */}
            <div className="account-stats-grid" style={{ marginBottom: 20 }}>
              <div className="account-stat-card">
                <div className="account-stat-icon emerald">
                  <DollarSign size={22} />
                </div>
                <div>
                  <div className="account-stat-label">USD Wallet Balance</div>
                  <div className="account-stat-value">
                    {walletLoading ? '—' : `$${Number(wallet.usd_balance).toFixed(2)}`}
                  </div>
                </div>
              </div>

              <div className="account-stat-card">
                <div className="account-stat-icon blue">
                  <DollarSign size={22} />
                </div>
                <div>
                  <div className="account-stat-label">CAD Wallet Balance</div>
                  <div className="account-stat-value">
                    {walletLoading ? '—' : `C$${Number(wallet.cad_balance).toFixed(2)}`}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <button className="account-btn-primary" onClick={openAddMoney}>
                <Plus size={16} />
                <span>Add Money to Wallet</span>
              </button>
            </div>

            {/* Pending / Recent Top-ups */}
            <div className="account-card-panel" style={{ marginBottom: 20 }}>
              <div className="account-panel-header">
                <div className="account-panel-title">
                  <Building size={18} className="text-brand" style={{ color: '#0066ff' }} />
                  <span>Top-up Requests</span>
                </div>
              </div>

              {walletTopups.length === 0 ? (
                <p style={{ color: '#a8adb4', fontSize: 13.5, margin: 0 }}>
                  No top-up requests yet. Click &quot;Add Money to Wallet&quot; to get started.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {walletTopups.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: '#171b23',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        fontSize: 13.5,
                      }}
                    >
                      <div>
                        <strong>{t.currency.toUpperCase()} {Number(t.amount).toFixed(2)}</strong>
                        {t.method === 'etransfer' && (
                          <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                            e-Transfer
                          </span>
                        )}
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {new Date(t.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          {t.reference_note ? ` · Ref: ${t.reference_note}` : ''}
                        </div>
                      </div>
                      <span
                        className={`account-status-tag ${t.status === 'approved' ? 'delivered' : t.status === 'rejected' ? 'cancelled' : 'pending'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {t.status === 'approved' && <CheckCircle2 size={13} />}
                        {t.status === 'pending' && <Clock size={13} />}
                        {t.status === 'rejected' && <XCircle size={13} />}
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction Ledger */}
            <div className="account-card-panel">
              <div className="account-panel-header">
                <div className="account-panel-title">
                  <Package size={18} className="text-brand" style={{ color: '#0066ff' }} />
                  <span>Transaction History</span>
                </div>
              </div>

              {walletTxns.length === 0 ? (
                <p style={{ color: '#a8adb4', fontSize: 13.5, margin: 0 }}>
                  No wallet transactions yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {walletTxns.map((tx) => {
                    const isCredit = Number(tx.amount) > 0;
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          background: '#171b23',
                          border: '1px solid var(--color-border)',
                          borderRadius: 10,
                          fontSize: 13.5,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isCredit ? (
                            <ArrowDownCircle size={18} style={{ color: '#34d399' }} />
                          ) : (
                            <ArrowUpCircle size={18} style={{ color: '#dc2626' }} />
                          )}
                          <div>
                            <div>{tx.note || (tx.type === 'topup' ? 'Wallet top-up' : 'Order payment')}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                              {new Date(tx.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <strong style={{ color: isCredit ? '#34d399' : '#dc2626' }}>
                          {isCredit ? '+' : ''}{tx.currency.toUpperCase()} {Number(tx.amount).toFixed(2)}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <motion.div
            className="account-profile-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Apex Vault Membership Status — its own dedicated panel, spans full width, shown first */}
            <div id="membership-panel" className="account-card-panel" style={{ gridColumn: '1 / -1', scrollMarginTop: 100 }}>
              <div className="account-panel-header">
                <div className="account-panel-title">
                  <ShieldCheck size={18} className="text-brand" style={{ color: '#0066ff' }} />
                  <span>Apex Vault Membership</span>
                </div>
                {isActiveMember && (
                  <span className="account-badge-pill" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', borderColor: 'rgba(52,211,153,0.35)' }}>
                    <Sparkles size={13} />
                    Active
                  </span>
                )}
              </div>

              {isActiveMember ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 20,
                      flexWrap: 'wrap',
                      background: 'rgba(52,211,153,0.06)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      borderRadius: 14,
                      padding: '26px 28px',
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, color: '#a8adb4', marginBottom: 6 }}>Days Remaining</div>
                      <div style={{ fontSize: 38, fontWeight: 800, color: '#34d399', lineHeight: 1 }}>{daysRemaining}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13.5, color: '#a8adb4', marginBottom: 6 }}>Renews / Expires On</div>
                      <div style={{ fontSize: 16.5, fontWeight: 700 }}>
                        {new Date(profile.membership_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Visual countdown bar (out of 365 days) */}
                  <div style={{ height: 10, borderRadius: 999, background: '#171b23', overflow: 'hidden', marginBottom: 20 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(3, (daysRemaining / 365) * 100))}%`,
                        background: 'linear-gradient(90deg, #34d399, #10b981)',
                        borderRadius: 999,
                      }}
                    />
                  </div>

                  <Link href="/membership" className="account-btn-secondary" style={{ display: 'inline-flex', padding: '12px 20px', fontSize: 14 }}>
                    <ShieldCheck size={16} />
                    <span>Manage / Renew Membership</span>
                  </Link>
                </>
              ) : (
                <>
                  <p style={{ color: '#a8adb4', fontSize: 13.5, margin: '0 0 16px' }}>
                    You&apos;re not an Apex Vault member yet. Unlock priority batch access, exclusive
                    pricing, and dedicated research support.
                  </p>
                  <Link href="/membership" className="account-btn-primary" style={{ display: 'inline-flex' }}>
                    <Sparkles size={15} />
                    <span>Join Apex Vault</span>
                  </Link>
                </>
              )}
            </div>

            <div className="account-card-panel">
              <div className="account-panel-header">
                <div className="account-panel-title">
                  <User size={18} className="text-brand" style={{ color: '#0066ff' }} />
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
                <span className="account-data-label">Phone</span>
                <span className="account-data-val">{profile?.phone || <span style={{ color: '#94a3b8' }}>Not provided</span>}</span>
              </div>
              <div style={{ marginTop: 20 }}>
                <button className="account-btn-secondary" onClick={openEditProfile}>
                  Edit Profile Info
                </button>
              </div>
            </div>

            <div className="account-card-panel">
              <div className="account-panel-header">
                <div className="account-panel-title">
                  <ShieldCheck size={18} className="text-brand" style={{ color: '#0066ff' }} />
                  <span>Security & Credentials</span>
                </div>
              </div>

              <div className="account-data-row">
                <span className="account-data-label">Password Protection</span>
                <span className="account-data-val">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
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
                <MapPin size={18} className="text-brand" style={{ color: '#0066ff' }} />
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

      {/* ADD MONEY TO WALLET MODAL */}
      <AnimatePresence>
        {showAddMoney && (
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
                maxWidth: 480,
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
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add Money to Wallet</h3>
                <button
                  onClick={() => setShowAddMoney(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a8adb4' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ overflowY: 'auto', padding: 24 }}>
                {topupStep === 1 && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                        Currency
                      </label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {['usd', 'cad'].map((cur) => (
                          <button
                            key={cur}
                            type="button"
                            onClick={() => setTopupCurrency(cur)}
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              borderRadius: 8,
                              border: topupCurrency === cur ? '1.5px solid var(--color-brand)' : '1.5px solid var(--color-border)',
                              background: topupCurrency === cur ? 'rgba(0,102,255,0.08)' : 'transparent',
                              color: topupCurrency === cur ? 'var(--color-brand)' : 'inherit',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {cur.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                        Top-up Method
                      </label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {[
                          { id: 'wire', label: 'Wire Transfer' },
                          { id: 'etransfer', label: topupCurrency === 'cad' ? 'Interac e-Transfer' : 'e-Transfer' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setTopupMethod(m.id)}
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              borderRadius: 8,
                              border: topupMethod === m.id ? '1.5px solid var(--color-brand)' : '1.5px solid var(--color-border)',
                              background: topupMethod === m.id ? 'rgba(0,102,255,0.08)' : 'transparent',
                              color: topupMethod === m.id ? 'var(--color-brand)' : 'inherit',
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: 'pointer',
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'flex-start',
                          marginTop: 10,
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: 'rgba(0,102,255,0.05)',
                          border: '1px solid rgba(0,102,255,0.15)',
                        }}
                      >
                        <Info size={14} style={{ color: 'var(--color-brand)', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'var(--color-ink-soft)' }}>
                          {topupMethod === 'etransfer' ? (
                            <>
                              <strong style={{ color: 'var(--color-ink)' }}>e-Transfer:</strong> send from your online
                              banking app to just an <strong>email address</strong> — no account/routing numbers
                              needed. Usually the fastest option, often credited within minutes.
                            </>
                          ) : (
                            <>
                              <strong style={{ color: 'var(--color-ink)' }}>Wire Transfer:</strong> send directly to our
                              bank account using the <strong>account &amp; routing/transit numbers</strong> we
                              provide. Works from any bank, including outside Canada, but can take longer to arrive.
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const min = Number(walletSettings?.[`min_topup_${topupCurrency}`] ?? 10);
                      const max = Number(walletSettings?.[`max_topup_${topupCurrency}`] ?? 10000);
                      const amountNum = Number(topupAmount);
                      const outOfRange = !topupAmount || amountNum < min || amountNum > max;

                      return (
                        <>
                          <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                              Amount ({topupCurrency.toUpperCase()})
                            </label>
                            <input
                              type="number"
                              min={min}
                              max={max}
                              step="0.01"
                              value={topupAmount}
                              onChange={(e) => setTopupAmount(e.target.value)}
                              placeholder={`e.g. ${min.toFixed(2)}`}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                            />
                            <p style={{ fontSize: 11.5, color: topupAmount && outOfRange ? '#dc2626' : '#94a3b8', margin: '6px 0 0' }}>
                              Min {topupCurrency.toUpperCase()} {min.toFixed(2)} — Max {topupCurrency.toUpperCase()} {max.toFixed(2)}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="account-btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            disabled={outOfRange}
                            onClick={() => setTopupStep(2)}
                          >
                            Continue
                          </button>
                        </>
                      );
                    })()}
                  </>
                )}

                {topupStep === 2 && (
                  <form onSubmit={handleSubmitTopup}>
                    {topupMethod === 'etransfer' ? (
                      <>
                        <p style={{ fontSize: 13, color: '#a8adb4', marginTop: 0 }}>
                          Send <strong>{topupCurrency.toUpperCase()} {Number(topupAmount).toFixed(2)}</strong> via
                          {topupCurrency === 'cad' ? ' Interac e-Transfer' : ' e-Transfer'} to the recipient below, then submit your confirmation number.
                        </p>

                        <div style={{ background: '#171b23', border: '1px solid var(--color-border)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13 }}>
                          {(() => {
                            const et = topupCurrency === 'usd' ? walletSettings?.usd_etransfer : walletSettings?.cad_etransfer;
                            if (!et || !et.email) {
                              return (
                                <span style={{ color: '#94a3b8' }}>
                                  e-Transfer details have not been configured yet. Contact support for instructions.
                                </span>
                              );
                            }
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div><strong>Send To (Email):</strong> {et.email}</div>
                                {et.recipient_name && <div><strong>Recipient Name:</strong> {et.recipient_name}</div>}
                                {et.security_question && <div><strong>Security Question:</strong> {et.security_question}</div>}
                                {et.security_answer && <div><strong>Security Answer:</strong> {et.security_answer}</div>}
                              </div>
                            );
                          })()}
                        </div>

                        {walletSettings?.instructions && (
                          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{walletSettings.instructions}</p>
                        )}

                        <div style={{ marginBottom: 20 }}>
                          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                            e-Transfer Confirmation Number
                          </label>
                          <input
                            value={topupRef}
                            onChange={(e) => setTopupRef(e.target.value)}
                            placeholder="e.g. INTAC123456789"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: 13, color: '#a8adb4', marginTop: 0 }}>
                          Send <strong>{topupCurrency.toUpperCase()} {Number(topupAmount).toFixed(2)}</strong> by wire transfer to the account below, then submit your reference number.
                        </p>

                        <div style={{ background: '#171b23', border: '1px solid var(--color-border)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13 }}>
                          {(() => {
                            const bank = topupCurrency === 'usd' ? walletSettings?.usd_bank : walletSettings?.cad_bank;
                            if (!bank || !bank.account_number) {
                              return (
                                <span style={{ color: '#94a3b8' }}>
                                  Bank details have not been configured yet. Contact support for wire instructions.
                                </span>
                              );
                            }
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div><strong>Bank:</strong> {bank.bank_name}</div>
                                <div><strong>Account Name:</strong> {bank.account_name}</div>
                                <div><strong>Account Number:</strong> {bank.account_number}</div>
                                {topupCurrency === 'usd' ? (
                                  <div><strong>Routing Number:</strong> {bank.routing_number}</div>
                                ) : (
                                  <>
                                    <div><strong>Transit Number:</strong> {bank.transit_number}</div>
                                    <div><strong>Institution Number:</strong> {bank.institution_number}</div>
                                  </>
                                )}
                                {bank.swift && <div><strong>SWIFT:</strong> {bank.swift}</div>}
                              </div>
                            );
                          })()}
                        </div>

                        {walletSettings?.instructions && (
                          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{walletSettings.instructions}</p>
                        )}

                        <div style={{ marginBottom: 20 }}>
                          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                            Wire Reference / Confirmation Number
                          </label>
                          <input
                            value={topupRef}
                            onChange={(e) => setTopupRef(e.target.value)}
                            placeholder="e.g. TXN123456789"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                          />
                        </div>
                      </>
                    )}

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                        Attach Payment Proof (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        disabled={uploadingProof}
                        style={{ fontSize: 12.5 }}
                      />
                      {uploadingProof && <span style={{ fontSize: 12, color: 'var(--color-brand)', marginLeft: 8 }}>Uploading...</span>}
                      {topupProofUrl && (
                        <div style={{ marginTop: 10, position: 'relative', width: 140, height: 140, borderRadius: 10, overflow: 'hidden', background: '#171b23' }}>
                          <img src={topupProofUrl} alt="Payment proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => setTopupProofUrl('')}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: 4 }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                      <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 0' }}>
                        A screenshot or photo of your e-Transfer or wire transfer receipt helps us approve faster.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" className="account-btn-secondary" onClick={() => setTopupStep(1)}>
                        Back
                      </button>
                      <button type="submit" className="account-btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={topupSubmitting}>
                        {topupSubmitting ? 'Submitting...' : 'Submit Top-up Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {showEditProfile && (
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
                maxWidth: 560,
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
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Edit Profile Info</h3>
                <button
                  onClick={() => setShowEditProfile(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a8adb4' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} style={{ overflowY: 'auto', padding: 24 }}>
                {profileSaveError && (
                  <div
                    style={{
                      background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.3)',
                      color: '#dc2626',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 13,
                      marginBottom: 16,
                    }}
                  >
                    {profileSaveError}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                    Full Name
                  </label>
                  <input
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                    Phone
                  </label>
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. +1 555 123 4567"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                    Address Line 1
                  </label>
                  <input
                    value={profileForm.address_line1}
                    onChange={(e) => setProfileForm((f) => ({ ...f, address_line1: e.target.value }))}
                    placeholder="Street address"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                    Address Line 2 <span style={{ fontWeight: 500, color: '#94a3b8' }}>(optional)</span>
                  </label>
                  <input
                    value={profileForm.address_line2}
                    onChange={(e) => setProfileForm((f) => ({ ...f, address_line2: e.target.value }))}
                    placeholder="Apt, suite, unit, etc."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                      City
                    </label>
                    <input
                      value={profileForm.city}
                      onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                      State / Province
                    </label>
                    <input
                      value={profileForm.state}
                      onChange={(e) => setProfileForm((f) => ({ ...f, state: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                      Postal Code
                    </label>
                    <input
                      value={profileForm.postal_code}
                      onChange={(e) => setProfileForm((f) => ({ ...f, postal_code: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                      Country
                    </label>
                    <input
                      value={profileForm.country}
                      onChange={(e) => setProfileForm((f) => ({ ...f, country: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="account-btn-secondary" onClick={() => setShowEditProfile(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="account-btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WIRE vs e-TRANSFER COMPARISON MODAL */}
      <AnimatePresence>
        {showMethodInfoModal && (
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
            onClick={() => setShowMethodInfoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--color-surface)',
                borderRadius: 20,
                maxWidth: 680,
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
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Wire Transfer vs e-Transfer</h3>
                <button
                  onClick={() => setShowMethodInfoModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a8adb4' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ overflowY: 'auto', padding: 24 }}>
                <p style={{ margin: '0 0 22px', fontSize: 13.5, color: '#a8adb4', lineHeight: 1.6 }}>
                  Both are just ways to send us money so we can add it to your Wallet. Pick whichever is easier
                  from your own bank — here&apos;s exactly what to do for each one, step by step.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  {[
                    {
                      icon: Building,
                      color: 'var(--color-brand)',
                      title: 'Wire Transfer',
                      tagline: 'Best if your bank doesn’t support e-Transfer, or you’re outside Canada.',
                      steps: [
                        'Choose "Wire Transfer" and enter how much you want to add.',
                        'We show you our bank account number + routing/transit number.',
                        'Open your own banking app and send a transfer to that account.',
                        'Your bank gives you a confirmation number — type it in here.',
                        'We verify the funds and credit your Wallet, usually within a few hours.',
                      ],
                    },
                    {
                      icon: Wallet,
                      color: '#3b82f6',
                      title: 'e-Transfer',
                      tagline: 'Best if your bank supports it — simplest and usually fastest.',
                      steps: [
                        'Choose "e-Transfer" and enter how much you want to add.',
                        'We show you an email address to send it to (plus a security question, if set).',
                        'Open your banking app, find "Interac e-Transfer" / "Send Money", and send to that email.',
                        'Your bank gives you a confirmation number — type it in here.',
                        'We verify the funds and credit your Wallet, often within minutes.',
                      ],
                    },
                  ].map((method) => (
                    <div key={method.title} style={{ background: '#171b23', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <method.icon size={18} style={{ color: method.color }} />
                        <strong style={{ fontSize: 15 }}>{method.title}</strong>
                      </div>
                      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                        {method.tagline}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {method.steps.map((step, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span
                              style={{
                                flexShrink: 0,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: `${method.color}22`,
                                color: method.color,
                                fontSize: 11,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {i + 1}
                            </span>
                            <span style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5 }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ margin: '20px 0 0', fontSize: 12.5, color: '#94a3b8' }}>
                  Still confused? Just pick one, follow the steps above, and reach out from Contact Us if you get
                  stuck — we&apos;ll help you finish it.{' '}
                  <Link href="/faq#wallet-etransfer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-brand)', fontWeight: 700 }} onClick={() => setShowMethodInfoModal(false)}>
                    Read the full FAQ
                    <ArrowRight size={13} />
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Account() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <AccountContent />
      </Suspense>
    </ProtectedRoute>
  );
}
