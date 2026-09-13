'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  return (
    <Suspense fallback={
      <div className="auth-loading-fallback">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      router.push(searchParams.get('from') || '/account');
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Decorative Background Elements */}
      <div className="auth-bg-ambient auth-bg-ambient-1" />
      <div className="auth-bg-ambient auth-bg-ambient-2" />

      <motion.div 
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* Card Header & Switcher */}
        <div className="auth-card">
          <div className="auth-badge-pill">
            <ShieldCheck size={14} />
            <span>Secure Member Access</span>
          </div>

          <div className="auth-tab-switch">
            <button type="button" className="auth-tab-btn active">
              Log In
            </button>
            <Link href="/signup" className="auth-tab-btn">
              Create Account
            </Link>
          </div>

          <div className="auth-header-text ">
            <h2>Welcome Back</h2>
            <p>Access your Nutratein orders, tracking &amp; lab results</p>
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
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className="auth-field">
              <label htmlFor="login-email">Email Address</label>
              <div className="auth-input-box">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-field">
              <div className="auth-field-row">
                <label htmlFor="login-password">Password</label>
                <Link href="/forgot-password" className="auth-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <div className="auth-input-box">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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

            {/* Remember Me */}
            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Log In to Nutratein</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>


          <p className="text-center helper-text" style={{ marginTop: 18, marginBottom: 0 }}>
            Don't have an account? <Link href="/signup" className="auth-inline-link">Sign up</Link>
          </p>

          {/* Trust badges */}
          <div className="auth-trust-strip">
            <span>⚡ Instant Verification</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
