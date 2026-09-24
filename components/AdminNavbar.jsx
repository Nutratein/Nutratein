'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Store,
  ExternalLink,
  ShieldCheck,
  LogOut,
  User,
  LayoutDashboard
} from 'lucide-react';

const ROUTE_TITLES = {
  '/admin': 'Executive Dashboard',
  '/admin/orders': 'Orders Management',
  '/admin/products': 'Product Catalog',
  '/admin/wallet': 'Wallet Top-ups',
  '/admin/promo-codes': 'Promo Codes',
  '/admin/reviews': 'Customer Reviews',
  '/admin/categories': 'Categories',
  '/admin/homepage': 'Homepage Content',
  '/admin/contact-info': 'Contact Info',
  '/admin/shipping': 'Shipping & Fees',
  '/admin/membership': 'Membership Card',
};

export default function AdminNavbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const currentTitle = ROUTE_TITLES[pathname] || 'Administration';

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="admin-dedicated-navbar">
      <div className="admin-nav-inner">
        {/* Brand & Identity */}
        <div className="admin-nav-left">
          <Link href="/admin" className="admin-nav-brand">
            <img
              src="/images/tps-logo.png"
              alt="The Pep Shop"
              className="admin-nav-logo"
            />
            <div className="admin-nav-badge-group">
              <span className="admin-nav-portal-badge">
                <span className="admin-pulse-dot" />
                ADMIN
              </span>
              <span className="admin-nav-status-indicator" title="System Online">
                <span className="admin-pulse-text">Live</span>
              </span>
            </div>
          </Link>

          {/* Current Page Title (Desktop / Tablet) */}
          <div className="admin-nav-crumb">
            <span className="admin-nav-crumb-sep">/</span>
            <span className="admin-nav-crumb-title">{currentTitle}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="admin-nav-right">
          {/* Live Storefront Button */}
          <Link
            href="/"
            target="_blank"
            className="admin-nav-store-btn"
            title="Open customer storefront in new tab"
          >
            <Store size={15} />
            <span className="admin-btn-text">Live Storefront</span>
            <ExternalLink size={12} className="admin-btn-icon" />
          </Link>

          {/* Admin User / Logout Pill */}
          <div className="admin-nav-user-pill">
            <div className="admin-user-avatar">
              <User size={13} />
            </div>
            <span className="admin-user-email">
              {user?.email ? user.email.split('@')[0] : 'Admin'}
            </span>
            <button
              onClick={handleSignOut}
              className="admin-logout-btn"
              title="Sign out of admin"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
