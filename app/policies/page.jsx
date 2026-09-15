'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader.jsx';
import { FileText, Lock, RotateCcw, ShieldCheck } from 'lucide-react';

export default function PoliciesPage() {
  return (
    <div className="about-page-wrapper">
      <PageHeader
        badge="Store Policies"
        badgeIcon={ShieldCheck}
        title="Terms, Privacy &"
        titleHighlight="Refunds"
        subtitle="Clear, plain-language policies covering how we supply research compounds, handle your data, and process refunds."
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Policies' },
        ]}
      />

      <div className="about-container policy-page-container">
        <nav className="policy-jump-nav">
          <a href="#terms">Terms of Supply</a>
          <a href="#privacy">Privacy Notice</a>
          <a href="#refund">Refund Policy</a>
        </nav>

        <section id="terms" className="policy-section">
          <div className="policy-section-icon"><FileText size={20} /></div>
          <h2>Terms of Supply</h2>
          <p>
            All compounds listed on The Pep Shop are supplied strictly for in-vitro laboratory research and
            analytical testing. They are not intended, formulated, or approved for human or veterinary
            consumption, and must not be used as pharmaceuticals, medical devices, dietary supplements, or
            cosmetics. By placing an order, you confirm you are purchasing solely for qualified research purposes
            and are responsible for complying with all laws applicable to the handling of research chemicals in
            your jurisdiction.
          </p>
          <p>
            Orders are subject to acceptance and stock availability; listed pricing may change without notice
            until an order is confirmed. Payment may be made by card, bank wire transfer, or your Pep Shop wallet
            balance (USD or CAD) — see the Wallet section of your Account page for details on adding funds.
            Shipping timelines and packaging standards are described at checkout and on our FAQ page.
          </p>
          <p>
            We make no warranty, express or implied, regarding fitness for any use outside the stated research
            purpose. These terms may be updated from time to time; the version posted on this page at the time of
            your order applies.
          </p>
        </section>

        <section id="privacy" className="policy-section">
          <div className="policy-section-icon"><Lock size={20} /></div>
          <h2>Privacy Notice</h2>
          <p>
            We collect the information needed to fulfill your order and operate your account: name, email,
            shipping address, phone number (optional), and your order/wallet transaction history. Card payments
            are processed by our payment provider and are not stored on our servers. Wire transfer reference
            numbers you submit are used only to verify and approve wallet top-ups.
          </p>
          <p>
            We do not sell your personal information to third parties. Data is shared only where necessary — with
            couriers to deliver your order, with our payment processor to complete a transaction, or where
            required by law. We use essential cookies to keep you signed in and remember your cart; no
            third-party ad-tracking cookies are used.
          </p>
          <p>
            You can request a copy of the data we hold about you, or ask us to delete your account and associated
            data (subject to any records we are legally required to retain, such as order history for tax
            purposes), by contacting us through the <Link href="/contact-us">Contact page</Link>.
          </p>
        </section>

        <section id="refund" className="policy-section">
          <div className="policy-section-icon"><RotateCcw size={20} /></div>
          <h2>Refund Policy</h2>
          <p>
            Unopened products in their original manufacturer seal may be returned within 14 days of delivery.
            Contact our support team with your order number to initiate an authorized return. If an item arrives
            damaged or incorrect, we will replace it or issue a refund once the issue is confirmed — no return
            shipping cost to you in that case.
          </p>
          <p>
            <strong>Wallet balance:</strong> once a wire-transfer top-up is approved and credited to your wallet,
            it is intended for use on future orders and is non-refundable except at our discretion. If you need an
            unused wallet balance returned to you, contact support with your account details and we will review it
            case by case.
          </p>
          <p>
            <strong>Membership:</strong> the Apex Vault membership fee is non-refundable once activated, since
            access and benefits begin immediately upon purchase.
          </p>
        </section>

        <p className="policy-footer-note">
          Questions about any of these policies? <Link href="/contact-us">Reach out to our team</Link> — we're glad
          to walk through the details before you order.
        </p>
      </div>
    </div>
  );
}
