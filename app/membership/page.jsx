'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSiteContent } from '@/lib/siteContent';
import { useAuth } from '@/context/AuthContext';
import { getWallet, getCadRate, purchaseMembershipWithWallet } from '@/lib/wallet';
import PageHeader from '@/components/PageHeader.jsx';
import MembershipCard, { handleAnchorClick } from '@/components/MembershipCard.jsx';
import Reveal from '@/components/Reveal.jsx';
import {
  Gem,
  ChevronDown,
  Mail,
  ArrowRight,
  ShieldCheck,
  FlaskConical,
  Users,
  Sparkles,
  Wallet,
  CheckCircle2,
  X,
} from 'lucide-react';

function parsePriceUsd(priceStr) {
  const n = Number(String(priceStr || '').replace(/[^0-9.]/g, ''));
  return n > 0 ? n : 2497;
}

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 26, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const DEFAULT_MEMBERSHIP = {
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
    {
      q: 'What exactly is the Apex Vault Membership?',
      a: 'It’s an annual membership for serious researchers and institutions who need more than a standard storefront relationship. Members get priority access to new synthesis runs, a direct line to our lab team, annual custom-synthesis credit, and guaranteed concierge shipping — all backed by the same third-party purity testing every The Pep Shop order already includes.',
    },
    {
      q: 'How much does it cost and how do I pay?',
      a: 'Current pricing and billing terms are shown above in the membership card. It’s billed once per year, and seats are intentionally limited so our lab team can give every member real, personal attention rather than spreading support thin.',
    },
    {
      q: 'Who is this membership actually for?',
      a: 'Labs, universities, and independent researchers who order regularly and need reliability more than anything — guaranteed stock on the sequences they rely on, faster answers when they have sourcing or protocol questions, and a standing credit toward custom synthesis work they’d otherwise have to quote from scratch every time.',
    },
    {
      q: 'How does the custom synthesis credit work?',
      a: 'Each membership year includes a credit applied toward one or more custom peptide synthesis requests — a specific sequence, purity grade, or quantity that isn’t part of our standard catalog. Just reach out through your private research line with your target spec and we’ll scope it against your credit.',
    },
    {
      q: 'What does "priority batch reservation" mean in practice?',
      a: 'When a new synthesis run is scheduled — whether it’s a restock or a new peptide entirely — Apex Vault members are notified and can reserve quantity before it’s listed publicly on the shop. High-demand peptides sell out fast; this guarantees members aren’t left waiting on the next run.',
    },
    {
      q: 'What kind of ongoing support do members get?',
      a: 'A private, direct line to our lab and logistics team for the full membership year — sourcing questions, dosing-protocol references for your research design, COA requests, and shipping coordination — without going through general customer support queues.',
    },
    {
      q: 'Does the membership auto-renew?',
      a: 'No. It runs for one calendar year from the date of purchase and does not auto-renew. You’ll get a reminder ahead of expiry if you’d like to continue.',
    },
    {
      q: 'Is there a refund if I change my mind?',
      a: 'Membership fees are non-refundable once activated, since seats are limited and access (priority reservations, synthesis credit, direct support) begins immediately. If you’re unsure it’s the right fit, reach out first — we’re happy to walk through whether it makes sense for your research volume.',
    },
    {
      q: 'Are there any costs beyond the membership fee?',
      a: 'The membership fee covers the access and perks described above. Product orders, and any synthesis work beyond your included annual credit, are billed separately at standard (member) pricing.',
    },
    {
      q: 'How do I actually join?',
      a: 'Use the "Unlock The Vault" button on this page to reach our team, or email us directly. We’ll confirm availability, walk you through payment, and get your research line set up the same day wherever possible.',
    },
  ],
};

export default function MembershipPage() {
  const [membership, setMembership] = useState(DEFAULT_MEMBERSHIP);
  const [openFaq, setOpenFaq] = useState(0);
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [wallet, setWallet] = useState({ usd_balance: 0, cad_balance: 0 });
  const [buyCurrency, setBuyCurrency] = useState('usd');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cadRate, setCadRate] = useState(1.35);

  useEffect(() => {
    let active = true;
    getSiteContent('home', { membership: DEFAULT_MEMBERSHIP }).then((value) => {
      if (active && value?.membership) {
        setMembership({ ...DEFAULT_MEMBERSHIP, ...value.membership });
      }
    });
    getCadRate().then((r) => { if (active) setCadRate(r); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getWallet(user.id).then(setWallet);
  }, [user?.id]);

  const toggleFaq = (idx) => setOpenFaq((prev) => (prev === idx ? null : idx));
  const faqs = membership.faqs && membership.faqs.length > 0 ? membership.faqs : DEFAULT_MEMBERSHIP.faqs;

  const priceUsd = parsePriceUsd(membership.price);
  const priceCad = Number((priceUsd * cadRate).toFixed(2));
  const canPayUsd = Number(wallet.usd_balance) >= priceUsd;
  const canPayCad = Number(wallet.cad_balance) >= priceCad;
  const isActiveMember = profile?.is_member && profile?.membership_expires_at && new Date(profile.membership_expires_at) > new Date();
  const daysRemaining = isActiveMember
    ? Math.max(0, Math.ceil((new Date(profile.membership_expires_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  async function handlePurchase() {
    if (!user) {
      router.push('/login?redirect=/membership');
      return;
    }
    setPurchaseError('');
    setPurchasing(true);
    try {
      const { error } = await purchaseMembershipWithWallet(buyCurrency, priceUsd);
      if (error) throw error;
      setPurchaseSuccess(true);
      setShowSuccessModal(true);
      await refreshProfile();
      const w = await getWallet(user.id);
      setWallet(w);
    } catch (err) {
      setPurchaseError(err.message || 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <div className="membership-page-wrapper">
      <PageHeader
        badge={membership.page_badge || 'ELITE RESEARCH ACCESS'}
        badgeIcon={Gem}
        title={membership.page_title || 'The'}
        titleHighlight={membership.page_title_highlight || 'Apex Vault'}
        subtitle={membership.page_subtitle || DEFAULT_MEMBERSHIP.page_subtitle}
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Membership' },
        ]}
      />

      {/* Dramatic gold/black intro band — image_1, if set, becomes the ambient full-bleed backdrop */}
      <section
        className="membership-hero-band"
        style={membership.image_1_url ? { backgroundImage: `url(${membership.image_1_url})` } : undefined}
      >
        <motion.div
          className="membership-glow-orb membership-glow-orb-1"
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="membership-glow-orb membership-glow-orb-2"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <div className="container membership-hero-inner">
          <Reveal as="div" className="membership-intro">
            <div className="membership-intro-text">
              <span className="membership-intro-eyebrow membership-shimmer-text">
                <Sparkles size={13} /> {membership.page_eyebrow || DEFAULT_MEMBERSHIP.page_eyebrow}
              </span>
              <h2 className="membership-intro-heading">
                {membership.intro_heading || 'Priority Access, Reserved'}
              </h2>
              <p>{membership.intro_paragraph_1 || DEFAULT_MEMBERSHIP.intro_paragraph_1}</p>
              <p>{membership.intro_paragraph_2 || DEFAULT_MEMBERSHIP.intro_paragraph_2}</p>
            </div>

            <div className="membership-intro-side">
              <motion.div
                className="membership-intro-join-card"
                whileHover={{ y: -4, boxShadow: '0 26px 60px -16px rgba(0,0,0,0.65), 0 0 70px -26px rgba(212,175,55,0.55)' }}
                transition={{ duration: 0.3 }}
              >
              <span className="membership-intro-join-badge">How To Join</span>
              <p>{membership.join_card_text || DEFAULT_MEMBERSHIP.join_card_text}</p>
              <div className="membership-intro-join-row">
                <ShieldCheck size={16} />
                <span>{membership.plan_duration || 'One researcher · one year'}</span>
              </div>
              <div className="membership-intro-join-row">
                <FlaskConical size={16} />
                <span>{membership.price || '$2,497.00'} {membership.price_note ? `— ${membership.price_note}` : ''}</span>
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={membership.cta_link || '/contact-us'}
                  className="membership-intro-join-btn"
                  onClick={(e) => handleAnchorClick(e, membership.cta_link || '/contact-us')}
                >
                  <span className="membership-cta-tick" />
                  <Mail size={15} />
                  <span>{membership.cta_label || 'Apply For Access'}</span>
                  <ArrowRight size={15} />
                  <span className="membership-cta-tick" />
                </Link>
              </motion.div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="container membership-page-container">
        {/* Benefits quick strip */}
        <Reveal as="div" className="membership-page-benefits-head">
          <span className="membership-tag-line" />
          <Users size={13} />
          <span>{membership.who_heading || DEFAULT_MEMBERSHIP.who_heading}</span>
          <span className="membership-tag-line" />
        </Reveal>

        <motion.div
          className="membership-who-grid"
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {(membership.who_cards && membership.who_cards.length > 0 ? membership.who_cards : DEFAULT_MEMBERSHIP.who_cards).map((card, idx) => {
            const Icon = [FlaskConical, Users, ShieldCheck][idx % 3];
            return (
              <motion.div
                className="membership-who-card"
                key={idx}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
              >
                <span className="membership-who-icon"><Icon size={20} /></span>
                <h4>{card.title}</h4>
                <p>{card.text}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {membership.image_2_url && (
          <motion.div
            className="membership-lab-banner"
            style={{ backgroundImage: `url(${membership.image_2_url})` }}
            role="img"
            aria-label={membership.image_2_alt || 'The Pep Shop research lab'}
            initial={{ opacity: 0, scale: 1.06 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="membership-lab-banner-overlay" />
            <div className="membership-lab-banner-caption">
              <span className="membership-lab-banner-eyebrow">{membership.lab_banner_eyebrow || DEFAULT_MEMBERSHIP.lab_banner_eyebrow}</span>
              <h3>{membership.lab_banner_heading || DEFAULT_MEMBERSHIP.lab_banner_heading}</h3>
            </div>
          </motion.div>
        )}

        {/* FAQ */}
        <div className="membership-faq-head">
          <span className="membership-benefits-tag">
            <span className="membership-tag-line" />
            <span>{membership.faq_tag || DEFAULT_MEMBERSHIP.faq_tag}</span>
            <span className="membership-tag-line" />
          </span>
          <h2>{membership.faq_heading || DEFAULT_MEMBERSHIP.faq_heading}</h2>
          <p>{membership.faq_subtitle || DEFAULT_MEMBERSHIP.faq_subtitle}</p>
        </div>

        <motion.div
          className="faq-accordion-list membership-faq-list"
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <motion.div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`} variants={cardVariants}>
                <button
                  className="faq-card-header"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <div className="faq-question-wrap">
                    <span className="faq-question-text">{item.q}</span>
                  </div>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown size={18} className="faq-chevron" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="faq-card-body">
                        <p className="faq-answer-text">{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Final CTA — full membership card repeated, like the reference page. Keeps the #buy-with-wallet
            anchor id so "Unlock The Vault" always has somewhere to scroll to, even for existing members
            (whose purchase panel below is hidden since this card already shows their active status). */}
        <Reveal as="div" id="buy-with-wallet" className="membership-page-final-cta" style={{ scrollMarginTop: 100 }}>
          <MembershipCard membership={membership} cadRate={cadRate} isActiveMember={isActiveMember} expiresAt={profile?.membership_expires_at} />
        </Reveal>

        {/* Buy Now with Wallet — hidden once already an active member; the MembershipCard above already
            communicates that status clearly, so this section is reserved for the actual purchase flow. */}
        {!isActiveMember && (
        <Reveal as="div" style={{ maxWidth: 560, margin: '32px auto 0', scrollMarginTop: 100 }}>
          <div className="account-card-panel">
            <div className="account-panel-header">
              <div className="account-panel-title">
                <Wallet size={18} style={{ color: 'var(--color-brand)' }} />
                <span>Buy Instantly with Wallet</span>
              </div>
            </div>

            {!user ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <p style={{ color: '#a8adb4', fontSize: 14, marginBottom: 16 }}>
                  Log in to purchase the Apex Vault membership instantly with your wallet balance.
                </p>
                <Link href="/login?redirect=/membership" className="account-btn-primary" style={{ display: 'inline-flex' }}>
                  Log In to Continue
                </Link>
              </div>
            ) : (
              <>
                <p style={{ color: '#a8adb4', fontSize: 13.5, marginTop: 0 }}>
                  Skip the wait — pay for your {membership.price || '$2,497.00'} membership directly from your wallet balance.
                </p>

                {purchaseError && (
                  <div style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                    {purchaseError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => canPayUsd && setBuyCurrency('usd')}
                    disabled={!canPayUsd}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 10,
                      border: buyCurrency === 'usd' ? '1.5px solid var(--color-brand)' : '1.5px solid var(--color-border)',
                      background: buyCurrency === 'usd' ? 'rgba(0,102,255,0.08)' : 'transparent',
                      opacity: canPayUsd ? 1 : 0.5,
                      cursor: canPayUsd ? 'pointer' : 'not-allowed',
                      textAlign: 'left',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: 13.5 }}>USD Wallet</strong>
                    <span style={{ fontSize: 12, color: canPayUsd ? '#a8adb4' : '#dc2626' }}>
                      Balance ${Number(wallet.usd_balance).toFixed(2)} {!canPayUsd && '— insufficient'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => canPayCad && setBuyCurrency('cad')}
                    disabled={!canPayCad}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 10,
                      border: buyCurrency === 'cad' ? '1.5px solid var(--color-brand)' : '1.5px solid var(--color-border)',
                      background: buyCurrency === 'cad' ? 'rgba(0,102,255,0.08)' : 'transparent',
                      opacity: canPayCad ? 1 : 0.5,
                      cursor: canPayCad ? 'pointer' : 'not-allowed',
                      textAlign: 'left',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: 13.5 }}>CAD Wallet</strong>
                    <span style={{ fontSize: 12, color: canPayCad ? '#a8adb4' : '#dc2626' }}>
                      Balance C${Number(wallet.cad_balance).toFixed(2)} {!canPayCad && '— insufficient'}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  className="account-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={purchasing || (buyCurrency === 'usd' ? !canPayUsd : !canPayCad)}
                  onClick={handlePurchase}
                >
                  {purchasing ? 'Processing...' : `Buy Now with ${buyCurrency.toUpperCase()} Wallet`}
                </button>

                <p style={{ fontSize: 11.5, color: '#94a3b8', textAlign: 'center', margin: '12px 0 0' }}>
                  Not enough balance?{' '}
                  <Link href="/account?tab=wallet" style={{ color: 'var(--color-brand)' }}>
                    Add money to your wallet
                  </Link>
                </p>
              </>
            )}
          </div>
        </Reveal>
        )}
      </div>

      {/* PURCHASE SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(8, 8, 12, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: 440,
                width: '100%',
                borderRadius: 22,
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #14171f 0%, #0d0f15 100%)',
                border: '1px solid rgba(212,175,55,0.35)',
                boxShadow: '0 30px 70px -20px rgba(0,0,0,0.7), 0 0 90px -30px rgba(212,175,55,0.5)',
                textAlign: 'center',
                padding: '40px 32px 32px',
              }}
            >
              <motion.div
                className="membership-glow-orb membership-glow-orb-1"
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}
              />

              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#a8adb4',
                  zIndex: 1,
                }}
              >
                <X size={16} />
              </button>

              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                style={{
                  width: 76,
                  height: 76,
                  margin: '0 auto 22px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #34d399, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 8px rgba(52,211,153,0.12), 0 10px 30px -8px rgba(5,150,105,0.6)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <CheckCircle2 size={40} color="#fff" strokeWidth={2.2} />
              </motion.div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#d4af37',
                  marginBottom: 10,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Gem size={13} /> Welcome to Apex Vault
              </span>

              <h3 style={{ margin: '0 0 10px', fontSize: 23, fontWeight: 800, position: 'relative', zIndex: 1 }}>
                Membership Activated!
              </h3>
              <p style={{ color: '#a8adb4', fontSize: 14, lineHeight: 1.6, margin: '0 0 22px', position: 'relative', zIndex: 1 }}>
                Your payment was processed instantly from your{' '}
                <strong style={{ color: '#e5e7eb' }}>{buyCurrency.toUpperCase()} Wallet</strong>. Priority
                batch access, concierge support, and every Apex Vault perk are live on your account now.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 24,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 3 }}>Plan</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{membership.plan_label || 'APEX VAULT'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 3 }}>Valid Until</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                    {profile?.membership_expires_at
                      ? new Date(profile.membership_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '—'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
                <Link
                  href="/account?tab=profile#membership-panel"
                  className="account-btn-primary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setShowSuccessModal(false)}
                >
                  <ShieldCheck size={16} />
                  <span>View My Account</span>
                </Link>
                <button
                  type="button"
                  className="account-btn-secondary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setShowSuccessModal(false)}
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
