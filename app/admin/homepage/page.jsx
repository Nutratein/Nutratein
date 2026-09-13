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
  AlertCircle,
  Gem
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
  },
  trust_badges: [],
  stats: [],
  features: [],
  testimonials: [],
  promo: { enabled: false, text: '', link_label: 'Shop Now', link: '/shop' },
  newsletter: { title: '', subtitle: '' },
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

export default function AdminHomepage() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'badges' | 'features' | 'testimonials' | 'newsletter'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 2500);
  };

  useEffect(() => {
    getSiteContent('home', DEFAULT_CONTENT).then((value) => {
      setContent({ ...DEFAULT_CONTENT, ...value });
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
  function updateMembership(field, val) {
    setContent((c) => ({ ...c, membership: { ...c.membership, [field]: val } }));
  }
  function updateMembershipBenefit(index, patch) {
    setContent((c) => {
      const list = [...(c.membership?.benefits || [])];
      list[index] = { ...list[index], ...patch };
      return { ...c, membership: { ...c.membership, benefits: list } };
    });
  }
  function addMembershipBenefit() {
    setContent((c) => ({
      ...c,
      membership: {
        ...c.membership,
        benefits: [...(c.membership?.benefits || []), { title: 'New Benefit', text: 'Describe this perk...' }],
      },
    }));
  }
  function removeMembershipBenefit(index) {
    setContent((c) => ({
      ...c,
      membership: { ...c.membership, benefits: (c.membership?.benefits || []).filter((_, i) => i !== index) },
    }));
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
      <div className="account-tabs-wrapper" style={{ marginBottom: 24 }}>
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

        <button
          className={`account-tab ${activeTab === 'membership' ? 'active' : ''}`}
          onClick={() => setActiveTab('membership')}
        >
          <Gem size={16} />
          <span>Membership Card</span>
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

      {/* TAB 6: MEMBERSHIP CARD */}
      {activeTab === 'membership' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 750 }}>Apex Vault Membership Card</h3>
                <span style={{ fontSize: 12.5, color: '#a8adb4' }}>
                  Premium VIP membership panel shown on the homepage, below the testimonials.
                </span>
              </div>
              <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={content.membership?.enabled !== false}
                  onChange={(e) => updateMembership('enabled', e.target.checked)}
                />
                <span style={{ fontWeight: 650 }}>Show on Homepage</span>
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Eyebrow Accent Tag
              </label>
              <input
                value={content.membership?.eyebrow || ''}
                onChange={(e) => updateMembership('eyebrow', e.target.value)}
                placeholder="e.g. ELITE RESEARCH ACCESS"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8 }}
              />
            </div>

            <div className="admin-form-grid">
              <label>
                Title (before highlight)
                <input
                  value={content.membership?.title || ''}
                  onChange={(e) => updateMembership('title', e.target.value)}
                  placeholder="What Is The"
                />
              </label>
              <label>
                Title Highlight (gold text)
                <input
                  value={content.membership?.title_highlight || ''}
                  onChange={(e) => updateMembership('title_highlight', e.target.value)}
                  placeholder="Apex Vault"
                />
              </label>
              <label>
                Title (after highlight)
                <input
                  value={content.membership?.title_after || ''}
                  onChange={(e) => updateMembership('title_after', e.target.value)}
                  placeholder="Membership?"
                />
              </label>
              <label>
                Plan Label
                <input
                  value={content.membership?.plan_label || ''}
                  onChange={(e) => updateMembership('plan_label', e.target.value)}
                  placeholder="APEX VAULT MEMBERSHIP"
                />
              </label>
              <label>
                Plan Duration
                <input
                  value={content.membership?.plan_duration || ''}
                  onChange={(e) => updateMembership('plan_duration', e.target.value)}
                  placeholder="ONE RESEARCHER • ONE YEAR"
                />
              </label>
              <label>
                Benefits Heading
                <input
                  value={content.membership?.benefits_heading || ''}
                  onChange={(e) => updateMembership('benefits_heading', e.target.value)}
                  placeholder="EXCLUSIVE BENEFITS"
                />
              </label>
            </div>
          </div>

          {/* Benefits List */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 750 }}>Membership Benefits</h3>
                <span style={{ fontSize: 12.5, color: '#a8adb4' }}>Checklist shown inside the card</span>
              </div>
              <button type="button" className="account-btn-secondary" onClick={addMembershipBenefit}>
                <Plus size={15} /> Add Benefit
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(content.membership?.benefits || []).map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#171b23',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#a8adb4' }}>
                      Benefit #{idx + 1}
                    </span>
                    <button
                      className="admin-copy-icon-btn"
                      style={{ color: '#dc2626' }}
                      onClick={() => removeMembershipBenefit(idx)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <input
                    value={b.title || ''}
                    onChange={(e) => updateMembershipBenefit(idx, { title: e.target.value })}
                    placeholder="Benefit title (e.g. Priority Batch Reservations)"
                    style={{ padding: '8px 12px', fontSize: 13.5, border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 650 }}
                  />
                  <textarea
                    rows={2}
                    value={b.text || ''}
                    onChange={(e) => updateMembershipBenefit(idx, { text: e.target.value })}
                    placeholder="Short description of this perk..."
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
                  />
                </div>
              ))}
              {(content.membership?.benefits || []).length === 0 && (
                <p style={{ fontSize: 13, color: '#a8adb4', margin: 0 }}>No benefits added yet.</p>
              )}
            </div>
          </div>

          {/* Price & CTA */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 750 }}>Price &amp; Call-to-Action</h3>

            <div className="admin-form-grid">
              <label>
                Price
                <input
                  value={content.membership?.price || ''}
                  onChange={(e) => updateMembership('price', e.target.value)}
                  placeholder="$2,497.00"
                />
              </label>
              <label style={{ gridColumn: 'span 2' }}>
                Price Note
                <input
                  value={content.membership?.price_note || ''}
                  onChange={(e) => updateMembership('price_note', e.target.value)}
                  placeholder="USD / year — billed annually. Limited seats available."
                />
              </label>
              <label>
                CTA Button Label
                <input
                  value={content.membership?.cta_label || ''}
                  onChange={(e) => updateMembership('cta_label', e.target.value)}
                  placeholder="Unlock The Vault"
                />
              </label>
              <label>
                CTA Target Link
                <input
                  value={content.membership?.cta_link || ''}
                  onChange={(e) => updateMembership('cta_link', e.target.value)}
                  placeholder="/contact-us"
                />
              </label>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Closing Text
              </label>
              <textarea
                rows={2}
                value={content.membership?.closing_text || ''}
                onChange={(e) => updateMembership('closing_text', e.target.value)}
                placeholder="Optional italic line shown below the button"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
              />
            </div>
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
