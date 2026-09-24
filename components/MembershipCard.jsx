'use client';

import Link from 'next/link';
import { Check, ShieldCheck } from 'lucide-react';
import Reveal from './Reveal.jsx';

// next/link doesn't reliably scroll to an in-page anchor when you're already
// on that route (it only updates the URL) — so for links like
// "/membership#buy-with-wallet" we scroll manually if we're already there,
// and let Link handle a normal cross-page navigation otherwise.
export function handleAnchorClick(e, link) {
  if (!link || !link.includes('#')) return;
  const [path, hash] = link.split('#');
  const targetPath = path || '/';
  if (typeof window !== 'undefined' && window.location.pathname === targetPath) {
    e.preventDefault();
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function MembershipCard({ membership, cadRate = 1.35, isActiveMember = false, expiresAt = null }) {
  if (!membership || membership.enabled === false) return null;

  const priceUsdNum = Number(String(membership.price || '').replace(/[^0-9.]/g, '')) || 0;
  const priceCadFormatted = priceUsdNum > 0 ? (priceUsdNum * cadRate).toFixed(2) : null;
  const ctaLink = membership.cta_link || '/contact-us';
  const daysRemaining = isActiveMember && expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

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

        {isActiveMember ? (
          <>
            <div className="membership-price-box">
              <span className="membership-price" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={22} />
                You&apos;re a Member
              </span>
              <span className="membership-price-note">
                {expiresAt
                  ? `Active — ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left (until ${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})`
                  : 'Active membership'}
              </span>
            </div>

            <Link href="/account?tab=profile#membership-panel" className="membership-cta-btn">
              <span className="membership-cta-tick" />
              <span>View My Account</span>
              <span className="membership-cta-tick" />
            </Link>
          </>
        ) : (
          <>
            <div className="membership-price-box">
              <span className="membership-price">{membership.price || '$2,497.00'}</span>
              {priceCadFormatted && (
                <span className="membership-price-cad">≈ C${priceCadFormatted}</span>
              )}
              <span className="membership-price-note">
                {membership.price_note || 'USD / year — billed annually. Limited seats available.'}
              </span>
            </div>

            <Link href={ctaLink} className="membership-cta-btn" onClick={(e) => handleAnchorClick(e, ctaLink)}>
              <span className="membership-cta-tick" />
              <span>{membership.cta_label || 'Unlock The Vault'}</span>
              <span className="membership-cta-tick" />
            </Link>
          </>
        )}

        {membership.closing_text && (
          <p className="membership-closing-text">{membership.closing_text}</p>
        )}
      </div>
    </Reveal>
  );
}
