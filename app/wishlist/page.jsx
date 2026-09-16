'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { getCadRate } from '@/lib/wallet';
import ProductCard from '@/components/ProductCard.jsx';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  ChevronRight,
  Check
} from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const [addingAll, setAddingAll] = useState(false);
  const [cadRate, setCadRate] = useState(1.35);

  useEffect(() => {
    getCadRate().then(setCadRate);
  }, []);

  const handleAddAllToCart = () => {
    setAddingAll(true);
    wishlist.forEach((item) => {
      addItem(item);
    });
    setTimeout(() => {
      setAddingAll(false);
    }, 1200);
  };

  return (
    <div className="wishlist-page-wrapper">
      <div className="container" style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 16px 80px' }}>
        
        {/* Breadcrumb */}
        <div className="modern-breadcrumb" style={{ marginBottom: 18 }}>
          <Link href="/">Home</Link>
          <ChevronRight size={13} />
          <Link href="/shop">Shop</Link>
          <ChevronRight size={13} />
          <span className="current">My Wishlist</span>
        </div>

        {/* Page Header */}
        <div className="wishlist-header-row">
          <div>
            <div className="wishlist-eyebrow">
              <Heart size={14} color="#0066ff" fill="#0066ff" />
              <span>SAVED FORMULAS</span>
            </div>
            <h1 className="wishlist-title">
              My Research Wishlist
              <span className="wishlist-count-badge">{wishlist.length}</span>
            </h1>
            <p className="wishlist-subtitle">
              Compounds and formulas you've marked for future study or batch orders.
            </p>
          </div>

          {wishlist.length > 0 && (
            <div className="wishlist-header-actions">
              <button 
                type="button" 
                onClick={clearWishlist}
                className="wishlist-clear-btn"
                title="Remove all saved products"
              >
                <Trash2 size={15} />
                <span>Clear All</span>
              </button>
              <button 
                type="button" 
                onClick={handleAddAllToCart}
                className="wishlist-add-all-btn"
                disabled={addingAll}
              >
                {addingAll ? <Check size={16} /> : <ShoppingCart size={16} />}
                <span>{addingAll ? 'Added All to Cart!' : 'Add All to Cart'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="wishlist-empty-card">
            <div className="wishlist-empty-icon-wrap">
              <Heart size={38} strokeWidth={1.8} color="#0066ff" />
            </div>
            <h2 className="wishlist-empty-title">Your Wishlist is Empty</h2>
            <p className="wishlist-empty-desc">
              You haven't added any research peptides or investigational formulas yet. Tap the heart icon on any compound in our catalog to save it here.
            </p>
            <Link href="/shop" className="wishlist-browse-btn">
              <span>Explore Research Catalog</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Wishlist Grid with Exact Shop Page Product Card Design */
          <div className="shop-products-grid wishlist-products-grid">
            <AnimatePresence>
              {wishlist.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <ProductCard product={item} cadRate={cadRate} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
