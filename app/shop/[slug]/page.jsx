'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { PRODUCTS } from '@/lib/shopData';
import ProductCard from '@/components/ProductCard.jsx';
import { 
  ShoppingCart, 
  Check, 
  ShieldCheck, 
  Truck, 
  FileText, 
  FlaskConical, 
  Sparkles, 
  ArrowLeft, 
  Star, 
  ChevronRight,
  ChevronLeft, 
  AlertTriangle,
  Clock,
  Dna,
  Zap,
  Download,
  Info,
  MessageSquare,
  Send,
  CheckCircle2
} from 'lucide-react';

// Scientific Specs Map for Known Peptides
const SCIENTIFIC_SPECS = {
  'bpc-157': {
    sequence: 'Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val',
    formula: 'C62H98N16O22',
    mw: '1419.53 g/mol',
    cas: '137525-51-0',
    appearance: 'White lyophilized sterile powder',
    solubility: 'Soluble in sterile bacteriostatic water',
    storage: 'Store at -20°C dry; 2-8°C reconstituted up to 28 days',
    focus: 'Tissue repair, angiogenesis, and gastric stability research',
    halfLife: '~4 hours in laboratory media',
    applications: 'In-vitro cellular wound healing, fibroblast proliferation assays',
  },
  'cjc-1295-no-dac': {
    sequence: 'Tyr-D-Ala-Asp-Ala-Ile-Phe-Thr-Gln-Ser-Tyr-Arg-Lys-Val-Leu-Ala-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Leu-Ser-Arg-NH2',
    formula: 'C152H252N44O42',
    mw: '3367.97 g/mol',
    cas: '863288-34-0',
    appearance: 'White lyophilized powder',
    solubility: 'Soluble in sterile water or bacteriostatic water',
    storage: 'Store desiccated at -20°C; protect from moisture',
    focus: 'Pituitary receptor signaling and GH pulsation dynamics',
    halfLife: '~30 minutes (non-conjugated)',
    applications: 'Somatotropic cellular signaling, receptor affinity models',
  },
  'cjc-1295-with-dac': {
    sequence: 'CJC-1295 with Maleimidoproprionic acid (DAC) Bioconjugate',
    formula: 'C165H271N47O46',
    mw: '3647.28 g/mol',
    cas: '446036-97-1',
    appearance: 'White lyophilized powder',
    solubility: 'Soluble in sterile water or bacteriostatic water',
    storage: 'Store at -20°C; light-sensitive, keep desiccated',
    focus: 'Extended bio-conjugation and albumin binding kinetics',
    halfLife: '~6-8 days in serum modeling',
    applications: 'Pharmacokinetic bioconjugate dynamics, receptor persistence',
  },
  'tb-500': {
    sequence: 'Ac-Ser-Asp-Lys-Pro-Asp-Met-Ala-Glu-Ile-Glu-Lys-Phe-Asp-Lys-Ser-Lys-Leu-Lys-Lys-Thr-Glu-Thr-Gln-Glu-Lys-Asn-Pro-Leu-Pro-Ser-Lys-Glu-Thr-Ile-Glu-Gln-Glu-Lys-Gln-Ala-Gly-Glu-Ser',
    formula: 'C212H350N56O78S',
    mw: '4963.50 g/mol',
    cas: '885340-08-9',
    appearance: 'White lyophilized sterile powder',
    solubility: 'Soluble in bacteriostatic water',
    storage: 'Store at -20°C dry; 2-8°C reconstituted',
    focus: 'Actin filament regulation and cell migration studies',
    halfLife: 'Bi-exponential elimination curve',
    applications: 'Endothelial cell motility, actin upregulation models',
  },
  'semaglutide': {
    sequence: 'Glucagon-like peptide-1 (GLP-1) receptor agonist analogue',
    formula: 'C187H291N45O59',
    mw: '4113.58 g/mol',
    cas: '910463-68-2',
    appearance: 'White lyophilized powder',
    solubility: 'Soluble in sterile bacteriostatic water',
    storage: 'Store at -20°C dry; protect from UV exposure',
    focus: 'Metabolic receptor pathways and glucose metabolism research',
    halfLife: '~165 hours in laboratory modeling',
    applications: 'Incretin receptor signaling, beta-cell model research',
  },
  'tirzepatide': {
    sequence: 'Dual GIP and GLP-1 receptor agonist peptide',
    formula: 'C225H348N48O68',
    mw: '4813.45 g/mol',
    cas: '2023788-19-2',
    appearance: 'White lyophilized powder',
    solubility: 'Soluble in sterile bacteriostatic water',
    storage: 'Store at -20°C dry',
    focus: 'Dual incretin receptor synergy and lipid metabolic models',
    halfLife: '~120 hours in research modeling',
    applications: 'Dual receptor kinetics, metabolic pathway interaction assays',
  }
};

export default function ProductDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();

  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const isWishlisted = product ? isInWishlist(product.id) : false;
  const [activeTab, setActiveTab] = useState('overview');
  
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth;
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);

    // Check static fallback catalog first as immediate base
    const staticMatch = PRODUCTS.find((p) => p.slug === slug);

    supabase
      .from('products')
      .select('*, categories(name,slug)')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (data && !error) {
          setProduct(data);
        } else if (staticMatch) {
          setProduct(staticMatch);
        } else {
          setProduct(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        if (staticMatch) {
          setProduct(staticMatch);
        } else {
          setProduct(null);
        }
        setLoading(false);
      });

    return () => { active = false; };
  }, [slug]);

  // Dynamic Product Reviews state
  const [productReviews, setProductReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/reviews?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setProductReviews(data.reviews || []);
      })
      .catch(() => {});
  }, [slug]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product?.id,
          product_slug: slug,
          product_name: product?.name,
          user_name: reviewForm.name,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });
      if (res.ok) {
        setReviewSuccess(true);
        setReviewForm({ name: '', rating: 5, comment: '' });
      }
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Scientific specs for the active product
  const specs = useMemo(() => {
    if (!product) return null;
    const key = Object.keys(SCIENTIFIC_SPECS).find((k) => product.slug?.includes(k));
    if (key) return SCIENTIFIC_SPECS[key];
    return {
      sequence: 'Sequence proprietary / available on request for research partners',
      formula: 'Custom Analytical Grade Formulation',
      mw: 'Analytical Research Standard',
      cas: 'Verified Research Compound',
      appearance: 'White lyophilized sterile powder',
      solubility: 'Soluble in sterile bacteriostatic water',
      storage: 'Store desiccated at -20°C; protect from light and moisture',
      focus: 'Advanced peptide synthesis and cellular bio-investigation',
      halfLife: 'Standard peptide clearance dynamics',
      applications: 'In-vitro laboratory research and analytical characterization',
    };
  }, [product]);

  // Related products from catalog
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return PRODUCTS
      .filter((p) => p.slug !== product.slug)
      .slice(0, 4);
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, quantity);
    router.push(user ? '/checkout' : '/login');
  };

  if (loading) {
    return (
      <div className="pdp-page-wrapper">
        <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#c8102e', fontWeight: 700 }}>
            <FlaskConical className="animate-spin" size={24} />
            <span>Loading Research Compound…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-page-wrapper">
        <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 440, margin: '0 auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 36 }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🧪</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 8 }}>Compound Not Found</h2>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', marginBottom: 20 }}>The peptide compound you requested could not be located in our research catalog.</p>
            <Link href="/shop" className="btn btn-primary btn-sm">
              <ArrowLeft size={14} /> Back to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const priceNum = Number(product.price || 0);
  const priceFormatted = priceNum.toFixed(2);
  const subtotalFormatted = (priceNum * quantity).toFixed(2);
  const reviewsVal = productReviews.length;
  const avgRating = reviewsVal > 0
    ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / reviewsVal).toFixed(1)
    : '0.0';
  const ratingVal = reviewsVal > 0 ? Number(avgRating) : 0;
  const categoryName = product.categories?.name || product.category_name || 'Research Peptides';
  const purityVal = product.purity || '≥ 99%';
  const formVal = product.form || 'Lyophilized';
  const inStock = product.in_stock !== false;

  return (
    <div className="pdp-page-wrapper">
      {/* 1. TOP SUB-NAV BREADCRUMBS BAR */}
      <div className="pdp-sub-nav">
        <div className="pdp-nav-container">
          <nav className="pdp-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/" className="pdp-crumb-link">Home</Link>
            <span className="pdp-crumb-sep">/</span>
            <Link href="/shop" className="pdp-crumb-link">Shop</Link>
            <span className="pdp-crumb-sep">/</span>
            <span className="pdp-crumb-link">{categoryName}</span>
            <span className="pdp-crumb-sep">/</span>
            <span className="pdp-crumb-active">{product.name}</span>
          </nav>

          <Link href="/shop" className="pdp-back-link">
            <ArrowLeft size={14} />
            <span>Back to Catalog</span>
          </Link>
        </div>
      </div>

      {/* 2. MAIN PRODUCT SHOWCASE HERO */}
      <section className="pdp-main-section">
        <div className="pdp-container">
          <div className="pdp-hero-grid">
            {/* Left Column: Visual Showcase Gallery */}
            <div className="pdp-gallery-col">
              <div className="pdp-image-card">
                {/* Floating Stock Badge */}
                <div className={`pdp-badge-status ${inStock ? 'in-stock' : 'out-stock'}`}>
                  {inStock && <span className="pdp-pulse-dot"></span>}
                  <span>{inStock ? 'In Stock & Ready to Ship' : 'Out of Stock'}</span>
                </div>

                {/* Wishlist Button */}
                <button
                  type="button"
                  className={`pdp-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={() => product && toggleWishlist(product)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={isWishlisted ? '#c8102e' : 'none'}
                    stroke={isWishlisted ? '#c8102e' : 'var(--color-ink-soft)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                {/* Main Image */}
                <img
                  src={product.image_url || '/images/bpc-157-300x300.webp'}
                  alt={product.name}
                  loading="eager"
                />

                {/* Floating Purity Badge */}
                <div className="pdp-badge-purity">
                  <ShieldCheck size={14} />
                  <span>{purityVal} HPLC Tested</span>
                </div>
              </div>

              {/* Trust Badges Below Image */}
              <div className="pdp-gallery-trust-strip">
                <div className="pdp-trust-badge">
                  <ShieldCheck size={18} className="pdp-trust-icon" />
                  <span className="pdp-trust-text">Third-Party Tested &ge;99%</span>
                </div>
                <div className="pdp-trust-badge">
                  <Truck size={18} className="pdp-trust-icon" />
                  <span className="pdp-trust-text">Cold-Chain Express Packaging</span>
                </div>
                <div className="pdp-trust-badge">
                  <FileText size={18} className="pdp-trust-icon" />
                  <span className="pdp-trust-text">Verified COA Included</span>
                </div>
              </div>
            </div>

            {/* Right Column: Details & Purchasing Panel */}
            <div className="pdp-details-card">
              <div className="pdp-category-row">
                <span className="pdp-category-tag">
                  <FlaskConical size={12} />
                  <span>{categoryName}</span>
                </span>
                <span className="pdp-batch-sku">Batch: #DP-{product.id?.slice(0, 5) || '8492'}</span>
              </div>

              <h1 className="pdp-title">{product.name}</h1>

              {/* Rating & Verified Strip */}
              <div className="pdp-rating-row">
                <div className="pdp-stars" aria-label={`Rating: ${ratingVal} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= Math.round(ratingVal) && reviewsVal > 0 ? '#dc2626' : '#2a2e37'}
                      stroke={star <= Math.round(ratingVal) && reviewsVal > 0 ? '#dc2626' : '#454a56'}
                    />
                  ))}
                </div>
                <span className="pdp-rating-score">{reviewsVal > 0 ? ratingVal.toFixed(1) : '0.0'}</span>
                <span className="pdp-reviews-count">({reviewsVal} verified reviews)</span>
                <span className="pdp-verified-tag">Verified Batch</span>
              </div>

              {/* Price Block */}
              <div className="pdp-price-box">
                <div className="pdp-price-main">
                  <span className="pdp-price-val">${priceFormatted}</span>
                </div>
                <div className="pdp-tier-discount">
                  <Sparkles size={12} />
                  <span>Volume Pricing: Buy 5+ save 10% | Buy 10+ save 15%</span>
                </div>
              </div>

              {/* 4 Key Scientific Spec Badges */}
              <div className="pdp-specs-grid">
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Purity Level</div>
                  <div className="pdp-spec-val">{purityVal} (RP-HPLC)</div>
                </div>
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Physical Form</div>
                  <div className="pdp-spec-val">{formVal} Powder</div>
                </div>
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Storage Temp</div>
                  <div className="pdp-spec-val">-20&deg;C Recommended</div>
                </div>
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Compound Grade</div>
                  <div className="pdp-spec-val">Analytical Grade</div>
                </div>
              </div>

              {/* Short Description */}
              <p className="pdp-short-desc">
                {product.short_desc || product.description || 'High-purity synthetic research peptide synthesized under strict analytical parameters for in-vitro investigative protocols.'}
              </p>

              {/* Quantity Stepper & Actions */}
              <div className="pdp-purchase-section">
                <div className="pdp-qty-row">
                  <span className="pdp-qty-label">Research Vial Quantity:</span>
                  <div className="pdp-qty-stepper">
                    <button
                      type="button"
                      className="pdp-stepper-btn"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      –
                    </button>
                    <span className="pdp-qty-val">{quantity}</span>
                    <button
                      type="button"
                      className="pdp-stepper-btn"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pdp-actions-row">
                  <button
                    type="button"
                    className={`pdp-add-cart-btn ${added ? 'added' : ''}`}
                    onClick={handleAddToCart}
                  >
                    {added ? (
                      <>
                        <Check size={18} strokeWidth={2.8} />
                        <span>Added (${subtotalFormatted})!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} strokeWidth={2.2} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="pdp-buy-now-btn"
                    onClick={handleBuyNow}
                  >
                    <Zap size={16} />
                    <span>Buy Now</span>
                  </button>
                </div>

                {/* Dispatch & Compliance Notes */}
                <div className="pdp-dispatch-note">
                  <Clock size={15} />
                  <span>Orders placed before 2:00 PM EST ship same business day.</span>
                </div>

                <div className="pdp-compliance-warning">
                  <AlertTriangle size={16} />
                  <span>Strictly intended for in-vitro laboratory research and analytical testing. Not approved for human or veterinary use.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SCIENTIFIC DEEP-DIVE TABS SECTION */}
      <section className="pdp-tabs-section">
        <div className="pdp-container">
          <div className="pdp-tabs-card">
            {/* Tabs Navigation Header */}
            <div className="pdp-tabs-nav" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'overview'}
                className={`pdp-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Info size={16} />
                <span>Research Overview</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'specs'}
                className={`pdp-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
                onClick={() => setActiveTab('specs')}
              >
                <Dna size={16} />
                <span>Chemical Specifications</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'handling'}
                className={`pdp-tab-btn ${activeTab === 'handling' ? 'active' : ''}`}
                onClick={() => setActiveTab('handling')}
              >
                <FlaskConical size={16} />
                <span>Handling &amp; Reconstitution</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'coa'}
                className={`pdp-tab-btn ${activeTab === 'coa' ? 'active' : ''}`}
                onClick={() => setActiveTab('coa')}
              >
                <ShieldCheck size={16} />
                <span>COA &amp; Testing</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'reviews'}
                className={`pdp-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                <Star size={16} />
                <span>Reviews ({reviewsVal})</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="pdp-tab-content-body">
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="pdp-overview-text">
                  <h3>Compound Overview &amp; Research Mechanism</h3>
                  <p>
                    {product.description || `${product.name} is a high-purity synthetic peptide compound specifically synthesized for biochemical, molecular, and in-vitro investigative workflows.`}
                  </p>
                  <p>
                    Our laboratory synthesis protocol employs solid-phase peptide synthesis (SPPS) followed by reverse-phase preparative chromatography to isolate target isomers and achieve purity consistently exceeding {purityVal}.
                  </p>

                  <div className="pdp-highlights-grid">
                    <div className="pdp-highlight-box">
                      <h4>Primary Research Focus</h4>
                      <p>{specs.focus}</p>
                    </div>
                    <div className="pdp-highlight-box">
                      <h4>Laboratory Kinetics</h4>
                      <p>{specs.halfLife}</p>
                    </div>
                    <div className="pdp-highlight-box">
                      <h4>Investigative Scope</h4>
                      <p>{specs.applications}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Chemical Specifications */}
              {activeTab === 'specs' && (
                <div>
                  <div className="pdp-specs-table-wrap">
                    <table className="pdp-specs-table">
                      <tbody>
                        <tr>
                          <th>Compound Name</th>
                          <td><strong>{product.name}</strong></td>
                        </tr>
                        <tr>
                          <th>Molecular Formula</th>
                          <td><code>{specs.formula}</code></td>
                        </tr>
                        <tr>
                          <th>Molecular Weight</th>
                          <td>{specs.mw}</td>
                        </tr>
                        <tr>
                          <th>CAS Registry Number</th>
                          <td>{specs.cas}</td>
                        </tr>
                        <tr>
                          <th>Amino Acid Sequence</th>
                          <td className="pdp-mono-seq">{specs.sequence}</td>
                        </tr>
                        <tr>
                          <th>Analytical Purity</th>
                          <td>&ge; 99% verified via RP-HPLC &amp; Mass Spectrometry</td>
                        </tr>
                        <tr>
                          <th>Physical Appearance</th>
                          <td>{specs.appearance}</td>
                        </tr>
                        <tr>
                          <th>Solubility Profile</th>
                          <td>{specs.solubility}</td>
                        </tr>
                        <tr>
                          <th>Recommended Storage</th>
                          <td>{specs.storage}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Reconstitution Guidelines */}
              {activeTab === 'handling' && (
                <div className="pdp-steps-list">
                  <div className="pdp-step-item">
                    <div className="pdp-step-num">1</div>
                    <div className="pdp-step-content">
                      <h4>Preparation &amp; Aseptic Environment</h4>
                      <p>Wipe the vial stopper with a sterile 70% isopropyl alcohol prep pad. Allow to air dry completely under a laminar flow hood or sterile workstation before needle entry.</p>
                    </div>
                  </div>

                  <div className="pdp-step-item">
                    <div className="pdp-step-num">2</div>
                    <div className="pdp-step-content">
                      <h4>Controlled Diluent Introduction</h4>
                      <p>Introduce the desired volume of sterile bacteriostatic water (0.9% benzyl alcohol) by angling the needle against the glass inner wall. Allow diluent to slowly flow down without splashing directly onto the lyophilized cake.</p>
                    </div>
                  </div>

                  <div className="pdp-step-item">
                    <div className="pdp-step-num">3</div>
                    <div className="pdp-step-content">
                      <h4>Gentle Dissolution Protocol (Do Not Vortex)</h4>
                      <p>Swirl the vial gently with a slow rotational movement until the lyophilized powder dissolves into a completely clear, optical solution. Never shake or vortex peptide solutions as shear forces can denature peptide bonds.</p>
                    </div>
                  </div>

                  <div className="pdp-step-item">
                    <div className="pdp-step-num">4</div>
                    <div className="pdp-step-content">
                      <h4>Aliquot &amp; Temperature Storage</h4>
                      <p>Reconstituted solution should be stored refrigerated at 2&deg;C to 8&deg;C for short-term use (up to 28 days). For extended experimental series, aliquot into sterile cryovials and freeze at -20&deg;C to prevent repeated freeze-thaw degradation.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: COA Verification */}
              {activeTab === 'coa' && (
                <div className="pdp-coa-card">
                  <div className="pdp-coa-info">
                    <h3>Certificate of Analysis (COA) Guarantee</h3>
                    <p>
                      Each production batch undergoes rigorous dual-stage analytical testing by certified independent testing facilities. High-Performance Liquid Chromatography (HPLC) confirms purity exceeding {purityVal}, while Mass Spectrometry (MS) confirms exact molecular weight validation.
                    </p>
                    <div className="pdp-coa-badge-row">
                      <span className="pdp-coa-pill">
                        <ShieldCheck size={14} /> Batch HPLC Trace
                      </span>
                      <span className="pdp-coa-pill">
                        <Dna size={14} /> Mass Spec Validated
                      </span>
                      <span className="pdp-coa-pill">
                        <FlaskConical size={14} /> Residual Solvent Screened
                      </span>
                    </div>
                  </div>
                  <div className="pdp-coa-action">
                    <Link
                      href={`/contact-us?subject=COA%20Request%20-%20${encodeURIComponent(product.name)}`}
                      className="btn btn-dark btn-sm"
                    >
                      <Download size={14} />
                      <span>Request Batch COA</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Tab 5: Customer Reviews */}
              {activeTab === 'reviews' && (
                <div style={{ padding: '4px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 28 }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: 20 }}>Verified Laboratory Reviews</h3>
                      <p style={{ color: 'var(--color-ink-soft)', fontSize: 13.5, margin: 0 }}>
                        Real feedback submitted by certified researchers and laboratory partners.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '10px 18px' }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)' }}>{ratingVal.toFixed(1)}</span>
                      <div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= Math.round(ratingVal) && reviewsVal > 0 ? '#dc2626' : '#2a2e37'}
                              stroke={s <= Math.round(ratingVal) && reviewsVal > 0 ? '#dc2626' : '#454a56'}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                          Based on {reviewsVal} review{reviewsVal === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Review Submission Form */}
                  <div
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 14,
                      padding: '20px 22px',
                      marginBottom: 28,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    }}
                  >
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MessageSquare size={16} style={{ color: '#c8102e' }} />
                      <span>Write a Review</span>
                    </h4>

                    {reviewSuccess ? (
                      <div
                        style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: 10,
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          color: '#34d399',
                          fontSize: 13.5,
                        }}
                      >
                        <CheckCircle2 size={18} />
                        <span>
                          Thank you! Your review has been submitted for moderation and will appear once approved by admin.
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReview}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                              Your Name / Researcher ID *
                            </label>
                            <input
                              required
                              type="text"
                              placeholder="Dr. John / Alex R."
                              value={reviewForm.name}
                              onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: 13.5,
                                border: '1px solid var(--color-border)',
                                borderRadius: 8,
                                outline: 'none',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                              Rating *
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}
                                  title={`${star} star${star > 1 ? 's' : ''}`}
                                >
                                  <Star
                                    size={20}
                                    fill={star <= reviewForm.rating ? '#dc2626' : '#2a2e37'}
                                    stroke={star <= reviewForm.rating ? '#dc2626' : '#454a56'}
                                  />
                                </button>
                              ))}
                              <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 6, color: 'var(--color-ink-soft)' }}>
                                {reviewForm.rating} of 5
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
                            Your Feedback / Findings *
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Share your research experience, reconstitution solubility, or purity feedback..."
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: 13.5,
                              border: '1px solid var(--color-border)',
                              borderRadius: 8,
                              outline: 'none',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="account-btn-primary"
                          style={{ padding: '8px 18px', fontSize: 13 }}
                        >
                          <Send size={14} />
                          <span>{submittingReview ? 'Submitting...' : 'Submit Review'}</span>
                        </button>
                      </form>
                    )}
                  </div>

                  {/* List of Approved Reviews */}
                  {productReviews.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.2)' }}>
                      <p style={{ color: 'var(--color-ink-soft)', fontSize: 13.5, margin: '0 0 4px' }}>
                        No published reviews yet.
                      </p>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        All reviews undergo verification before publication.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {productReviews.map((rev) => (
                        <div
                          key={rev.id}
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 12,
                            padding: '16px 18px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: 14, color: 'var(--color-ink)' }}>{rev.user_name}</strong>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#34d399', background: 'rgba(16,185,129,0.12)', padding: '2px 7px', borderRadius: 100 }}>
                                <CheckCircle2 size={11} /> Verified Researcher
                              </span>
                            </div>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                              {new Date(rev.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={13}
                                fill={s <= rev.rating ? '#dc2626' : '#2a2e37'}
                                stroke={s <= rev.rating ? '#dc2626' : '#454a56'}
                              />
                            ))}
                          </div>

                          <p style={{ fontSize: 13.5, color: 'var(--color-ink-soft)', margin: 0, lineHeight: 1.5 }}>
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <section className="pdp-related-section">
          <div className="pdp-container">
            <div className="pdp-related-head">
              <h2>Complementary Research Peptides</h2>
              <p>Commonly paired research compounds synthesized to identical analytical standards</p>
            </div>
            <div className="pdp-carousel-wrapper">
              <button className="carousel-nav-btn carousel-nav-left" onClick={() => scrollCarousel('left')} aria-label="Scroll left">
                <ChevronLeft size={20} />
              </button>
              <div className="pdp-related-grid" ref={carouselRef}>
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id || p.slug} product={p} />
                ))}
              </div>
              <button className="carousel-nav-btn carousel-nav-right" onClick={() => scrollCarousel('right')} aria-label="Scroll right">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 5. MOBILE STICKY BOTTOM BAR (Visible only on mobile viewports) */}
      <div className="pdp-mobile-bar">
        <div className="pdp-mobile-bar-price">
          <span className="pdp-mobile-bar-label">Total ({quantity} vial{quantity > 1 ? 's' : ''}):</span>
          <span className="pdp-mobile-bar-amount">${subtotalFormatted}</span>
        </div>
        <button
          type="button"
          className="pdp-mobile-bar-btn"
          onClick={handleAddToCart}
        >
          {added ? (
            <>
              <Check size={16} strokeWidth={2.8} />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart size={16} />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
