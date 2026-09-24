'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminRoute from '@/components/AdminRoute.jsx';
import AdminNavbar from '@/components/AdminNavbar';
import {
  LayoutDashboard,
  Layers,
  Package,
  Tags,
  ShoppingBag,
  ExternalLink,
  Store,
  Star,
  Wallet,
  Tag,
  MapPin,
  Truck,
  Gem
} from 'lucide-react';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/wallet', label: 'Wallet Top-ups', icon: Wallet },
  { href: '/admin/promo-codes', label: 'Promo Codes', icon: Tag },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/homepage', label: 'Homepage Content', icon: Layers },
  { href: '/admin/contact-info', label: 'Contact Info', icon: MapPin },
  { href: '/admin/shipping', label: 'Shipping & Fees', icon: Truck },
  { href: '/admin/membership', label: 'Membership Card', icon: Gem },
];

function isActive(pathname, href, end) {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const navRef = useRef(null);

  useEffect(() => {
    if (navRef.current) {
      const activeEl = navRef.current.querySelector('.admin-mobile-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [pathname]);

  return (
    <AdminRoute>
      <div className="admin-portal-wrapper">
        <AdminNavbar />
        <div className="admin-shell">
          <div className="admin-container">
          {/* Mobile Horizontal Navigation */}
          <div className="admin-mobile-nav" ref={navRef}>
            {LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.href, link.end);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`admin-mobile-item ${active ? 'active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Sidebar Navigation */}
          <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
              <div className="admin-sidebar-title">
                <span>Management</span>
                <span className="admin-live-pill">
                  <span className="admin-live-dot" />
                  Live
                </span>
              </div>
            </div>

            <nav>
              {LINKS.map((link) => {
                const Icon = link.icon;
                const active = isActive(pathname, link.href, link.end);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`admin-nav-item ${active ? 'active' : ''}`}
                  >
                    <Icon size={17} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="admin-sidebar-footer">
              <Link href="/" target="_blank" className="admin-store-link">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Store size={14} />
                  Live Storefront
                </span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </aside>

          {/* Main Dashboard Content */}
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </div>
  </AdminRoute>
  );
}
