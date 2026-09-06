'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
              <Link href="/" className="footer-brand" aria-label="Drago Pharma">
                <img 
                  src="/images/logo.webp" 
                  alt="Drago Pharma" 
                  className="footer-logo-img" 
                />
              </Link>
              <p className="footer-brand-desc">
                Pioneering bio-molecular peptide synthesis, lyophilized biochemicals, and precision analytical standards strictly for certified research institutions and laboratory investigations.
              </p>

              <div className="footer-contact-items">
                <div className="footer-contact-row">
                  <Mail size={16} className="footer-contact-icon" />
                  <a href="mailto:info@dragopharma.com">info@dragopharma.com</a>
                </div>
              </div>

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
                <li><Link href="/shop?category=fat-loss">Metabolic &amp; Lipid Research</Link></li>
                <li><Link href="/shop?category=muscle-growth">Tissue &amp; Growth Factors</Link></li>
                <li><Link href="/shop?category=recovery">Cellular Recovery &amp; Repair</Link></li>
                <li><Link href="/shop">Lyophilized Solutions</Link></li>
              </ul>
            </div>

            {/* Column 3: Science & Lab */}
            <div className="footer-col">
              <h4 className="footer-col-title">Science &amp; Company</h4>
              <ul className="footer-links">
                <li><Link href="/about-us">About Drago Pharma</Link></li>
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
                <Link href="/faq">Terms of Supply</Link>
                <span className="dot-sep">&bull;</span>
                <Link href="/faq">Privacy Notice</Link>
                <span className="dot-sep">&bull;</span>
                <Link href="/faq">Refund Policy</Link>
              </div>
            </div>
          </div>


          {/* Bottom Bar */}
          <div className="modern-footer-bottom">
            <div className="copyright-text">
              &copy; {new Date().getFullYear()} Drago Pharma Biochemical Research Ltd. All rights reserved.
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
