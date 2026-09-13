'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import Reveal from './Reveal.jsx';

export default function MembershipCard({ membership }) {
  if (!membership || membership.enabled === false) return null;

  return (
    <Reveal as="div" className="membership-card">
      <div className="membership-inner">
        <div className="membership-eyebrow-wrap">
          <span className="membership-eyebrow-line" />
          <span className="membership-eyebrow-text">
            {membership.eyebrow || 'ELITE RESEARCH ACCESS'}
          </span>
          <span className="membership-eyebrow-line" />
        </div>

        <h2 className="membership-title">
          {membership.title || 'What Is The'}{' '}
          <span className="membership-title-highlight">
            {membership.title_highlight || 'Apex Vault'}
          </span>{' '}
          {membership.title_after || 'Membership?'}
        </h2>

        <div className="membership-plan-row">
          <span>{membership.plan_label || 'APEX VAULT MEMBERSHIP'}</span>
          <span className="membership-plan-dot" />
          <span>{membership.plan_duration || 'ONE RESEARCHER • ONE YEAR'}</span>
        </div>

        <div className="membership-benefits-tag">
          <span className="membership-tag-line" />
          <span>{membership.benefits_heading || 'EXCLUSIVE BENEFITS'}</span>
          <span className="membership-tag-line" />
        </div>

        <div className="membership-benefits-grid">
          {(membership.benefits || []).map((b, idx) => (
            <div className="membership-benefit-item" key={idx}>
              <span className="membership-check-badge">
                <Check size={13} strokeWidth={3} />
              </span>
              <div>
                <h4>{b.title}</h4>
                <p>{b.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="membership-price-box">
          <span className="membership-price">{membership.price || '$2,497.00'}</span>
          <span className="membership-price-note">
            {membership.price_note || 'USD / year — billed annually. Limited seats available.'}
          </span>
        </div>

        <Link href={membership.cta_link || '/contact-us'} className="membership-cta-btn">
          <span className="membership-cta-tick" />
          <span>{membership.cta_label || 'Unlock The Vault'}</span>
          <span className="membership-cta-tick" />
        </Link>

        {membership.closing_text && (
          <p className="membership-closing-text">{membership.closing_text}</p>
        )}
      </div>
    </Reveal>
  );
}
