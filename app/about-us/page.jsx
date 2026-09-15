'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader.jsx';
import { 
  Sparkles, 
  FlaskConical, 
  ShieldCheck, 
  Dna, 
  Boxes, 
  Headphones, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function About() {
  return (
    <div className="about-page-wrapper">
      {/* 1. UNIFIED PAGE HERO */}
      <PageHeader
        badge="About The Pep Shop"
        badgeIcon={Sparkles}
        title="Precision Synthesis for"
        titleHighlight="Scientific Excellence"
        subtitle="Dedicated peptide manufacturing and analytical verification engineered for laboratory research teams worldwide."
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'About Us' }
        ]}
      />

      {/* 2. MAIN CONTENT CONTAINER */}
      <div className="about-container">
        {/* Story & Key Credentials Split */}
        <div className="about-overview-grid">
          <div className="about-story-card">
            <div>
              <span className="about-card-badge">
                <FlaskConical size={12} />
                <span>Our Mission</span>
              </span>
              <h2>Pioneering High-Purity Peptide Science</h2>
              <p>
                The Pep Shop is a peptide company dedicated to precision synthesis and reliable supply for the peptide and biotechnology fields. We collaborate directly with laboratories, university institutions, and independent research teams to deliver custom peptide solutions, bulk supply, and rigorously tested compounds.
              </p>
              <p>
                Every batch is produced with unwavering emphasis on purity and consistency. All products are intended strictly for in-vitro laboratory research and are not approved for human or veterinary use.
              </p>
            </div>
          </div>

          <div className="about-stats-grid">
            <div className="about-stat-card">
              <div className="about-stat-icon-wrap">
                <ShieldCheck size={20} />
              </div>
              <div className="about-stat-value">&ge;99% Purity</div>
              <div className="about-stat-desc">Third-party HPLC &amp; Mass Spectrometry verified</div>
            </div>

            <div className="about-stat-card">
              <div className="about-stat-icon-wrap">
                <Dna size={20} />
              </div>
              <div className="about-stat-value">Custom Synthesis</div>
              <div className="about-stat-desc">Sequences tailored to exact research specifications</div>
            </div>

            <div className="about-stat-card">
              <div className="about-stat-icon-wrap">
                <Boxes size={20} />
              </div>
              <div className="about-stat-value">Bulk Supply</div>
              <div className="about-stat-desc">Scalable volumes for ongoing institutional studies</div>
            </div>

            <div className="about-stat-card">
              <div className="about-stat-icon-wrap">
                <Headphones size={20} />
              </div>
              <div className="about-stat-value">Direct Support</div>
              <div className="about-stat-desc">Responsive assistance for technical and order inquiries</div>
            </div>
          </div>
        </div>

        {/* What We Offer Section */}
        <div className="about-section-head">
          <h2>What We Offer</h2>
          <p>Strict quality standards and transparent service for every research batch</p>
        </div>

        <div className="about-offers-grid">
          <div className="about-offer-card">
            <div className="about-offer-icon">
              <ShieldCheck size={22} />
            </div>
            <h3>Verified Purity</h3>
            <p>Third-party verified purity on every batch with accessible certificates of analysis upon request.</p>
          </div>

          <div className="about-offer-card">
            <div className="about-offer-icon">
              <Dna size={22} />
            </div>
            <h3>Custom Synthesis</h3>
            <p>Custom peptide synthesis tailored specifically to your project requirements, sequence lengths, and timelines.</p>
          </div>

          <div className="about-offer-card">
            <div className="about-offer-icon">
              <Boxes size={22} />
            </div>
            <h3>Bulk Supply</h3>
            <p>Reliable bulk supply and batch reserve options for ongoing laboratory and biotechnology research programs.</p>
          </div>

          <div className="about-offer-card">
            <div className="about-offer-icon">
              <Headphones size={22} />
            </div>
            <h3>Research Support</h3>
            <p>Fast, responsive technical assistance for compound specifications, cold-chain handling, and logistics.</p>
          </div>
        </div>

        {/* Laboratory Compliance Notice */}
        <div className="about-compliance-card">
          <div className="about-compliance-icon">
            <AlertTriangle size={22} />
          </div>
          <div className="about-compliance-info">
            <h4>Laboratory Research Notice</h4>
            <p>All compounds supplied by The Pep Shop are intended solely for in-vitro laboratory research and analytical testing. They are not intended, formulated, or approved for human, medical, diagnostic, or veterinary use.</p>
          </div>
        </div>

        {/* Call to Action Bar */}
        <div className="about-cta-bar">
          <div className="about-cta-text">
            <h3>Ready to Advance Your Research?</h3>
            <p>Explore our research catalog or request a direct quotation for custom peptide synthesis.</p>
          </div>
          <div className="about-cta-actions">
            <Link href="/shop" className="btn btn-primary btn-sm">
              Explore Catalog <ArrowRight size={14} />
            </Link>
            <Link href="/contact-us" className="btn btn-outline btn-sm">
              Contact Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
