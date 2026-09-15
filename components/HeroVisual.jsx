'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function HeroVisual() {
  const stageRef = useRef(null);

  // Mouse tilt tracking
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const springX = useSpring(px, { stiffness: 90, damping: 18, mass: 0.5 });
  const springY = useSpring(py, { stiffness: 90, damping: 18, mass: 0.5 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);

  function handleMouseMove(e) {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    px.set(x);
    py.set(y);
  }

  function handleMouseLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div
      className="hero-visual-wrapper"
      ref={stageRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient Red Rim Glow */}
      <div className="hv-ambient-glow" />

      {/* 3D Tilting Stage */}
      <motion.div
        className="hv-stage"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Main Product Showcase Photo */}
        <div className="hv-image-frame">
          <img
            src="/images/hero-drago-product.jpg"
            alt="The Pep Shop Research Peptides - High Purity Synthesis"
            className="hv-product-img"
            loading="eager"
          />
          {/* Subtle edge blend overlay */}
          <div className="hv-image-gradient-overlay" />
        </div>

        {/* Floating Badge 1: Top Left (>99% Purity Verified) */}
        <motion.div
          className="hv-floating-badge hv-badge-purity"
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -10, 0],
            x: [0, 4, 0],
          }}
          transition={{
            opacity: { duration: 0.6, delay: 0.2 },
            scale: { duration: 0.6, delay: 0.2 },
            y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
            x: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="hv-icon-circle-red">
            {/* Laboratory Flask Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
              <line x1="8" y1="16" x2="16" y2="16" strokeWidth="2" />
            </svg>
          </div>
          <div className="hv-badge-info">
            <span className="hv-badge-val">&gt;99%</span>
            <span className="hv-badge-lbl">Purity Verified</span>
          </div>
        </motion.div>

        {/* Floating Badge 2: Mid Right (24h Ships Worldwide) */}
        <motion.div
          className="hv-floating-badge hv-badge-shipping"
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, 10, 0],
            x: [0, -5, 0],
          }}
          transition={{
            opacity: { duration: 0.6, delay: 0.35 },
            scale: { duration: 0.6, delay: 0.35 },
            y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
            x: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
          }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="hv-icon-square-red">
            {/* 3D Package/Cube Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="hv-badge-info">
            <span className="hv-badge-val">24h</span>
            <span className="hv-badge-lbl">Ships Worldwide</span>
          </div>
        </motion.div>

        {/* Floating Badge 3: Bottom Right (Custom Synthesis Available) */}
        <motion.div
          className="hv-floating-badge hv-badge-custom"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -8, 0],
            x: [0, -4, 0],
          }}
          transition={{
            opacity: { duration: 0.6, delay: 0.5 },
            scale: { duration: 0.6, delay: 0.5 },
            y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
            x: { duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="hv-icon-square-red">
            {/* Bar Chart / Analytics Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div className="hv-badge-info">
            <span className="hv-badge-val">Custom</span>
            <span className="hv-badge-lbl">Synthesis Available</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
