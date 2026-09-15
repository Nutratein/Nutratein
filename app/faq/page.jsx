'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader.jsx';
import { 
  HelpCircle, 
  ChevronDown, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  FlaskConical,
  Truck,
  RotateCcw
} from 'lucide-react';

const FAQS = [
  {
    id: 'usage',
    category: 'Research & Usage',
    badge: 'Compliance',
    q: 'What are these peptides used for?',
    a: 'All peptides sold on this site are intended strictly for laboratory and investigational research use. They are not approved for human or veterinary use, and are not sold as drugs, supplements, or cosmetics.',
  },
  {
    id: 'purity',
    category: 'Purity & Quality',
    badge: 'Quality Control',
    q: 'How is purity verified?',
    a: 'Each batch is independently tested for purity using High-Performance Liquid Chromatography (HPLC) and Mass Spectrometry (MS). Certificates of Analysis (COA) are available upon request for research customers.',
  },
  {
    id: 'synthesis',
    category: 'Purity & Quality',
    badge: 'Custom Orders',
    q: 'Do you offer custom synthesis?',
    a: 'Yes. Reach out via our Contact page with your target sequence, quantity, and required timeline, and our scientific synthesis team will follow up promptly with a formal quote.',
  },
  {
    id: 'shipping',
    category: 'Orders & Shipping',
    badge: 'Logistics',
    q: 'What is your shipping policy?',
    a: 'Orders are processed immediately after confirmation and shipped via premium tracked courier with protective temperature packaging. Shipping rates and delivery windows are calculated at checkout based on destination.',
  },
  {
    id: 'returns',
    category: 'Orders & Shipping',
    badge: 'Returns',
    q: 'What is your refund policy?',
    a: 'Unopened products in their original manufacturer seal may be returned within 14 days of delivery. Contact our support team with your order number to initiate an authorized return.',
  },
  {
    id: 'wallet-what',
    category: 'Wallet & Payments',
    badge: 'Wallet',
    q: 'What is the Wallet and why would I use it?',
    a: 'Your Wallet is a prepaid balance on your account (available in both USD and CAD) that you can spend on any order or on the Apex Vault membership. Once your balance is loaded, checkout is instant — you don\'t need to wait for a new wire transfer to clear on every single order.',
  },
  {
    id: 'wallet-topup',
    category: 'Wallet & Payments',
    badge: 'Wire Transfer',
    q: 'How do I add money to my Wallet?',
    a: 'Go to Account → Wallet → "Add Money to Wallet". Choose USD or CAD and enter an amount, and you\'ll be shown our bank wire details for that currency. Send the wire from your bank, then submit the request with your wire reference number (and optionally a screenshot of the transfer as proof). Your request appears as "Pending" until we verify it.',
  },
  {
    id: 'wallet-approval',
    category: 'Wallet & Payments',
    badge: 'Approval Time',
    q: 'How long does a Wallet top-up take to be approved?',
    a: 'Once we confirm the wire has actually landed in our bank account, approval is usually done within a few hours. Your Wallet balance updates automatically the moment it\'s approved — you\'ll see it reflected on your Account → Wallet page.',
  },
  {
    id: 'wallet-checkout',
    category: 'Wallet & Payments',
    badge: 'Checkout',
    q: 'How do I pay for an order with my Wallet?',
    a: 'At checkout, under Payment Preference, select "Pay with USD Wallet" or "Pay with CAD Wallet". If your balance covers the order, it\'s confirmed instantly — no wire transfer needed for that order. If your balance is too low, that option is disabled until you top up.',
  },
  {
    id: 'wallet-currency',
    category: 'Wallet & Payments',
    badge: 'USD vs CAD',
    q: 'What\'s the difference between the USD and CAD Wallet?',
    a: 'They\'re two separate balances. All product prices are set in USD, so paying with your USD Wallet deducts the exact listed price. Paying with your CAD Wallet converts the USD order total to CAD using our current posted exchange rate at the moment of purchase, then deducts that amount from your CAD balance.',
  },
];

const CATEGORIES = ['All', 'Research & Usage', 'Purity & Quality', 'Orders & Shipping', 'Wallet & Payments'];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('All');
  // First item open by default
  const [openItems, setOpenItems] = useState({ usage: true });

  // Open + scroll to a specific FAQ when arriving via a link like /faq#wallet-what
  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (hash && FAQS.some((f) => f.id === hash)) {
      setOpenItems((prev) => ({ ...prev, [hash]: true }));
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  const toggleItem = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = activeCategory === 'All' 
    ? FAQS 
    : FAQS.filter((faq) => faq.category === activeCategory);

  return (
    <div className="faq-page-wrapper">
      {/* 1. UNIFIED PAGE HERO */}
      <PageHeader
        badge="FREQUENTLY ASKED QUESTIONS"
        badgeIcon={HelpCircle}
        title="Answers to Common"
        titleHighlight="Research Inquiries"
        subtitle="Transparent information regarding our compound purity standards, laboratory compliance, custom synthesis, and delivery protocols."
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'FAQ' }
        ]}
      />

      {/* 2. MAIN CONTENT CONTAINER */}
      <div className="faq-container">
        {/* Category Filter Pills */}
        <div className="faq-filter-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`faq-filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Interactive Accordion */}
        <div className="faq-accordion-list">
          {filteredFaqs.map((item) => {
            const isOpen = !!openItems[item.id];
            return (
              <div key={item.id} id={item.id} className={`faq-card ${isOpen ? 'open' : ''}`} style={{ scrollMarginTop: 100 }}>
                <button
                  className="faq-card-header"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                >
                  <div className="faq-question-wrap">
                    <span className="faq-badge">{item.badge}</span>
                    <span className="faq-question-text">{item.q}</span>
                  </div>
                  <ChevronDown size={18} className="faq-chevron" />
                </button>

                {isOpen && (
                  <div className="faq-card-body">
                    <p className="faq-answer-text">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Laboratory Research Disclaimer */}
        <div className="faq-disclaimer-card">
          <div className="faq-disclaimer-icon">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3>Laboratory Research Disclaimer</h3>
            <p>
              All products listed and supplied by The Pep Shop are intended solely for in-vitro scientific research and investigational laboratory use. They are not approved by any regulatory body for human or veterinary use, and must not be used as pharmaceuticals, medical devices, dietary supplements, or cosmetics.
            </p>
          </div>
        </div>

        {/* Still Have Questions Box */}
        <div className="faq-support-card">
          <div className="faq-support-text">
            <h4>Still Have Questions?</h4>
            <p>Can&apos;t find the specific information you need? Connect directly with our laboratory and support specialists.</p>
          </div>
          <Link href="/contact-us" className="faq-support-btn">
            <span>Contact Support</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
