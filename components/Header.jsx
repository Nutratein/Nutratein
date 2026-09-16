'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import CartDrawer from './CartDrawer.jsx';
import { User, ShoppingCart, Menu, X, Settings, ArrowRight, FlaskConical, Heart, Search } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home', end: true },
  { href: '/shop', label: 'Shop' },
  { href: '/membership', label: 'Membership' },
  { href: '/about-us', label: 'About Us' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact-us', label: 'Contact' },
];

function isActive(pathname, href, end) {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Header() {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAdmin } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    router.push(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Sleek Top Announcement Bar */}
      <div className="modern-announce-bar">
        <div className="announce-inner">
          <span className="announce-pill">
            <span className="announce-dot"></span>
            RESEARCH ONLY
          </span>
          <span className="announce-text">
            Strictly for in-vitro scientific research &amp; laboratory use — not for human or veterinary consumption.
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className={`modern-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="modern-header-container">
          {/* Brand Logo */}
          <Link href="/" className="modern-brand" aria-label="The Pep Shop Home">
            <img src="/images/tps-logo.png" alt="The Pep Shop" className="brand-img" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="modern-nav" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href, link.end);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`modern-nav-link ${active ? 'active' : ''}`}
                >
                  {link.label}
                  {active && <span className="active-dot" />}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="header-actions" style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              aria-label="Search products"
              onClick={() => setSearchOpen((prev) => !prev)}
              title="Search"
            >
              {searchOpen ? <X size={20} strokeWidth={2.2} /> : <Search size={20} strokeWidth={2.2} />}
            </button>

            {searchOpen && (
              <form onSubmit={handleSearchSubmit} className="header-search-panel">
                <Search size={16} className="header-search-icon" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search peptides, e.g. BPC-157..."
                  className="header-search-input"
                />
                <button type="submit" className="header-search-submit" aria-label="Search">
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {isAdmin && (
              <button
                className="icon-btn admin-btn"
                aria-label="Admin panel"
                onClick={() => router.push('/admin')}
                title="Admin panel"
              >
                <Settings size={19} strokeWidth={2.2} />
              </button>
            )}

            <button
              className="icon-btn"
              aria-label={user ? 'Account' : 'Log in'}
              onClick={() => router.push(user ? '/account' : '/login')}
              title={user ? 'My Account' : 'Log in'}
            >
              <User size={20} strokeWidth={2.2} />
            </button>

            <Link
              href="/wishlist"
              className="icon-btn"
              aria-label={`View wishlist with ${wishlistCount} items`}
              title="My Wishlist"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Heart size={20} strokeWidth={2.2} />
              {wishlistCount > 0 && (
                <span className="cart-badge" style={{ background: '#0066ff' }}>
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            <button
              className="icon-btn cart-btn"
              aria-label={`View cart with ${itemCount} items`}
              onClick={() => setCartOpen(true)}
              title="Shopping Cart"
            >
              <ShoppingCart size={20} strokeWidth={2.2} />
              {itemCount > 0 && (
                <span className="cart-badge">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            <button
              className="icon-btn nav-toggle"
              aria-label={menuOpen ? 'Close menu' : 'Toggle menu'}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <X size={22} strokeWidth={2.3} /> : <Menu size={22} strokeWidth={2.3} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        <div className={`mobile-nav-panel ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-inner">
            <div className="mobile-badge-strip">
              <span className="mobile-badge">
                <FlaskConical size={14} /> Laboratory Peptides
              </span>
            </div>

            <div className="mobile-nav-links">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href, link.end);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`mobile-nav-link ${active ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={16} className="mobile-link-arrow" />
                  </Link>
                );
              })}
              <Link
                href="/wishlist"
                className={`mobile-nav-link ${pathname === '/wishlist' ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Heart size={16} color="#0066ff" /> My Wishlist ({wishlistCount})
                </span>
                <ArrowRight size={16} className="mobile-link-arrow" />
              </Link>
            </div>

            <div className="mobile-nav-footer">
              <button
                className="mobile-account-btn"
                onClick={() => {
                  setMenuOpen(false);
                  router.push(user ? '/account' : '/login');
                }}
              >
                <User size={18} />
                <span>{user ? 'My Research Account' : 'Sign In / Register'}</span>
              </button>
              <p className="mobile-compliance-text">
                All compounds synthesized strictly for laboratory research.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  );
}
