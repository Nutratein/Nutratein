'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSiteContent, saveSiteContent } from '@/lib/siteContent';
import { Gem, Save, CheckCircle2, Plus, Trash2 } from 'lucide-react';

// Full 'home' site_content shape is kept as the default/fallback so saving
// from this page (which only edits .membership) never wipes out hero,
// features, testimonials, contact, etc. that live under the same key.
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

export default function AdminMembership() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [uploadingImage1, setUploadingImage1] = useState(false);
  const [uploadingImage2, setUploadingImage2] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 2500);
  };

  useEffect(() => {
    getSiteContent('home', DEFAULT_CONTENT).then((value) => {
      setContent({
        ...DEFAULT_CONTENT,
        ...value,
        membership: { ...DEFAULT_CONTENT.membership, ...(value?.membership || {}) },
      });
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await saveSiteContent('home', content);
      if (error) throw error;
      showToast('Membership card updated live in Supabase!');
    } catch (err) {
      showToast('Failed to save content. Check permissions.');
    } finally {
      setSaving(false);
    }
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
  function updateWhoCard(index, patch) {
    setContent((c) => {
      const list = [...(c.membership?.who_cards || [])];
      list[index] = { ...list[index], ...patch };
      return { ...c, membership: { ...c.membership, who_cards: list } };
    });
  }
  function updateMembershipFaq(index, patch) {
    setContent((c) => {
      const list = [...(c.membership?.faqs || [])];
      list[index] = { ...list[index], ...patch };
      return { ...c, membership: { ...c.membership, faqs: list } };
    });
  }
  function addMembershipFaq() {
    setContent((c) => ({
      ...c,
      membership: {
        ...c.membership,
        faqs: [...(c.membership?.faqs || []), { q: 'New question?', a: 'Answer goes here...' }],
      },
    }));
  }
  function removeMembershipFaq(index) {
    setContent((c) => ({
      ...c,
      membership: { ...c.membership, faqs: (c.membership?.faqs || []).filter((_, i) => i !== index) },
    }));
  }

  async function handleMembershipImageUpload(e, field) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'image_1_url') setUploadingImage1(true);
    else setUploadingImage2(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      updateMembership(field, data.url);
      showToast('Image uploaded successfully!');
    } catch (err) {
      showToast(err.message || 'Upload error');
    } finally {
      if (field === 'image_1_url') setUploadingImage1(false);
      else setUploadingImage2(false);
      e.target.value = '';
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="account-skeleton-box" style={{ height: 50, width: '100%' }} />
        ))}
      </div>
    );
  }

  return (
    <div>
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

      <div className="admin-dash-header">
        <div className="admin-dash-title-group">
          <h1>Membership Card</h1>
          <p className="admin-dash-subtitle">
            Everything shown in the Apex Vault membership card (homepage) and the dedicated /membership page.
          </p>
        </div>
      </div>

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

          {/* Dedicated /membership Page — Page Header */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 750 }}>/membership Page — Page Header</h3>
            <span style={{ fontSize: 12.5, color: '#a8adb4' }}>
              The top banner shown on the dedicated Membership page, above everything else.
            </span>

            <div className="admin-form-grid" style={{ marginTop: 16 }}>
              <label>
                Header Badge
                <input
                  value={content.membership?.page_badge || ''}
                  onChange={(e) => updateMembership('page_badge', e.target.value)}
                  placeholder="ELITE RESEARCH ACCESS"
                />
              </label>
              <label>
                Title (before highlight)
                <input
                  value={content.membership?.page_title || ''}
                  onChange={(e) => updateMembership('page_title', e.target.value)}
                  placeholder="The"
                />
              </label>
              <label>
                Title Highlight (gold text)
                <input
                  value={content.membership?.page_title_highlight || ''}
                  onChange={(e) => updateMembership('page_title_highlight', e.target.value)}
                  placeholder="Apex Vault"
                />
              </label>
            </div>

            <div style={{ marginTop: 4 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Header Subtitle
              </label>
              <textarea
                rows={2}
                value={content.membership?.page_subtitle || ''}
                onChange={(e) => updateMembership('page_subtitle', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Dedicated /membership Page — Intro Content */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 750 }}>/membership Page — Intro Section</h3>
            <span style={{ fontSize: 12.5, color: '#a8adb4' }}>
              Shown on the dedicated Membership page (linked from the navbar), above the "Who It's For" cards.
            </span>

            <div style={{ marginTop: 16, marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Intro Eyebrow Tag
              </label>
              <input
                value={content.membership?.page_eyebrow || ''}
                onChange={(e) => updateMembership('page_eyebrow', e.target.value)}
                placeholder="What Is The Apex Vault Membership?"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Intro Heading
              </label>
              <input
                value={content.membership?.intro_heading || ''}
                onChange={(e) => updateMembership('intro_heading', e.target.value)}
                placeholder="Priority Access, Reserved"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Intro Paragraph 1
              </label>
              <textarea
                rows={3}
                value={content.membership?.intro_paragraph_1 || ''}
                onChange={(e) => updateMembership('intro_paragraph_1', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Intro Paragraph 2
              </label>
              <textarea
                rows={3}
                value={content.membership?.intro_paragraph_2 || ''}
                onChange={(e) => updateMembership('intro_paragraph_2', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                "How To Join" Card Text
              </label>
              <textarea
                rows={2}
                value={content.membership?.join_card_text || ''}
                onChange={(e) => updateMembership('join_card_text', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Dedicated /membership Page — Who It's For Cards */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 750 }}>/membership Page — "Who It's For" Cards</h3>
            <span style={{ fontSize: 12.5, color: '#a8adb4' }}>Exactly 3 cards (icons are fixed).</span>

            <div style={{ marginTop: 16, marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                Section Label
              </label>
              <input
                value={content.membership?.who_heading || ''}
                onChange={(e) => updateMembership('who_heading', e.target.value)}
                placeholder="Who It's For"
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              {(content.membership?.who_cards || []).map((card, idx) => (
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
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#a8adb4' }}>
                    Card #{idx + 1}
                  </span>
                  <input
                    value={card.title || ''}
                    onChange={(e) => updateWhoCard(idx, { title: e.target.value })}
                    placeholder="Card title"
                    style={{ padding: '8px 12px', fontSize: 13.5, border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 650 }}
                  />
                  <textarea
                    rows={2}
                    value={card.text || ''}
                    onChange={(e) => updateWhoCard(idx, { text: e.target.value })}
                    placeholder="Short description..."
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated /membership Page — Images */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 750 }}>/membership Page — Images</h3>
            <span style={{ fontSize: 12.5, color: '#a8adb4' }}>
              Both are optional — the section they belong to simply won't show an image until one is set.
            </span>

            <div style={{ marginTop: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Image 1 — Hero Band Backdrop
              </label>
              <span style={{ display: 'block', fontSize: 12, color: '#a8adb4', marginBottom: 8 }}>
                Recommended: wide, 16:9 ratio or wider (e.g. 1920 × 1080px). Used as the full-width ambient
                background behind the intro text at the top of the page (a dark overlay is applied automatically
                so text stays readable — a moody, centered subject works best).
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMembershipImageUpload(e, 'image_1_url')}
                  disabled={uploadingImage1}
                  style={{ fontSize: 12 }}
                />
                {uploadingImage1 && <span style={{ fontSize: 12, color: 'var(--color-brand)' }}>Uploading...</span>}
              </div>
              <input
                value={content.membership?.image_1_url || ''}
                onChange={(e) => updateMembership('image_1_url', e.target.value)}
                placeholder="Or paste an image URL"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, marginBottom: 8 }}
              />
              <input
                value={content.membership?.image_1_alt || ''}
                onChange={(e) => updateMembership('image_1_alt', e.target.value)}
                placeholder="Alt text (for accessibility / SEO)"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
              />
              {content.membership?.image_1_url && (
                <img
                  src={content.membership.image_1_url}
                  alt=""
                  style={{ marginTop: 10, maxWidth: 160, borderRadius: 10, border: '1px solid var(--color-border)' }}
                />
              )}
            </div>

            <div style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--color-border)' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Image 2 — "Inside Our Research Lab" Banner
              </label>
              <span style={{ display: 'block', fontSize: 12, color: '#a8adb4', marginBottom: 8 }}>
                Recommended: wide banner, 21:9 ratio (e.g. 2100 × 900px). Shown as a captioned banner between the
                "Who It's For" cards and the FAQ, with a dark gradient + caption automatically overlaid at the bottom.
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMembershipImageUpload(e, 'image_2_url')}
                  disabled={uploadingImage2}
                  style={{ fontSize: 12 }}
                />
                {uploadingImage2 && <span style={{ fontSize: 12, color: 'var(--color-brand)' }}>Uploading...</span>}
              </div>
              <input
                value={content.membership?.image_2_url || ''}
                onChange={(e) => updateMembership('image_2_url', e.target.value)}
                placeholder="Or paste an image URL"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, marginBottom: 8 }}
              />
              <input
                value={content.membership?.image_2_alt || ''}
                onChange={(e) => updateMembership('image_2_alt', e.target.value)}
                placeholder="Alt text (for accessibility / SEO)"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
              />
              {content.membership?.image_2_url && (
                <img
                  src={content.membership.image_2_url}
                  alt=""
                  style={{ marginTop: 10, maxWidth: 280, borderRadius: 10, border: '1px solid var(--color-border)' }}
                />
              )}
              <div className="admin-form-grid" style={{ marginTop: 14 }}>
                <label>
                  Banner Caption Eyebrow
                  <input
                    value={content.membership?.lab_banner_eyebrow || ''}
                    onChange={(e) => updateMembership('lab_banner_eyebrow', e.target.value)}
                    placeholder="Behind The Vault"
                  />
                </label>
                <label>
                  Banner Caption Heading
                  <input
                    value={content.membership?.lab_banner_heading || ''}
                    onChange={(e) => updateMembership('lab_banner_heading', e.target.value)}
                    placeholder="Inside Our Research Lab"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Dedicated /membership Page — FAQ Settings */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 750 }}>/membership Page — FAQ Section Header</h3>
            <span style={{ fontSize: 12.5, color: '#a8adb4' }}>Shown above the FAQ accordion.</span>

            <div className="admin-form-grid" style={{ marginTop: 16 }}>
              <label>
                Tag Label
                <input
                  value={content.membership?.faq_tag || ''}
                  onChange={(e) => updateMembership('faq_tag', e.target.value)}
                  placeholder="QUESTIONS"
                />
              </label>
              <label style={{ gridColumn: 'span 2' }}>
                FAQ Heading
                <input
                  value={content.membership?.faq_heading || ''}
                  onChange={(e) => updateMembership('faq_heading', e.target.value)}
                  placeholder="Membership Questions, Answered"
                />
              </label>
            </div>
            <div style={{ marginTop: 4 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                FAQ Subtitle
              </label>
              <input
                value={content.membership?.faq_subtitle || ''}
                onChange={(e) => updateMembership('faq_subtitle', e.target.value)}
                placeholder="Everything researchers ask before applying for Apex Vault access."
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8 }}
              />
            </div>
          </div>

          {/* Dedicated /membership Page — FAQ Questions */}
          <div className="admin-card-section" style={{ padding: '24px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 750 }}>/membership Page — FAQ Questions</h3>
                <span style={{ fontSize: 12.5, color: '#a8adb4' }}>Full accordion shown on the dedicated Membership page</span>
              </div>
              <button type="button" className="account-btn-secondary" onClick={addMembershipFaq}>
                <Plus size={15} /> Add Question
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(content.membership?.faqs || []).map((item, idx) => (
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
                      Question #{idx + 1}
                    </span>
                    <button
                      className="admin-copy-icon-btn"
                      style={{ color: '#dc2626' }}
                      onClick={() => removeMembershipFaq(idx)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <input
                    value={item.q || ''}
                    onChange={(e) => updateMembershipFaq(idx, { q: e.target.value })}
                    placeholder="Question"
                    style={{ padding: '8px 12px', fontSize: 13.5, border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 650 }}
                  />
                  <textarea
                    rows={3}
                    value={item.a || ''}
                    onChange={(e) => updateMembershipFaq(idx, { a: e.target.value })}
                    placeholder="Answer"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
                  />
                </div>
              ))}
              {(content.membership?.faqs || []).length === 0 && (
                <p style={{ fontSize: 13, color: '#a8adb4', margin: 0 }}>No FAQ questions added yet.</p>
              )}
            </div>
          </div>
        </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="account-btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 28px', fontSize: 14 }}>
          <Save size={16} />
          <span>{saving ? 'Publishing Changes...' : 'Publish Membership Changes'}</span>
        </button>
      </div>
    </div>
  );
}
