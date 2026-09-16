'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ShoppingCart, Check } from 'lucide-react';

export default function ProductCard({ product, cadRate = 1.35 }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addedAnim, setAddedAnim] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  const imageUrl = product.image_url || product.image || '/images/bpc-157-300x300.webp';
  const variants = product.product_variants || [];
  const cheapestVariant = variants.length > 0
    ? variants.slice().sort((a, b) => Number(a.price) - Number(b.price))[0]
    : null;
  const displayPrice = cheapestVariant ? Number(cheapestVariant.price) : Number(product.price || 0);
  const priceFormatted = displayPrice.toFixed(2);
  const cadPriceFormatted = (displayPrice * cadRate).toFixed(2);
  const showFrom = variants.length > 1;
  const rating = Number(product.rating || 0);
  const reviewsCount = Number(product.reviews_count || 0);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = variants.find((v) => v.is_default) || cheapestVariant;
    addItem(product, 1, defaultVariant);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1200);
  };

  return (
    <motion.div
      className="shop-product-card product-card"
      whileHover={{ y: -5, boxShadow: '0 16px 32px -8px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)' }}
      transition={{ type: 'spring', stiffness: 350, damping: 26 }}
    >
      {/* Thumbnail with Wishlist Button */}
      <div className="shop-card-thumb-wrap">
        <Link href={`/shop/${product.slug}`} className="shop-card-thumb-link">
          <motion.img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="shop-card-img"
          />
        </Link>
        <button
          type="button"
          className={`shop-wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={isWishlisted ? '#0066ff' : 'none'}
            stroke={isWishlisted ? '#0066ff' : '#64748b'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Card Content */}
      <div className="shop-card-body">
        <div className="shop-card-badge-slot">
          {product.featured && (
            <span className="shop-featured-badge">FEATURED</span>
          )}
        </div>

        <Link href={`/shop/${product.slug}`} className="shop-card-title-link">
          <h3 className="shop-card-title">{product.name}</h3>
        </Link>

        <p className="shop-card-desc">{product.short_desc || product.desc}</p>

        {/* Rating Stars & Count */}
        <div className="shop-card-rating-row">
          <div className="shop-stars" aria-label={`Rating: ${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={star <= Math.round(rating) && reviewsCount > 0 ? "#0066ff" : "#e2e8f0"}
                stroke={star <= Math.round(rating) && reviewsCount > 0 ? "#0066ff" : "#cbd5e1"}
                strokeWidth="1"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span className="shop-rating-val">{reviewsCount > 0 ? rating.toFixed(1) : '0.0'}</span>
          <span className="shop-review-count">({reviewsCount})</span>
        </div>

        {/* Price & Add to Cart (Icon Only) */}
        <div className="shop-card-action-row">
          <div className="shop-card-price-box">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              {showFrom && <span className="shop-card-price-from">From</span>}
              <span className="shop-card-price">${priceFormatted}</span>
            </div>
            <span className="shop-card-price-cad">≈ C${cadPriceFormatted}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className={`shop-card-add-btn ${addedAnim ? 'added' : ''}`}
            onClick={handleAddToCart}
            type="button"
            aria-label={addedAnim ? 'Added to cart' : 'Add to cart'}
            title={addedAnim ? 'Added to cart' : 'Add to cart'}
          >
            {addedAnim ? (
              <Check size={16} strokeWidth={2.8} />
            ) : (
              <ShoppingCart size={15} strokeWidth={2.4} />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
