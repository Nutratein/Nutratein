'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="auth-loading-fallback">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError('This reset link is invalid. Please request a new one.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
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
            <h2>Set a New Password</h2>
            <p>{done ? 'Your password has been updated' : `Resetting password for ${email || 'your account'}`}</p>
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
            {done && (
              <motion.div
                className="auth-alert auth-alert-success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CheckCircle2 size={17} className="shrink-0" />
                <span>Password updated! Redirecting you to log in...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!done && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="reset-password">New Password</label>
                <div className="auth-input-box">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reset-confirm-password">Confirm New Password</label>
                <div className="auth-input-box">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="reset-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center helper-text" style={{ marginTop: 18, marginBottom: 0 }}>
            <Link href="/login" className="auth-inline-link">Back to Log In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
