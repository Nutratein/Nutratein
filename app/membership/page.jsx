'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getSiteContent } from '@/lib/siteContent';
import PageHeader from '@/components/PageHeader.jsx';
import MembershipCard from '@/components/MembershipCard.jsx';
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
} from 'lucide-react';

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
  cta_link: '/contact-us',
  closing_text: 'Built for institutions and independent researchers who need more than a storefront — a dedicated supply partner.',
  // Dedicated /membership page content
  intro_heading: 'Priority Access, Reserved',
  intro_paragraph_1:
    'The Apex Vault is an exclusive, one-year membership for researchers and institutions who order often enough that reliability matters more than anything else. Instead of competing with every other buyer when a popular batch restocks, members get first access, a standing credit toward custom synthesis work, and a private line straight to our lab team for sourcing and protocol questions.',
  intro_paragraph_2:
    'It sits on top of everything Drago Pharma already does — third-party HPLC/MS purity testing, discreet cold-chain shipping, and full COAs on every batch — it just guarantees you never have to wait in line for it.',
  image_1_url: '',
  image_1_alt: 'Apex Vault Membership',
  image_2_url: '',
  image_2_alt: 'Drago Pharma research lab',
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
      a: 'It’s an annual membership for serious researchers and institutions who need more than a standard storefront relationship. Members get priority access to new synthesis runs, a direct line to our lab team, annual custom-synthesis credit, and guaranteed concierge shipping — all backed by the same third-party purity testing every Drago Pharma order already includes.',
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

  useEffect(() => {
    let active = true;
    getSiteContent('home', { membership: DEFAULT_MEMBERSHIP }).then((value) => {
      if (active && value?.membership) {
        setMembership({ ...DEFAULT_MEMBERSHIP, ...value.membership });
      }
    });
    return () => { active = false; };
  }, []);

  const toggleFaq = (idx) => setOpenFaq((prev) => (prev === idx ? null : idx));
  const faqs = membership.faqs && membership.faqs.length > 0 ? membership.faqs : DEFAULT_MEMBERSHIP.faqs;

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
                <Link href={membership.cta_link || '/contact-us'} className="membership-intro-join-btn">
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
            aria-label={membership.image_2_alt || 'Drago Pharma research lab'}
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

        {/* Final CTA — full membership card repeated, like the reference page */}
        <Reveal as="div" className="membership-page-final-cta">
          <MembershipCard membership={membership} />
        </Reveal>
      </div>
    </div>
  );
}
