'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, ChevronRight, Gem } from 'lucide-react';
import { getSiteContent } from '@/lib/siteContent';
import ProductCard from '@/components/ProductCard.jsx';
import Reveal from '@/components/Reveal.jsx';
import Marquee from '@/components/Marquee.jsx';
import AnimatedCounter from '@/components/AnimatedCounter.jsx';
import TestimonialCarousel from '@/components/TestimonialCarousel.jsx';
import MembershipCard from '@/components/MembershipCard.jsx';

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const CATEGORY_META = [
  { slug: 'fat-loss', name: 'Fat Loss', count: '1 items', theme: 'fat-loss', image: '/images/cat-fat-loss.jpg' },
  { slug: 'muscle-growth', name: 'Muscle Growth', count: '1 items', theme: 'muscle-growth', image: '/images/cat-muscle-growth.jpg' },
  { slug: 'recovery', name: 'Recovery', count: '1 items', theme: 'recovery', image: '/images/cat-recovery.jpg' },
];

const WHY_US_CARDS = [
  {
    num: '01',
    title: 'Third-Party Tested',
    desc: 'Every batch is verified by an independent lab for purity and identity before it ships.',
    action: 'Verified Quality',
    iconBg: '#fef2f2',
    iconBorder: '#fee2e2',
    iconColor: '#c1121f',
    cornerImg: '/images/feature-flask.png',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18h8" />
        <path d="M3 22h18" />
        <path d="m14 22 .5-4.5" />
        <circle cx="9" cy="9" r="2" />
        <path d="M12 18a5 5 0 0 0 4.8-3.6L18 8a3 3 0 0 0-3-3l-6.4 1.6" />
        <path d="m7 18 3-10" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Fast, Discreet Shipping',
    desc: 'Orders ship within 24 hours in unmarked, temperature-safe packaging.',
    action: 'Global Delivery',
    iconBg: '#eff6ff',
    iconBorder: '#dbeafe',
    iconColor: '#c1121f',
    cornerImg: '/images/feature-shipping.png',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Secure Checkout',
    desc: 'Encrypted payments and privacy-first order handling, every time.',
    action: 'Your Data, Protected',
    iconBg: '#f0fdf4',
    iconBorder: '#dcfce7',
    iconColor: '#c1121f',
    cornerImg: '/images/feature-shield.png',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Custom Synthesis',
    desc: 'Need a specific sequence or quantity? Our lab can synthesize to spec.',
    action: 'Tailored for You',
    iconBg: '#faf5ff',
    iconBorder: '#f3e8ff',
    iconColor: '#c1121f',
    cornerImg: '/images/feature-molecule.png',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15c6.667-6 13.333 0 20-6"></path>
        <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"></path>
        <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"></path>
        <path d="m17 6-2.5-2.5"></path>
        <path d="m14 8-4-4"></path>
        <path d="m7 18 2.5 2.5"></path>
        <path d="m10 16 4 4"></path>
      </svg>
    ),
  },
];

function getStatIcon(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('peptide') || l.includes('research') || l.includes('lab') || l.includes('product')) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31L4.15 19.4A2 2 0 0 0 5.86 22h12.28a2 2 0 0 0 1.71-2.6L14 9.31V2" />
        <path d="M8.5 2h7" />
        <path d="M7 16h10" />
        <circle cx="10" cy="18.5" r="0.8" fill="currentColor" />
        <circle cx="13.5" cy="17.5" r="0.8" fill="currentColor" />
        <circle cx="12" cy="19.5" r="0.6" fill="currentColor" />
      </svg>
    );
  }
  if (l.includes('countr') || l.includes('world') || l.includes('global') || l.includes('ship')) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    );
  }
  if (l.includes('order') || l.includes('fulfill') || l.includes('pack') || l.includes('deliver')) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16.5 9.4 4.5-2.8L12 2 3 6.6l4.5 2.8" />
        <path d="M12 22V12" />
        <path d="M21 7.6v8.8a2 2 0 0 1-1 1.7l-7 4.1a2 2 0 0 1-2 0l-7-4.1a2 2 0 0 1-1-1.7V7.6" />
        <path d="M3.3 7 12 12l8.7-5" />
      </svg>
    );
  }
  if (l.includes('purity') || l.includes('pure') || l.includes('safe') || l.includes('grade') || l.includes('qualit')) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// Fallback content shown if the admin hasn't saved anything to site_content
// yet (or the request fails) — the homepage should never look broken.
const DEFAULT_CONTENT = {
  hero: {
    eyebrow: 'Research Peptides & Custom Synthesis',
    title: 'Peptides for Revitalization & Health',
    subtitle:
      'Drago Pharma supplies high-purity peptides synthesized for laboratory and investigational research, with bulk supply and custom synthesis available.',
    primary_cta_label: 'Shop Peptides',
    primary_cta_link: '/shop',
    secondary_cta_label: 'Request a Quote',
    secondary_cta_link: '/contact-us',
  },
  trust_badges: ['Third-Party Tested', 'Ships in 24h', 'USA Based Lab', '>99% Purity', 'Secure Checkout'],
  stats: [
    { label: 'Research Peptides', value: 40, suffix: '+' },
    { label: 'Countries Shipped', value: 25, suffix: '+' },
    { label: 'Orders Fulfilled', value: 12000, suffix: '+' },
    { label: 'Avg. Purity', value: 99, suffix: '%' },
  ],
  features: [
    { icon: '🧪', title: 'Third-Party Tested', text: 'Every batch is verified by an independent lab for purity and identity.' },
    { icon: '🚚', title: 'Fast, Discreet Shipping', text: 'Orders ship within 24 hours in unmarked, temperature-safe packaging.' },
    { icon: '🔒', title: 'Secure Checkout', text: 'Encrypted payments and privacy-first order handling, every time.' },
    { icon: '🧬', title: 'Custom Synthesis', text: 'Need a specific sequence or quantity? Our lab can synthesize to spec.' },
  ],
  testimonials: [
    { quote: "Consistent purity batch after batch, and support actually answers questions fast.", author: "Dr. M. Alvarez", role: "Biotech Researcher" },
    { quote: "Packaging is careful, temperature-controlled, and shipping was quicker than I expected.", author: "J. Whitfield", role: "Verified Buyer" },
    { quote: "COAs and third-party HPLC reports are posted for every single batch — exactly what I look for in a supplier.", author: "Dr. R. Chen", role: "Senior Lab Researcher" },
  ],
  promo: { enabled: true, text: 'Free shipping on all orders over $150', link_label: 'Shop Now', link: '/shop' },
  newsletter: { title: 'Stay in the loop', subtitle: 'Get restock alerts, new COAs, and research notes — no spam.' },
  membership: {
    enabled: true,
    eyebrow: 'ELITE RESEARCH ACCESS',
    title: 'What Is The',
    title_highlight: 'Apex Vault',
    title_after: 'Membership?',
    plan_label: 'APEX VAULT MEMBERSHIP',
    plan_duration: 'ONE RESEARCHER • ONE YEAR',
    benefits_heading: 'EXCLUSIVE BENEFITS',
    benefits: [
      { title: 'Priority Batch Reservations', text: 'First access to every new synthesis run before it goes live to the public.' },
      { title: 'Private Research Line', text: 'A direct line to our lab team for sourcing, dosing protocols, and COA questions.' },
      { title: 'Custom Synthesis Credits', text: 'Annual credit toward bespoke peptide sequences synthesized to your exact spec.' },
      { title: 'Concierge Cold-Chain Shipping', text: 'Guaranteed next-day dispatch with white-glove, discreet packaging.' },
    ],
    price: '$2,497.00',
    price_note: 'USD / year — billed annually. Limited seats available.',
    cta_label: 'Unlock The Vault',
    cta_link: '/contact-us',
    closing_text: 'Built for institutions and independent researchers who need more than a storefront — a dedicated supply partner.',
  },
};

const FALLBACK_FEATURED = [
  {
    id: 'follistatin',
    name: 'Follistatin',
    slug: 'follistatin',
    short_desc: 'Research peptide studied for muscle-related pathways.',
    price: 149.95,
    image_url: '/images/follistatin-1-300x300.webp',
    featured: true,
  },
  {
    id: 'frag-176-191',
    name: 'FRAG 176-191',
    slug: 'frag-176-191',
    short_desc: 'Fragment peptide studied in fat metabolism research.',
    price: 34.95,
    image_url: '/images/fragment-1-300x300.webp',
    featured: true,
  },
  {
    id: 'bpc-157',
    name: 'BPC-157 — 5mg',
    slug: 'bpc-157',
    short_desc: 'Widely studied peptide for tissue repair research.',
    price: 49.99,
    image_url: '/images/bpc-157-300x300.webp',
    featured: true,
  },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const prevSlide = () => {
    setCarouselIndex((prev) => (prev <= 0 ? (featured.length > 0 ? featured.length - 1 : 0) : prev - 1));
  };
  const nextSlide = () => {
    setCarouselIndex((prev) => (prev >= featured.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    let active = true;
    supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) {
          if (data && data.length > 0) {
            setFeatured(data);
          } else {
            setFeatured(FALLBACK_FEATURED);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setFeatured(FALLBACK_FEATURED);
          setLoading(false);
        }
      });

    getSiteContent('home', DEFAULT_CONTENT).then((value) => {
      if (active && value) {
        setContent({
          ...DEFAULT_CONTENT,
          ...value,
          membership: { ...DEFAULT_CONTENT.membership, ...(value?.membership || {}) },
        });
      }
    });

    return () => { active = false; };
  }, []);

  const { hero, trust_badges, stats, features, testimonials, promo, newsletter, membership } = content;

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  }

  return (
    <>
      <section className="new-hero">
        <div className="container new-hero-container">
          <div className="new-hero-content">
            <motion.div 
              className="new-hero-eyebrow"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              RESEARCH &nbsp;•&nbsp; INNOVATION &nbsp;•&nbsp; BETTER HEALTH
            </motion.div>
            
            <motion.h1 
              className="new-hero-title"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Peptides for <br className="hidden md:block"/>
              <span className="text-brand">Revitalization &amp;</span> <br className="hidden md:block"/>
              Health
            </motion.h1>
            
            <motion.p 
              className="new-hero-subtitle"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {hero.subtitle ||
                'Drago Pharma supplies high-purity peptides synthesized for laboratory and investigational research, with bulk supply and custom synthesis available.'}
            </motion.p>
            
            <motion.div 
              className="new-hero-cta-row"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href={hero.primary_cta_link || '/shop'} className="new-btn-primary">
                  {hero.primary_cta_label || 'Shop Peptides'}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href={hero.secondary_cta_link || '/contact-us'} className="new-btn-secondary">
                  {hero.secondary_cta_label || 'Request a Quote'}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/membership" className="new-btn-membership">
                  <Gem size={16} />
                  Apex Vault Membership
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="new-hero-trust-bar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="new-trust-item">
                <div className="new-trust-icon">
                  <div className="icon-bg"></div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8102e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div className="new-trust-text">
                  <strong>&gt;99%</strong>
                  <span>Purity Verified</span>
                </div>
              </div>
              <div className="new-trust-item">
                <div className="new-trust-icon">
                  <div className="icon-bg"></div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8102e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"></path><line x1="8" y1="16" x2="16" y2="16"></line></svg>
                </div>
                <div className="new-trust-text">
                  <strong>Lab Tested</strong>
                  <span>Quality Assured</span>
                </div>
              </div>
              <div className="new-trust-item">
                <div className="new-trust-icon">
                  <div className="icon-bg"></div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8102e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </div>
                <div className="new-trust-text">
                  <strong>Worldwide</strong>
                  <span>Research Supply</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="new-hero-bottom-tag"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <span className="tag-line"></span>
              <div className="tag-text">
                ADVANCING SCIENCE<br/>
                FOR A HEALTHIER TOMORROW
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            className="new-hero-visual"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <img src="/images/hero_img/hero_product_img.png" alt="Drago Pharma Product Showcase" className="new-hero-product-image" />
          </motion.div>
        </div>
      </section>

      {trust_badges?.length > 0 && <Marquee items={trust_badges} />}

      {stats?.length > 0 && (
        <section className="section stats-section">
          <div className="stats-decor-bg" aria-hidden="true">
            <div className="stats-decor-orb-left" />
            <div className="stats-decor-orb-right" />
            <svg className="stats-decor-wave" viewBox="0 0 1440 280" fill="none" preserveAspectRatio="none">
              <path d="M-100 140 C 250 240, 520 60, 850 170 C 1150 240, 1300 80, 1600 140" stroke="rgba(200, 16, 46, 0.13)" strokeWidth="1.5" />
              <path d="M-100 170 C 280 270, 550 90, 880 190 C 1180 260, 1330 110, 1600 160" stroke="rgba(200, 16, 46, 0.08)" strokeWidth="1.2" />
              <path d="M-100 110 C 220 210, 490 30, 820 150 C 1120 220, 1270 50, 1600 120" stroke="rgba(200, 16, 46, 0.05)" strokeWidth="1" />
            </svg>
          </div>

          <div className="container">
            <div className="stats-row">
              {stats.map((s, i) => (
                <Reveal as="div" className="stat stat-card" key={s.label} delay={i * 0.08}>
                  <div className="stat-icon-wrapper" aria-hidden="true">
                    {getStatIcon(s.label)}
                  </div>
                  <AnimatedCounter value={Number(s.value) || 0} suffix={s.suffix || ''} />
                  <div className="stat-dash" aria-hidden="true" />
                  <span className="stat-label">{s.label}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {membership?.enabled !== false && (
        <section className="membership-section">
          <div className="container">
            <MembershipCard membership={membership} />
          </div>
        </section>
      )}

      <section className="section category-section-wrap">
        <div className="container">
          <Reveal as="div" className="category-header-wrap">
            <div className="category-header-left">
              <div className="category-eyebrow-row">
                <span className="category-eyebrow-dash"></span>
                <span className="category-eyebrow-text">EXPLORE OUR RANGE</span>
              </div>
              <h2 className="category-main-title">
                Essential <span className="text-red-highlight">Peptide</span> Categories
              </h2>
              <p className="category-subtitle">
                Essential peptides for research use only, not for human or veterinary use.
              </p>
            </div>
          </Reveal>

          <Reveal as="div" className="category-cards-grid" delay={0.1}>
            {CATEGORY_META.map((cat) => (
              <div key={cat.slug} className="category-card-col">
                <Link href={`/shop?category=${cat.slug}`} className={`cat-banner-card cat-theme-${cat.theme}`}>
                  <div
                    className="cat-card-bg"
                    style={{ backgroundImage: `url(${cat.image})` }}
                  />
                  <div className="cat-card-overlay" />
                  <div className="cat-card-content">
                    <div className="cat-pill-badge">
                      <span>{cat.count}</span>
                    </div>
                    <div className="cat-card-title-group">
                      <span className="cat-vertical-line" />
                      <h3 className="cat-title-text">{cat.name}</h3>
                    </div>
                    <div className="cat-card-footer">
                      <span className="cat-footer-action">Check it out</span>
                      <span className="cat-circle-arrow">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </Reveal>

          <div className="category-browse-more-wrap">
            <Link href="/shop" className="category-browse-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
              </svg>
              <span>Browse Peptides</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>
        </div>
      </section>

     

      {/* Featured Peptides Section */}
      <section className="featured-peptides-section">
        <div className="container featured-peptides-inner">
          {/* Top Decorative Tag - Advancing Science Together */}
          <div className="advancing-tag" aria-hidden="true">
            <span>ADVANCING</span>
            <span>SCIENCE</span>
            <span>TOGETHER</span>
            <div className="advancing-tag-line" />
          </div>

          <Reveal as="div" className="featured-peptides-head">
            <div className="featured-peptides-eyebrow-wrap">
              <span className="featured-eyebrow-line" />
              <span className="featured-eyebrow-text">FEATURED</span>
              <span className="featured-eyebrow-line" />
            </div>
            <h2 className="featured-peptides-title">
              Popular Research <span className="text-red-highlight">Peptides</span>
            </h2>
            <p className="featured-peptides-sub">
              High-purity peptides for advanced research and discovery.
            </p>
          </Reveal>

          {loading ? (
            <p className="text-center" style={{ padding: '40px 0' }}>Loading products…</p>
          ) : (
            <div className="featured-carousel-wrapper">
              {/* Desktop Responsive Grid */}
              <div className="featured-desktop-grid">
                {featured.map((p) => (
                  <div key={p.id} className="featured-grid-item">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {/* Mobile 1-Product Carousel with Left & Right Arrow Buttons */}
              <div className="featured-mobile-carousel-box">
                {featured.length > 1 && (
                  <button
                    type="button"
                    className="featured-mobile-arrow left"
                    onClick={prevSlide}
                    aria-label="Previous featured product"
                  >
                    <ChevronLeft size={22} strokeWidth={2.4} />
                  </button>
                )}

                <div className="featured-mobile-slide-holder">
                  <AnimatePresence mode="wait">
                    {featured[carouselIndex] && (
                      <motion.div
                        key={featured[carouselIndex].id || carouselIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className="featured-mobile-card-wrap"
                      >
                        <ProductCard product={featured[carouselIndex]} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {featured.length > 1 && (
                  <button
                    type="button"
                    className="featured-mobile-arrow right"
                    onClick={nextSlide}
                    aria-label="Next featured product"
                  >
                    <ChevronRight size={22} strokeWidth={2.4} />
                  </button>
                )}
              </div>

              {/* Mobile Carousel Indicators (Dots & Count) */}
              {featured.length > 1 && (
                <div className="featured-mobile-dots-bar">
                  <div className="featured-dots-list">
                    {featured.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`featured-carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                        onClick={() => setCarouselIndex(idx)}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <span className="featured-carousel-counter">
                    {carouselIndex + 1} / {featured.length}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="featured-peptides-cta-wrap">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link href="/shop" className="featured-view-all-btn">
                <span>View All Peptides</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </motion.div>
          </div>

          {/* Bottom Accent Labels */}
          <div className="featured-bottom-accents" aria-hidden="true" >
            <div className="accent-left">
              <span>RESEARCH</span>
              <span className="accent-dot">•</span>
              <span>INNOVATION</span>
              <span className="accent-dot">•</span>
              <span>BETTER HEALTH</span>
            </div>
            <div className="accent-right">
              <span className="accent-line" />
              <span className="accent-brand">DRAGO PHARMA</span>
            </div>
          </div>
        </div>
      </section>


       {/* Why Drago Pharma Section */}
      <section className="why-drago-section">
        <div className="why-drago-overlay" />
        <div className="container why-drago-inner">
          <Reveal as="div" className="why-drago-head">
            <div className="why-drago-eyebrow-wrap">
              <span className="why-drago-eyebrow-line" />
              <span className="why-drago-eyebrow-text">WHY DRAGO PHARMA</span>
              <span className="why-drago-eyebrow-line" />
            </div>
            <h2 className="why-drago-title">
              Built for <span className="text-red-highlight">serious researchers</span>
            </h2>
            <p className="why-drago-sub">
              Trusted quality. Reliable supply. Real support for your research.
            </p>
          </Reveal>

          <Reveal as="div" className="why-drago-grid" delay={0.1}>
            {WHY_US_CARDS.map((card) => (
              <motion.div
                key={card.num}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="why-card"
              >
                <div className="why-card-top">
                  <div
                    className="why-icon-badge"
                    style={{
                      backgroundColor: card.iconBg,
                      border: `1px solid ${card.iconBorder}`,
                      color: card.iconColor,
                    }}
                  >
                    {card.icon}
                  </div>
                  <span className="why-card-num">{card.num}</span>
                </div>

                <h3 className="why-card-title">{card.title}</h3>
                <p className="why-card-desc">{card.desc}</p>

                <div className="why-card-bottom">
                  <Link href="/shop" className="why-action-pill">
                    <span className="why-pill-arrow">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                    <span>{card.action}</span>
                  </Link>

                  <img
                    src={card.cornerImg}
                    alt=""
                    className="why-corner-graphic"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {promo?.enabled && (
        <section className="promo-banner-section">
          <div className="container">
            <Reveal as="div" className="promo-banner-card">
              {/* Background 3D Artwork Layer on the right */}
              <div className="promo-banner-art-wrap" aria-hidden="true">
                <img
                  src="/images/promo-shipping-art.jpg"
                  alt="Free shipping delivery truck and parcel packages"
                  className="promo-banner-art-img"
                  loading="lazy"
                />
                <div className="promo-banner-art-overlay" />
              </div>

              {/* Foreground Content on the left */}
              <div className="promo-banner-content">
                {/* Eyebrow */}
                <div className="promo-eyebrow-row">
                  <span className="promo-eyebrow-dash" />
                  <span className="promo-eyebrow-text">LIMITED TIME OFFER</span>
                </div>

                {/* Main Heading */}
                <h2 className="promo-banner-heading">
                  <span className="promo-highlight-red">Free</span> Shipping
                </h2>

                {/* Subheading */}
                <p className="promo-banner-subheading">
                  on all orders over <span className="promo-highlight-red">$150</span>
                </p>

                {/* 3 Trust Features */}
                <div className="promo-features-row">
                  <div className="promo-feature-item">
                    <div className="promo-feature-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div className="promo-feature-label">
                      <span className="feature-main">Secure</span>
                      <span className="feature-sub">Checkout</span>
                    </div>
                  </div>

                  <span className="promo-feature-sep" />

                  <div className="promo-feature-item">
                    <div className="promo-feature-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </div>
                    <div className="promo-feature-label">
                      <span className="feature-main">Fast</span>
                      <span className="feature-sub">Delivery</span>
                    </div>
                  </div>

                  <span className="promo-feature-sep" />

                  <div className="promo-feature-item">
                    <div className="promo-feature-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div className="promo-feature-label">
                      <span className="feature-main">Trusted</span>
                      <span className="feature-sub">Worldwide</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="promo-cta-row">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Link href={promo?.link || '/shop'} className="promo-action-btn">
                      <span>{promo?.link_label || 'Shop Now'}</span>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </motion.div>
                </div>

                {/* Bottom Micro Tag */}
                <div className="promo-micro-tagline">
                  QUALITY RESEARCH SUPPLIES. DELIVERED TO YOU.
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {testimonials?.length > 0 && (
        <section className="testimonials-section">
          <div className="container">
            <Reveal as="div" className="testimonials-head">
              <div className="testimonials-eyebrow-wrap">
                <span className="testimonials-eyebrow-line" />
                <span className="testimonials-eyebrow-text">TRUSTED BY RESEARCHERS</span>
                <span className="testimonials-eyebrow-line" />
              </div>
              <h2 className="testimonials-title">
                What <span className="text-red-highlight">Buyers & Researchers</span> Are Saying
              </h2>
              <p className="testimonials-sub">
                Real feedback from verified research laboratories, universities, and biotech professionals.
              </p>
            </Reveal>
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>
      )}

      <section className="disclaimer-section">
        <Reveal as="div" className="disclaimer-card">
          {/* Background Laboratory Visuals Layer */}
          <div className="disclaimer-art-wrap" aria-hidden="true">
            <img
              src="/images/disclaimer-lab-bg.jpg"
              alt="Laboratory research background with microscope and test tubes"
              className="disclaimer-art-img"
              loading="lazy"
            />
            <div className="disclaimer-art-overlay" />
          </div>

          <div className="container">
            <div className="disclaimer-inner-grid">
              {/* Left spacer / visual anchor for desktop microscope */}
              <div className="disclaimer-left-visual-anchor" aria-hidden="true" />

              {/* Center Content */}
              <div className="disclaimer-center-content">
                {/* Laboratory Flask Icon */}
                <div className="disclaimer-flask-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
                    <path d="M8.5 2h7" />
                    <path d="M7 16h10" />
                  </svg>
                </div>

                {/* Eyebrow */}
                <div className="disclaimer-eyebrow-row">
                  <span className="disclaimer-dash" />
                  <span className="disclaimer-eyebrow-text">LABORATORY</span>
                  <span className="disclaimer-dash" />
                </div>

                {/* Main Heading */}
                <h2 className="disclaimer-heading">
                  Research <span className="disclaimer-highlight-red">Disclaimer</span>
                </h2>

                {/* Subtitle */}
                <p className="disclaimer-text">
                  All products are intended strictly for research purposes and are not approved for human or veterinary use.
                </p>

                {/* CTA Button */}
                <div className="disclaimer-cta-wrap">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Link href="/faq" className="disclaimer-btn">
                      <span>View Details</span>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </motion.div>
                </div>
              </div>

              {/* Right Badges Column (3 circular compliance badges) */}
              <div className="disclaimer-badges-col">
                <div className="disclaimer-badge-item">
                  <div className="badge-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 18h8" />
                      <path d="M3 22h18" />
                      <path d="m14 22 3-3 3 3" />
                      <circle cx="12" cy="9" r="2" />
                      <path d="m14 11-4-4" />
                      <path d="M9 22V8a5 5 0 0 1 5-5v0" />
                    </svg>
                  </div>
                  <div className="badge-text-wrap">
                    <span className="badge-title">RESEARCH</span>
                    <span className="badge-sub">ONLY</span>
                  </div>
                </div>

                <div className="disclaimer-badge-item">
                  <div className="badge-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                  </div>
                  <div className="badge-text-wrap">
                    <span className="badge-title">NOT FOR</span>
                    <span className="badge-sub">HUMAN USE</span>
                  </div>
                </div>

                <div className="disclaimer-badge-item">
                  <div className="badge-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="4.5" cy="9.5" r="2.5" />
                      <circle cx="9" cy="5.5" r="2.5" />
                      <circle cx="15" cy="5.5" r="2.5" />
                      <circle cx="19.5" cy="9.5" r="2.5" />
                      <path d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.49-.78-.53-1.8-.87-2.86-.87s-2.08.34-2.86.87c-.88.6-1.61 1.47-2.48 2.49-1.01 1.18-2.16 2.52-2.16 3.64 0 1.93 2.12 3.5 5 3.5.8 0 1.63-.12 2.5-.37.87.25 1.7.37 2.5.37 2.88 0 5-1.57 5-3.5 0-1.12-1.15-2.46-2.16-3.64z" />
                    </svg>
                  </div>
                  <div className="badge-text-wrap">
                    <span className="badge-title">NOT FOR</span>
                    <span className="badge-sub">VETERINARY USE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {newsletter?.title && (
        <section className="section newsletter-section">
          <div className="container">
            <Reveal as="div" className="newsletter-card">
              {/* Background Decorative Dots Matrix */}
              <div className="newsletter-dot-grid" aria-hidden="true" />

              {/* Card Ambient Background Glows */}
              <div className="newsletter-ambient-glow" aria-hidden="true" />
              <div className="newsletter-ambient-shape-1" aria-hidden="true" />
              <div className="newsletter-ambient-shape-2" aria-hidden="true" />

              <div className="newsletter-card-inner">
                {/* Left Content Area */}
                <div className="newsletter-content-col">
                  {/* Eyebrow Pill */}
                  <div className="newsletter-eyebrow">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>JOIN OUR NEWSLETTER</span>
                  </div>

                  {/* Heading */}
                  <h2 className="newsletter-title">
                    Stay in the <span className="newsletter-title-accent">Loop</span>
                  </h2>

                  {/* Subtitle */}
                  <p className="newsletter-subtitle">
                    {newsletter.subtitle || 'Get restock alerts, new COAs, and research notes — no spam.'}
                  </p>

                  {/* Form / Subscribed state */}
                  {subscribed ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="newsletter-success-box"
                    >
                      <div className="newsletter-success-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="newsletter-success-text">
                        <strong>You're on the list! 🎉</strong>
                        <span>Watch your inbox for restock drops and research insights.</span>
                      </div>
                    </motion.div>
                  ) : (
                    <form className="newsletter-form-pill" onSubmit={handleSubscribe}>
                      <div className="newsletter-form-input-box">
                        <div className="newsletter-mail-icon" aria-hidden="true">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="newsletter-input text-dark"
                          aria-label="Email address for newsletter"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="newsletter-submit-btn"
                        type="submit"
                      >
                        <span>Subscribe</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </motion.button>
                    </form>
                  )}

                  {/* Feature Badges Row */}
                  <div className="newsletter-features-row">
                    <div className="newsletter-feature-item">
                      <div className="newsletter-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 12 20 22 4 22 4 12" />
                          <rect width="20" height="5" x="2" y="7" />
                          <line x1="12" y1="22" x2="12" y2="7" />
                          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                        </svg>
                      </div>
                      <div className="newsletter-feature-text">
                        <span className="newsletter-feat-title">New Product</span>
                        <span className="newsletter-feat-sub">Updates</span>
                      </div>
                    </div>

                    <div className="newsletter-feature-divider" aria-hidden="true" />

                    <div className="newsletter-feature-item">
                      <div className="newsletter-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                      </div>
                      <div className="newsletter-feature-text">
                        <span className="newsletter-feat-title">Restock</span>
                        <span className="newsletter-feat-sub">Alerts</span>
                      </div>
                    </div>

                    <div className="newsletter-feature-divider" aria-hidden="true" />

                    <div className="newsletter-feature-item">
                      <div className="newsletter-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </div>
                      <div className="newsletter-feature-text">
                        <span className="newsletter-feat-title">Research</span>
                        <span className="newsletter-feat-sub">Notes</span>
                      </div>
                    </div>

                    <div className="newsletter-feature-divider" aria-hidden="true" />

                    <div className="newsletter-feature-item">
                      <div className="newsletter-feature-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                      </div>
                      <div className="newsletter-feature-text">
                        <span className="newsletter-feat-title">No Spam</span>
                        <span className="newsletter-feat-sub">Promise</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Visual Col */}
                <div className="newsletter-visual-col" aria-hidden="true">
                  <div className="newsletter-art-box">
                    <img
                      src="/images/newsletter-envelope-3d.png"
                      alt="Newsletter 3D notification envelope"
                      className="newsletter-art-img"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
