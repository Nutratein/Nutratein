'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset link.');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-bg-ambient auth-bg-ambient-1" />
      <div className="auth-bg-ambient auth-bg-ambient-2" />

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="auth-card">
          <div className="auth-badge-pill">
            <ShieldCheck size={14} />
            <span>Account Recovery</span>
          </div>

          <div className="auth-header-text">
            <h2>Forgot Password?</h2>
            <p>
              {sent
                ? "Check your inbox for the reset link"
                : "Enter your email and we'll send you a link to reset your password"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="auth-alert auth-alert-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle size={17} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            {sent && (
              <motion.div
                className="auth-alert auth-alert-success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CheckCircle2 size={17} className="shrink-0" />
                <span>If an account exists for {email}, a reset link is on its way.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!sent && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="forgot-email">Email Address</label>
                <div className="auth-input-box">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center helper-text" style={{ marginTop: 18, marginBottom: 0 }}>
            <Link href="/login" className="auth-inline-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
