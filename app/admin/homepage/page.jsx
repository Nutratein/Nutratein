'use client';

import { useEffect, useState } from 'react';
import { getSiteContent, saveSiteContent } from '@/lib/siteContent';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Save,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Mail,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const DEFAULT_CONTENT = {
  hero: {
    eyebrow: '',
    title: '',
    subtitle: '',
    primary_cta_label: 'Shop Peptides',
    primary_cta_link: '/shop',
    secondary_cta_label: 'Request a Quote',
    secondary_cta_link: '/contact-us',
    bg_image_url: '',
    product_image_url: '',
  },
  trust_badges: [],
  stats: [],
  features: [],
  testimonials: [],
  promo: { enabled: false, text: '', link_label: 'Shop Now', link: '/shop' },
  newsletter: { title: '', subtitle: '' },
  contact: {
    email: 'info@thepepshop.com',
    hours_line1: 'Monday – Friday, 9am – 5pm',
    hours_line2: 'EST timezone. Typical reply time is within 2–4 hours.',
    facility_name: 'The Pep Shop Bio-Molecular Headquarters',
    address_line: 'Technology Square Bio-Hub, Cambridge, MA 02139 • United States',
    directions_url: 'https://maps.google.com/?q=Technology+Square,+Cambridge,+MA+02139',
    map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2948.176313364421!2d-71.0924976234399!3d42.36219197119294!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e370a599ec51a1%3A0x6b1069b2d35ba49b!2sTechnology%20Square%2C%20Cambridge%2C%20MA%2002139!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus',
    receiving_hours: 'Receiving Dock: Mon–Fri, 8am–4pm EST',
    logistics_note: 'Cold-Chain Express Logistics Dispatch Hub',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    social_linkedin: '',
    social_youtube: '',
  },
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
    cta_link: '/membership#buy-with-wallet',
    closing_text: 'Built for institutions and independent researchers who need more than a storefront — a dedicated supply partner.',
    // Dedicated /membership page content
    intro_heading: 'Priority Access, Reserved',
    intro_paragraph_1:
      'The Apex Vault is an exclusive, one-year membership for researchers and institutions who order often enough that reliability matters more than anything else. Instead of competing with every other buyer when a popular batch restocks, members get first access, a standing credit toward custom synthesis work, and a private line straight to our lab team for sourcing and protocol questions.',
    intro_paragraph_2:
      'It sits on top of everything The Pep Shop already does — third-party HPLC/MS purity testing, discreet cold-chain shipping, and full COAs on every batch — it just guarantees you never have to wait in line for it.',
    image_1_url: '',
    image_1_alt: 'Apex Vault Membership',
    image_2_url: '',
    image_2_alt: 'The Pep Shop research lab',
    who_cards: [
      { title: 'Research Labs & Universities', text: 'Institutional buyers who need dependable, repeat supply across multiple sequences and study cycles.' },
      { title: 'High-Volume Researchers', text: 'Independent researchers who order often enough that a stockout or a slow reply actually costs them time.' },
      { title: 'Custom Synthesis Clients', text: 'Anyone who regularly needs bespoke sequences, purity grades, or quantities outside the standard catalog.' },
    ],
    // Page header
    page_badge: 'ELITE RESEARCH ACCESS',
    page_title: 'The',
    page_title_highlight: 'Apex Vault',
    page_subtitle: 'A limited annual membership for research labs and institutions who need priority supply, direct lab access, and a dedicated partner behind every order.',
    // Intro band
    page_eyebrow: 'What Is The Apex Vault Membership?',
    join_card_text: 'Seats are intentionally limited so our lab team can give every member real, personal attention.',
    // Who it's for
    who_heading: "Who It's For",
    // Lab banner caption
    lab_banner_eyebrow: 'Behind The Vault',
    lab_banner_heading: 'Inside Our Research Lab',
    // FAQ
    faq_tag: 'QUESTIONS',
    faq_heading: 'Membership Questions, Answered',
    faq_subtitle: 'Everything researchers ask before applying for Apex Vault access.',
    faqs: [
      { q: 'What exactly is the Apex Vault Membership?', a: 'It’s an annual membership for serious researchers and institutions who need more than a standard storefront relationship. Members get priority access to new synthesis runs, a direct line to our lab team, annual custom-synthesis credit, and guaranteed concierge shipping — all backed by the same third-party purity testing every The Pep Shop order already includes.' },
      { q: 'How much does it cost and how do I pay?', a: 'Current pricing and billing terms are shown above in the membership card. It’s billed once per year, and seats are intentionally limited so our lab team can give every member real, personal attention rather than spreading support thin.' },
      { q: 'Who is this membership actually for?', a: 'Labs, universities, and independent researchers who order regularly and need reliability more than anything — guaranteed stock on the sequences they rely on, faster answers when they have sourcing or protocol questions, and a standing credit toward custom synthesis work they’d otherwise have to quote from scratch every time.' },
      { q: 'How does the custom synthesis credit work?', a: 'Each membership year includes a credit applied toward one or more custom peptide synthesis requests — a specific sequence, purity grade, or quantity that isn’t part of our standard catalog. Just reach out through your private research line with your target spec and we’ll scope it against your credit.' },
      { q: 'What does "priority batch reservation" mean in practice?', a: 'When a new synthesis run is scheduled — whether it’s a restock or a new peptide entirely — Apex Vault members are notified and can reserve quantity before it’s listed publicly on the shop. High-demand peptides sell out fast; this guarantees members aren’t left waiting on the next run.' },
      { q: 'What kind of ongoing support do members get?', a: 'A private, direct line to our lab and logistics team for the full membership year — sourcing questions, dosing-protocol references for your research design, COA requests, and shipping coordination — without going through general customer support queues.' },
      { q: 'Does the membership auto-renew?', a: 'No. It runs for one calendar year from the date of purchase and does not auto-renew. You’ll get a reminder ahead of expiry if you’d like to continue.' },
      { q: 'Is there a refund if I change my mind?', a: 'Membership fees are non-refundable once activated, since seats are limited and access begins immediately. If you’re unsure it’s the right fit, reach out first — we’re happy to walk through whether it makes sense for your research volume.' },
      { q: 'Are there any costs beyond the membership fee?', a: 'The membership fee covers the access and perks described above. Product orders, and any synthesis work beyond your included annual credit, are billed separately at standard (member) pricing.' },
      { q: 'How do I actually join?', a: 'Use the "Unlock The Vault" button on this page to reach our team, or email us directly. We’ll confirm availability, walk you through payment, and get your research line set up the same day wherever possible.' },
    ],
  },
};

export default function AdminHomepage() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'badges' | 'features' | 'testimonials' | 'newsletter'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [uploadingHeroBg, setUploadingHeroBg] = useState(false);
  const [uploadingHeroProduct, setUploadingHeroProduct] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 2500);
  };

  useEffect(() => {
    getSiteContent('home', DEFAULT_CONTENT).then((value) => {
      // Deep-merge membership specifically so fields added after a previous save
      // (e.g. intro_paragraph_1, page_eyebrow, faqs) still show their defaults
      // instead of appearing blank just because they're missing from the saved record.
      setContent({
        ...DEFAULT_CONTENT,
        ...value,
        membership: { ...DEFAULT_CONTENT.membership, ...(value?.membership || {}) },
        contact: { ...DEFAULT_CONTENT.contact, ...(value?.contact || {}) },
      });
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await saveSiteContent('home', content);
      if (error) throw error;
      setSavedAt(new Date());
      showToast('Homepage content updated live in Supabase!');
    } catch (err) {
      showToast('Failed to save content. Check permissions.');
    } finally {
      setSaving(false);
    }
  }

  function updateHero(field, val) {
    setContent((c) => ({ ...c, hero: { ...c.hero, [field]: val } }));
  }
  function updatePromo(field, val) {
    setContent((c) => ({ ...c, promo: { ...c.promo, [field]: val } }));
  }
  async function handleHeroImageUpload(e, field) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'bg_image_url') setUploadingHeroBg(true);
    else setUploadingHeroProduct(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      updateHero(field, data.url);
      showToast('Image uploaded successfully!');
    } catch (err) {
      showToast(err.message || 'Upload error');
    } finally {
      if (field === 'bg_image_url') setUploadingHeroBg(false);
      else setUploadingHeroProduct(false);
      e.target.value = '';
    }
  }

  function updateNewsletter(field, val) {
    setContent((c) => ({ ...c, newsletter: { ...c.newsletter, [field]: val } }));
  }

  function updateListItem(key, index, patch) {
    setContent((c) => {
      const list = [...(c[key] || [])];
      list[index] = typeof patch === 'object' ? { ...list[index], ...patch } : patch;
      return { ...c, [key]: list };
    });
  }
  function addListItem(key, blank) {
    setContent((c) => ({ ...c, [key]: [...(c[key] || []), blank] }));
  }
  function removeListItem(key, index) {
    setContent((c) => ({ ...c, [key]: (c[key] || []).filter((_, i) => i !== index) }));
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#a8adb4' }}>Loading homepage telemetry...</p>
      </div>
    );
  }

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
          <h1>Homepage Content Editor</h1>
          <p className="admin-dash-subtitle">
            Configure storefront hero slogans, promotional banners, feature blocks, and social proof.
          </p>
        </div>

        <div className="admin-dash-actions">
          <Link href="/" target="_blank" className="account-btn-secondary">
            <ExternalLink size={15} />
            <span>Preview Live</span>
          </Link>

          <button className="account-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Publishing...' : 'Publish Changes'}</span>
          </button>
        </div>
      </div>

      {savedAt && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            padding: '4px 12px',
            borderRadius: 100,
            fontSize: 12.5,
            fontWeight: 650,
            marginBottom: 20,
          }}
        >
          <CheckCircle2 size={13} />
          <span>Last published live at {savedAt.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Editor Tabs Navigation */}
      <div className="account-tabs-wrapper admin-tabs-wrap" style={{ marginBottom: 24 }}>
        <button
          className={`account-tab ${activeTab === 'hero' ? 'active' : ''}`}
          onClick={() => setActiveTab('hero')}
        >
          <Sparkles size={16} />
          <span>Hero &amp; Promo</span>
        </button>

        <button
          className={`account-tab ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          <ShieldCheck size={16} />
          <span>Badges &amp; Metrics</span>
        </button>

        <button
          className={`account-tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          <Layers size={16} />
          <span>Feature Highlights</span>
        </button>

        <button
          className={`account-tab ${activeTab === 'testimonials' ? 'active' : ''}`}
          onClick={() => setActiveTab('testimonials')}
        >
          <MessageSquare size={16} />
          <span>Testimonials</span>
        </button>

        <button
          className={`account-tab ${activeTab === 'newsletter' ? 'active' : ''}`}
          onClick={() => setActiveTab('newsletter')}
        >
          <Mail size={16} />
          <span>Newsletter</span>
        </button>

      </div>

      {/* TAB 1: HERO & PROMO */}
      {activeTab === 'hero' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Hero Card */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 750 }}>
              Hero Banner Presentation
            </h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Eyebrow Accent Tag
              </label>
              <input
                value={content.hero?.eyebrow || ''}
                onChange={(e) => updateHero('eyebrow', e.target.value)}
                placeholder="e.g. Ultra-Pure Lyophilized Research Peptides"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Main Title / Headline
              </label>
              <input
                value={content.hero?.title || ''}
                onChange={(e) => updateHero('title', e.target.value)}
                placeholder="e.g. Precision Synthetic Peptides for Scientific Discovery"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Subtitle Description
              </label>
              <textarea
                rows={3}
                value={content.hero?.subtitle || ''}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                placeholder="Comprehensive research mission statement"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
              />
            </div>

            <div className="admin-form-grid">
              <label>
                Primary Button Label
                <input
                  value={content.hero?.primary_cta_label || ''}
                  onChange={(e) => updateHero('primary_cta_label', e.target.value)}
                />
              </label>

              <label>
                Primary Button Link
                <input
                  value={content.hero?.primary_cta_link || ''}
                  onChange={(e) => updateHero('primary_cta_link', e.target.value)}
                />
              </label>

              <label>
                Secondary Button Label
                <input
                  value={content.hero?.secondary_cta_label || ''}
                  onChange={(e) => updateHero('secondary_cta_label', e.target.value)}
                />
              </label>

              <label>
                Secondary Button Link
                <input
                  value={content.hero?.secondary_cta_link || ''}
                  onChange={(e) => updateHero('secondary_cta_link', e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Hero Images Card */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 750 }}>Hero Banner Images</h3>
            <span style={{ fontSize: 12.5, color: '#a8adb4' }}>
              Change the homepage banner visuals without touching code.
            </span>

            <div style={{ marginTop: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Background Image
              </label>
              <span style={{ display: 'block', fontSize: 12, color: '#a8adb4', marginBottom: 8 }}>
                Wide, 16:9 or wider (e.g. 1920 × 1080px). Fills the entire hero section behind the text.
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHeroImageUpload(e, 'bg_image_url')}
                  disabled={uploadingHeroBg}
                  style={{ fontSize: 12 }}
                />
                {uploadingHeroBg && <span style={{ fontSize: 12, color: 'var(--color-brand)' }}>Uploading...</span>}
              </div>
              <input
                value={content.hero?.bg_image_url || ''}
                onChange={(e) => updateHero('bg_image_url', e.target.value)}
                placeholder="Or paste an image URL"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
              />
              {content.hero?.bg_image_url && (
                <div style={{ marginTop: 10, maxWidth: 360, aspectRatio: '21 / 9', borderRadius: 10, overflow: 'hidden', background: '#171b23' }}>
                  <img src={content.hero.bg_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 22 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Product Showcase Image
              </label>
              <span style={{ display: 'block', fontSize: 12, color: '#a8adb4', marginBottom: 8 }}>
                The foreground product photo shown on the right side of the hero (transparent PNG works best).
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHeroImageUpload(e, 'product_image_url')}
                  disabled={uploadingHeroProduct}
                  style={{ fontSize: 12 }}
                />
                {uploadingHeroProduct && <span style={{ fontSize: 12, color: 'var(--color-brand)' }}>Uploading...</span>}
              </div>
              <input
                value={content.hero?.product_image_url || ''}
                onChange={(e) => updateHero('product_image_url', e.target.value)}
                placeholder="Or paste an image URL"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
              />
              {content.hero?.product_image_url && (
                <div style={{ marginTop: 10, width: 150, height: 150, borderRadius: 10, overflow: 'hidden', background: '#171b23', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={content.hero.product_image_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          </div>

          {/* Promo Strip Card */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 750 }}>Top Promotional Strip</h3>
              <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={content.promo?.enabled || false}
                  onChange={(e) => updatePromo('enabled', e.target.checked)}
                />
                <span style={{ fontWeight: 650 }}>Enable Notification Banner</span>
              </label>
            </div>

            <div className="admin-form-grid">
              <label style={{ gridColumn: 'span 2' }}>
                Announcement Message
                <input
                  value={content.promo?.text || ''}
                  onChange={(e) => updatePromo('text', e.target.value)}
                  placeholder="e.g. Free Express Cold-Chain Shipping on Orders Over $150"
                />
              </label>

              <label>
                CTA Button Text
                <input
                  value={content.promo?.link_label || ''}
                  onChange={(e) => updatePromo('link_label', e.target.value)}
                />
              </label>

              <label>
                CTA Target Link
                <input
                  value={content.promo?.link || ''}
                  onChange={(e) => updatePromo('link', e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRUST BADGES & METRICS */}
      {activeTab === 'badges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Trust Badges */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 750 }}>Trust &amp; Quality Badges</h3>
                <span style={{ fontSize: 12.5, color: '#a8adb4' }}>Accreditations under the hero banner</span>
              </div>
              <button
                type="button"
                className="account-btn-secondary"
                onClick={() => addListItem('trust_badges', '≥ 99% HPLC Verified')}
              >
                <Plus size={15} /> Add Badge
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(content.trust_badges || []).map((badge, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    value={badge}
                    onChange={(e) => updateListItem('trust_badges', idx, e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: 13.5, border: '1px solid var(--color-border)', borderRadius: 8 }}
                  />
                  <button
                    className="admin-copy-icon-btn"
                    style={{ color: '#dc2626', padding: 8 }}
                    onClick={() => removeListItem('trust_badges', idx)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Numerical Stats */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 750 }}>Numeric Counter Metrics</h3>
                <span style={{ fontSize: 12.5, color: '#a8adb4' }}>Showcase lab production capacity</span>
              </div>
              <button
                type="button"
                className="account-btn-secondary"
                onClick={() => addListItem('stats', { value: '99.8%', label: 'Average Purity' })}
              >
                <Plus size={15} /> Add Metric
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(content.stats || []).map((st, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, alignItems: 'center' }}>
                  <input
                    value={st.value}
                    onChange={(e) => updateListItem('stats', idx, { value: e.target.value })}
                    placeholder="e.g. 50,000+"
                    style={{ padding: '8px 12px', fontSize: 13.5, border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 750 }}
                  />
                  <input
                    value={st.label}
                    onChange={(e) => updateListItem('stats', idx, { label: e.target.value })}
                    placeholder="e.g. Vials Synthesized Annually"
                    style={{ padding: '8px 12px', fontSize: 13.5, border: '1px solid var(--color-border)', borderRadius: 8 }}
                  />
                  <button
                    className="admin-copy-icon-btn"
                    style={{ color: '#dc2626', padding: 8 }}
                    onClick={() => removeListItem('stats', idx)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEATURES & HIGHLIGHTS */}
      {activeTab === 'features' && (
        <div className="admin-card-section" style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 750 }}>Feature Pillars &amp; Standards</h3>
              <span style={{ fontSize: 12.5, color: '#a8adb4' }}>Why researchers choose Nutratein</span>
            </div>
            <button
              type="button"
              className="account-btn-secondary"
              onClick={() => addListItem('features', { icon: '🛡️', title: 'New Standard', body: 'Description of analytical protocol...' })}
            >
              <Plus size={15} /> Add Feature
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(content.features || []).map((feat, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 2fr auto',
                  gap: 12,
                  alignItems: 'center',
                  background: '#171b23',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                }}
              >
                <input
                  value={feat.icon || ''}
                  onChange={(e) => updateListItem('features', idx, { icon: e.target.value })}
                  placeholder="Icon"
                  style={{ textAlign: 'center', padding: '8px 4px', fontSize: 16, border: '1px solid var(--color-border)', borderRadius: 8 }}
                />
                <input
                  value={feat.title || ''}
                  onChange={(e) => updateListItem('features', idx, { title: e.target.value })}
                  placeholder="Feature Title"
                  style={{ padding: '8px 12px', fontSize: 13.5, border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 650 }}
                />
                <input
                  value={feat.body || ''}
                  onChange={(e) => updateListItem('features', idx, { body: e.target.value })}
                  placeholder="Description..."
                  style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 8 }}
                />
                <button
                  className="admin-copy-icon-btn"
                  style={{ color: '#dc2626', padding: 8 }}
                  onClick={() => removeListItem('features', idx)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TESTIMONIALS */}
      {activeTab === 'testimonials' && (
        <div className="admin-card-section" style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 750 }}>Institutional Testimonials</h3>
              <span style={{ fontSize: 12.5, color: '#a8adb4' }}>Feedback from research laboratories</span>
            </div>
            <button
              type="button"
              className="account-btn-secondary"
              onClick={() => addListItem('testimonials', { quote: 'Consistent purity across all production runs.', author: 'Dr. Sarah M.', role: 'Biochemical Research Fellow' })}
            >
              <Plus size={15} /> Add Testimonial
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(content.testimonials || []).map((t, idx) => (
              <div
                key={idx}
                style={{
                  background: '#171b23',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#a8adb4' }}>
                    Testimonial #{idx + 1}
                  </span>
                  <button
                    className="admin-copy-icon-btn"
                    style={{ color: '#dc2626' }}
                    onClick={() => removeListItem('testimonials', idx)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={t.quote || ''}
                  onChange={(e) => updateListItem('testimonials', idx, { quote: e.target.value })}
                  placeholder="Quote text..."
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13.5, border: '1px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
                />

                <div className="admin-form-grid" style={{ marginBottom: 0 }}>
                  <input
                    value={t.author || ''}
                    onChange={(e) => updateListItem('testimonials', idx, { author: e.target.value })}
                    placeholder="Author name (e.g. Dr. Robert Vance)"
                    style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 8 }}
                  />
                  <input
                    value={t.role || ''}
                    onChange={(e) => updateListItem('testimonials', idx, { role: e.target.value })}
                    placeholder="Affiliation / Role"
                    style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NEWSLETTER */}
      {activeTab === 'newsletter' && (
        <div className="admin-card-section" style={{ padding: '24px 26px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 750 }}>Newsletter Subscription Footer</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Newsletter Title
            </label>
            <input
              value={content.newsletter?.title || ''}
              onChange={(e) => updateNewsletter('title', e.target.value)}
              placeholder="e.g. Receive Analytical Bulletins &amp; Batch Alerts"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8 }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Newsletter Subtitle
            </label>
            <textarea
              rows={2}
              value={content.newsletter?.subtitle || ''}
              onChange={(e) => updateNewsletter('subtitle', e.target.value)}
              placeholder="e.g. Direct notifications when new peptide batches are verified."
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
            />
          </div>
        </div>
      )}


      {/* Sticky Bottom Publish Button on Mobile */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="account-btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 28px', fontSize: 14 }}>
          <Save size={16} />
          <span>{saving ? 'Publishing Changes...' : 'Publish Homepage Content'}</span>
        </button>
      </div>
    </div>
  );
}
