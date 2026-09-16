'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, 
  ShieldCheck, 
  Globe, 
  TestTube, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getSiteContent } from '@/lib/siteContent';
import { getCadRate } from '@/lib/wallet';
import { CATEGORIES, PRODUCTS as STATIC_PRODUCTS } from '@/lib/shopData';
import ProductCard from '@/components/ProductCard.jsx';

export default function Shop() {
  return (
    <Suspense fallback={<div className="shop-loading-shell"><p>Loading Research Catalog…</p></div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  // Products state (starts with static catalog, then enhances from Supabase if connected)
  const [productsList, setProductsList] = useState(STATIC_PRODUCTS);
  const [categoriesList, setCategoriesList] = useState(CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState(300);
  const [selectedPurity, setSelectedPurity] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [cadRate, setCadRate] = useState(1.35);
  const [heroProductImage, setHeroProductImage] = useState(null);

  useEffect(() => {
    getCadRate().then(setCadRate);
    getSiteContent('home', {}).then((value) => {
      if (value?.hero?.product_image_url) setHeroProductImage(value.hero.product_image_url);
    });
  }, []);

  // Accordion open/close states
  const [accordions, setAccordions] = useState({
    categories: true,
    price: true,
    purity: true,
    form: true,
    availability: true,
  });

  const toggleAccordion = (section) => {
    setAccordions((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Sync category & search query with URL
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    setActiveCategory(cat);
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Attempt to fetch latest catalog and categories from Supabase
  useEffect(() => {
    let isMounted = true;
    async function fetchSupabaseProducts() {
      try {
        const [{ data, error }, { data: catData, error: catErr }] = await Promise.all([
          supabase.from('products').select('*, categories(slug, name), product_variants(id, price, stock, is_default)').eq('is_active', true),
          supabase.from('categories').select('*').order('name'),
        ]);

        if (!catErr && catData && catData.length > 0 && isMounted) {
          setCategoriesList([
            { id: 'all', slug: 'all', name: 'All' },
            ...catData,
          ]);
        }

        if (!error && data && data.length > 0 && isMounted) {
          // Merge Supabase product rows with static fallback attributes (ratings, reviews)
          const merged = data.map((item) => {
            const staticMatch = STATIC_PRODUCTS.find(
              (p) => p.slug === item.slug || p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase()
            );
            return {
              ...item,
              category: item.categories?.slug || staticMatch?.category || 'all',
              category_name: item.categories?.name || staticMatch?.category_name || 'Peptide',
              rating: staticMatch?.rating || 0,
              reviews_count: staticMatch?.reviews_count || 0,
              purity: staticMatch?.purity || '≥ 99%',
              form: staticMatch?.form || 'Lyophilized',
              in_stock: item.stock > 0,
            };
          });
          setProductsList(merged);
        }
      } catch (err) {
        console.warn('Using static catalog fallback:', err);
      }
    }
    fetchSupabaseProducts();
    return () => { isMounted = false; };
  }, []);

  const handleCategorySelect = (slug) => {
    setActiveCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    router.push(params.toString() ? `/shop?${params.toString()}` : '/shop', { scroll: false });
  };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setMaxPrice(300);
    setSelectedPurity([]);
    setSelectedAvailability([]);
    setSortBy('featured');
    router.push('/shop', { scroll: false });
  };

  const togglePurity = (val) => {
    setSelectedPurity((prev) =>
      prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]
    );
  };

  const toggleAvailability = (val) => {
    setSelectedAvailability((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]
    );
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return productsList
      .filter((product) => {
        // Category
        if (activeCategory !== 'all' && product.category !== activeCategory) {
          return false;
        }
        // Price
        if (product.price > maxPrice) {
          return false;
        }
        // Purity
        if (selectedPurity.length > 0 && !selectedPurity.includes(product.purity)) {
          return false;
        }
        // Availability
        if (selectedAvailability.length > 0) {
          if (selectedAvailability.includes('in-stock') && !product.in_stock) return false;
          if (selectedAvailability.includes('out-of-stock') && product.in_stock) return false;
        }
        // Text search (name + short description)
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matches =
            product.name?.toLowerCase().includes(q) ||
            product.short_desc?.toLowerCase().includes(q) ||
            product.category_name?.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        // default 'featured'
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [productsList, activeCategory, maxPrice, selectedPurity, selectedAvailability, sortBy, searchQuery]);

  return (
    <div className="shop-page-wrapper">
      {/* 1. TOP SCIENTIFIC HERO BANNER */}
      <section className="shop-hero-banner">
        <div className="shop-hero-container">
          <div className="shop-hero-content">
            <div className="shop-hero-eyebrow">
              <span className="shop-eyebrow-icon">
                <Sparkles size={14} />
              </span>
              <span>PREMIUM QUALITY. TRUSTED RESEARCH.</span>
            </div>

            <h1 className="shop-hero-title">
              Research <span className="shop-title-highlight">Peptides</span>
            </h1>

            <p className="shop-hero-subtitle">
              High-purity peptides for advanced scientific research.
            </p>

            {/* 4 Feature Badges in a Row */}
            <div className="shop-hero-features">
              <div className="shop-feature-pill">
                <FlaskConical size={16} className="feature-icon" />
                <span>Lab Tested</span>
              </div>
              <div className="shop-feature-pill">
                <ShieldCheck size={16} className="feature-icon" />
                <span>High Purity</span>
              </div>
              <div className="shop-feature-pill">
                <Globe size={16} className="feature-icon" />
                <span>Global Supply</span>
              </div>
              <div className="shop-feature-pill">
                <TestTube size={16} className="feature-icon" />
                <span>Research Only</span>
              </div>
            </div>
          </div>

          {/* Right Visual with 3D Molecules & Vial Art */}
          <div className="shop-hero-visual">
            {heroProductImage && (
              <div className="shop-hero-art-wrap">
                <img
                  src={heroProductImage}
                  alt="The Pep Shop Research Peptides Showcase"
                  className="shop-hero-img"
                />
                <div className="shop-hero-tagline">
                  <em>Science for a<br />Healthier Tomorrow</em>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. BREADCRUMB & COUNT ROW */}
      <div className="shop-sub-nav">
        <div className="shop-container">
          <div className="shop-sub-nav-inner">
            <nav className="shop-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Shop</span>
            </nav>
            <div className="shop-product-count">
              <strong>{filteredProducts.length}</strong> products
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN SHOP LAYOUT (SIDEBAR + PRODUCTS) */}
      <div className="shop-container shop-main-content">
        {/* Top Controls: Category Pills & Sort Dropdown */}
        <div className="shop-top-controls">
          <div className="shop-pills-row">
            {categoriesList.map((cat) => (
              <button
                key={cat.id || cat.slug}
                type="button"
                className={`shop-cat-pill ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat.slug)}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="shop-controls-right">
            {/* Search Box */}
            <div className="shop-search-box">
              <Search size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  const params = new URLSearchParams(searchParams.toString());
                  if (val.trim()) params.set('search', val); else params.delete('search');
                  router.replace(params.toString() ? `/shop?${params.toString()}` : '/shop', { scroll: false });
                }}
                placeholder="Search products..."
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('search');
                    router.replace(params.toString() ? `/shop?${params.toString()}` : '/shop', { scroll: false });
                  }}
                  aria-label="Clear search"
                  className="shop-search-clear"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Mobile Filter Trigger Button */}
            <button
              type="button"
              className="shop-mobile-filter-trigger"
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="shop-sort-wrap">
              <label htmlFor="shop-sort-select" className="shop-sort-label">Sort by</label>
              <div className="shop-select-box">
                <select
                  id="shop-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="shop-sort-select"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
                <ChevronDown size={14} className="select-arrow" />
              </div>
            </div>
          </div>
        </div>

        {/* Layout Grid: Sidebar + Grid */}
        <div className="shop-grid-layout">
          {/* LEFT SIDEBAR FILTERS (Desktop) */}
          <aside className={`shop-sidebar ${mobileFilterOpen ? 'mobile-open' : ''}`}>
            <div className="shop-sidebar-inner">
              <div className="shop-sidebar-header">
                <div className="sidebar-title-row">
                  <h3>Filters</h3>
                  <button
                    type="button"
                    className="shop-reset-btn"
                    onClick={handleResetFilters}
                  >
                    Reset All
                  </button>
                </div>
                {/* Mobile Drawer Close Button */}
                <button
                  type="button"
                  className="shop-sidebar-close-btn"
                  onClick={() => setMobileFilterOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Accordion 1: Categories */}
              <div className="shop-filter-group">
                <button
                  type="button"
                  className="filter-accordion-header"
                  onClick={() => toggleAccordion('categories')}
                >
                  <span>Categories</span>
                  {accordions.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {accordions.categories && (
                  <div className="filter-accordion-body">
                    {categoriesList.map((cat) => {
                      const count = cat.slug === 'all'
                        ? productsList.length
                        : productsList.filter((p) => p.category === cat.slug || p.categories?.slug === cat.slug).length;

                      return (
                        <label key={cat.id || cat.slug} className="filter-check-row">
                          <input
                            type="checkbox"
                            checked={activeCategory === cat.slug}
                            onChange={() => handleCategorySelect(cat.slug)}
                          />
                          <span className="checkbox-custom"></span>
                          <span className="filter-label-text">{cat.name}</span>
                          <span className="filter-count">({count})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 2: Price Range */}
              <div className="shop-filter-group">
                <button
                  type="button"
                  className="filter-accordion-header"
                  onClick={() => toggleAccordion('price')}
                >
                  <span>Price Range</span>
                  {accordions.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {accordions.price && (
                  <div className="filter-accordion-body">
                    <div className="price-slider-container">
                      <input
                        type="range"
                        min="0"
                        max="300"
                        step="5"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="shop-price-slider"
                      />
                      <div className="price-slider-markers">
                        <span>$0</span>
                        <span className="price-current-tag">$0 – ${maxPrice}</span>
                        <span>$300</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Purity */}
              <div className="shop-filter-group">
                <button
                  type="button"
                  className="filter-accordion-header"
                  onClick={() => toggleAccordion('purity')}
                >
                  <span>Purity</span>
                  {accordions.purity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {accordions.purity && (
                  <div className="filter-accordion-body">
                    <label className="filter-check-row">
                      <input
                        type="checkbox"
                        checked={selectedPurity.includes('≥ 99%')}
                        onChange={() => togglePurity('≥ 99%')}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="filter-label-text">≥ 99%</span>
                      <span className="filter-count">(8)</span>
                    </label>

                    <label className="filter-check-row">
                      <input
                        type="checkbox"
                        checked={selectedPurity.includes('≥ 98%')}
                        onChange={() => togglePurity('≥ 98%')}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="filter-label-text">≥ 98%</span>
                      <span className="filter-count">(3)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Accordion 4: Form */}
              <div className="shop-filter-group">
                <button
                  type="button"
                  className="filter-accordion-header"
                  onClick={() => toggleAccordion('form')}
                >
                  <span>Form</span>
                  {accordions.form ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {accordions.form && (
                  <div className="filter-accordion-body">
                    <label className="filter-check-row">
                      <input type="checkbox" defaultChecked readOnly />
                      <span className="checkbox-custom"></span>
                      <span className="filter-label-text">Lyophilized</span>
                      <span className="filter-count">(11)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Accordion 5: Availability */}
              <div className="shop-filter-group">
                <button
                  type="button"
                  className="filter-accordion-header"
                  onClick={() => toggleAccordion('availability')}
                >
                  <span>Availability</span>
                  {accordions.availability ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {accordions.availability && (
                  <div className="filter-accordion-body">
                    <label className="filter-check-row">
                      <input
                        type="checkbox"
                        checked={selectedAvailability.includes('in-stock')}
                        onChange={() => toggleAvailability('in-stock')}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="filter-label-text">In Stock</span>
                      <span className="filter-count">(11)</span>
                    </label>

                    <label className="filter-check-row">
                      <input
                        type="checkbox"
                        checked={selectedAvailability.includes('out-of-stock')}
                        onChange={() => toggleAvailability('out-of-stock')}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="filter-label-text">Out of Stock</span>
                      <span className="filter-count">(0)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Need Bulk Order? Callout Card */}
              <div className="shop-bulk-order-card">
                <div className="bulk-card-icon">
                  <FlaskConical size={24} />
                </div>
                <h4>Need Bulk Order?</h4>
                <p>Get special pricing for research institutions and laboratories.</p>
                <Link href="/contact-us" className="bulk-order-btn">
                  <span>Contact Us</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Mobile Backdrop Overlay */}
          {mobileFilterOpen && (
            <div
              className="shop-sidebar-backdrop"
              onClick={() => setMobileFilterOpen(false)}
            />
          )}

          {/* RIGHT PRODUCTS GRID */}
          <main className="shop-products-column">
            {filteredProducts.length === 0 ? (
              <div className="shop-empty-state">
                <div className="empty-icon-wrap">
                  <TestTube size={36} />
                </div>
                <h3>No Research Peptides Found</h3>
                <p>Try clearing or broadening your filter criteria to view more products.</p>
                <button
                  type="button"
                  className="shop-reset-btn-pill"
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={16} />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <motion.div
                className="shop-products-grid"
                layout
              >
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id || product.slug}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                      layout
                    >
                      <ProductCard product={product} cadRate={cadRate} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
