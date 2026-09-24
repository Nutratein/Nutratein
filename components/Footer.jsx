'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getSiteContent } from '@/lib/siteContent';
import {
  ShieldCheck,
  FlaskConical,
  Truck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  ArrowUp
} from 'lucide-react';

// lucide-react dropped brand/social icons — small inline SVGs instead.
const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} {...props}>
    <path d="M13.5 21v-8.2h2.75l.41-3.2h-3.16V7.55c0-.93.26-1.56 1.59-1.56h1.7V3.14C15.98 3.1 15.05 3 13.96 3c-2.28 0-3.84 1.39-3.84 3.95v2.65H7.36v3.2h2.76V21h3.38z" />
  </svg>
);
const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={16} height={16} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} {...props}>
    <path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.9L4.8 22H1.6l8.1-9.3L1 2h7.1l4.9 6.3L18.9 2zm-1.2 18h1.9L7.4 4H5.3l12.4 16z" />
  </svg>
);
const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} {...props}>
    <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9h4v12H3zM9 9h3.8v1.64h.05c.53-.99 1.83-2.04 3.77-2.04 4.03 0 4.78 2.55 4.78 5.87V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.45-2.16 2.96V21H9z" />
  </svg>
);
const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} {...props}>
    <path d="M22.5 6.9a2.8 2.8 0 0 0-2-2C18.7 4.5 12 4.5 12 4.5s-6.7 0-8.5.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 5.1 2.8 2.8 0 0 0 2 2c1.8.4 8.5.4 8.5.4s6.7 0 8.5-.4a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-5.1zM9.8 15.5v-7L15.8 12z" />
  </svg>
);

const SOCIAL_ICONS = [
  { key: 'social_facebook', icon: FacebookIcon, label: 'Facebook' },
  { key: 'social_instagram', icon: InstagramIcon, label: 'Instagram' },
  { key: 'social_twitter', icon: TwitterIcon, label: 'Twitter / X' },
  { key: 'social_linkedin', icon: LinkedinIcon, label: 'LinkedIn' },
  { key: 'social_youtube', icon: YoutubeIcon, label: 'YouTube' },
];

const TRUST_ITEMS = [
  {
    icon: FlaskConical,
    title: '\u226599% High Purity',
    sub: 'HPLC & Mass Spec verified batch testing'
  },
  {
    icon: ShieldCheck,
    title: 'Third-Party Tested',
    sub: 'Independent USA certified laboratory analysis'
  },
  {
    icon: Truck,
    title: 'Temperature Controlled',
    sub: 'Cold-chain insulated express packaging'
  },
  {
    icon: Lock,
    title: 'Secure Compliance',
    sub: '256-Bit encrypted research transactions'
  }
];

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [footerCategories, setFooterCategories] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    getSiteContent('home', {}).then((value) => {
      if (value?.contact) setSocialLinks(value.contact);
    });
  }, [pathname]);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    supabase
      .from('categories')
      .select('name, slug')
      .order('name')
      .limit(4)
      .then(({ data }) => setFooterCategories(data || []));
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="modern-footer">
      {/* Top Value Propositions / Trust Strip */}
      <div className="footer-trust-strip">
        {/* Desktop / Tablet Grid View */}
        <div className="footer-container trust-desktop-wrap">
          <div className="trust-grid">
            {TRUST_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="trust-item">
                  <div className="trust-icon-box">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h4 className="trust-title">{item.title}</h4>
                    <p className="trust-sub">{item.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile 1-Row Infinite Scroll Marquee */}
        <div className="trust-marquee-wrap" aria-label="Key Trust Signals">
          <div className="trust-marquee-track">
            {/* Primary group */}
            <div className="trust-marquee-group">
              {TRUST_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={`m1-${idx}`} className="trust-item">
                    <div className="trust-icon-box">
                      <Icon size={15} />
                    </div>
                    <div className="trust-text-box">
                      <h4 className="trust-title">{item.title}</h4>
                      <p className="trust-sub">{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Duplicate group for seamless loop */}
            <div className="trust-marquee-group" aria-hidden="true">
              {TRUST_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={`m2-${idx}`} className="trust-item">
                    <div className="trust-icon-box">
                      <Icon size={15} />
                    </div>
                    <div className="trust-text-box">
                      <h4 className="trust-title">{item.title}</h4>
                      <p className="trust-sub">{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="footer-container">
          <div className="modern-footer-grid">
            {/* Brand Column */}
            <div className="footer-brand-col">
              <Link href="/" className="footer-brand" aria-label="The Pep Shop">
                <img
                  src="/images/tps-logo.png"
                  alt="The Pep Shop"
                  className="footer-logo-img"
                />
              </Link>
              <p className="footer-brand-desc">
                Pioneering bio-molecular peptide synthesis, lyophilized biochemicals, and precision analytical standards strictly for certified research institutions and laboratory investigations.
              </p>

              <div className="footer-contact-items">
                <div className="footer-contact-row">
                  <Mail size={16} className="footer-contact-icon" />
                  <a href={`mailto:${socialLinks.email || 'info@thepepshop.com'}`}>{socialLinks.email || 'info@thepepshop.com'}</a>
                </div>
              </div>

              {SOCIAL_ICONS.some((s) => socialLinks[s.key]) && (
                <div className="footer-social-row">
                  {SOCIAL_ICONS.filter((s) => socialLinks[s.key]).map((s) => {
                    const Icon = s.icon;
                    return (
                      <a
                        key={s.key}
                        href={socialLinks[s.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="footer-social-icon"
                      >
                        <Icon size={16} />
                      </a>
                    );
                  })}
                </div>
              )}

              <div className="footer-status-pill">
                <span className="status-indicator"></span>
                <span>Laboratories Operating at Full Capacity</span>
              </div>
            </div>

            {/* Column 2: Research Peptides */}
            <div className="footer-col">
              <h4 className="footer-col-title">Research Categories</h4>
              <ul className="footer-links">
                <li><Link href="/shop">All Peptide Catalog</Link></li>
                {footerCategories.map((cat) => (
                  <li key={cat.slug}>
                    <Link href={`/shop?category=${cat.slug}`}>{cat.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Science & Lab */}
            <div className="footer-col">
              <h4 className="footer-col-title">Science &amp; Company</h4>
              <ul className="footer-links">
                <li><Link href="/about-us">About The Pep Shop</Link></li>
                <li><Link href="/faq">Research FAQ</Link></li>
                <li><Link href="/contact-us">Institutional Inquiry</Link></li>
                <li><Link href="/account">Research Portal</Link></li>
                <li><Link href="/faq">Quality Assurance</Link></li>
              </ul>
            </div>

            {/* Column 4: Newsletter / Compliance */}
            <div className="footer-col footer-newsletter-col">
              <h4 className="footer-col-title">Research Bulletins</h4>
              <p className="footer-col-text">
                Receive newly published batch purity reports, compound syntheses, and technical bulletins.
              </p>

              {subscribed ? (
                <div className="newsletter-success">
                  <CheckCircle2 size={18} />
                  <span>Thank you! You are subscribed to lab bulletins.</span>
                </div>
              ) : (
                <form className="modern-newsletter-form" onSubmit={handleSubscribe}>
                  <div className="newsletter-input-wrap">
                    <div className="footer-newsletter-icon" aria-hidden="true">
                      <Mail size={16} />
                    </div>
                    <input 
                      type="email" 
                      placeholder="Enter research email..." 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="newsletter-input footer-newsletter-input"
                    />
                    <button type="submit" className="newsletter-submit-btn footer-newsletter-btn" aria-label="Subscribe">
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </form>
              )}

              <div className="footer-legal-links">
                <Link href="/policies#terms">Terms of Supply</Link>
                <span className="dot-sep">&bull;</span>
                <Link href="/policies#privacy">Privacy Notice</Link>
                <span className="dot-sep">&bull;</span>
                <Link href="/policies#refund">Refund Policy</Link>
              </div>
            </div>
          </div>


          {/* Bottom Bar */}
          <div className="modern-footer-bottom">
            <div className="copyright-text">
              &copy; {new Date().getFullYear()} The Pep Shop. All rights reserved.
            </div>
            <div className="bottom-badges">
              <span className="secure-badge">
                <Lock size={13} /> SSL Encrypted Checkout
              </span>
              <span className="secure-badge">
                <CheckCircle2 size={13} /> ISO 9001 Compliant Synthesis
              </span>
              <button
                type="button"
                onClick={scrollToTop}
                className="footer-bottom-scroll-btn"
                aria-label="Scroll to top"
                title="Scroll to top"
              >
                <ArrowUp size={15} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Modern Scroll-to-Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`modern-scroll-top-btn ${showScrollTop ? 'active' : ''}`}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <span className="scroll-btn-inner">
          <ArrowUp size={19} strokeWidth={2.4} />
        </span>
      </button>
    </footer>
  );
}
