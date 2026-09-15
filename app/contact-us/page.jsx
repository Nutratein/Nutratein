'use client';

import { useState, useEffect } from 'react';
import { getSiteContent } from '@/lib/siteContent';
import PageHeader from '@/components/PageHeader.jsx';
import { 
  Mail, 
  User, 
  Send, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  FlaskConical,
  MessageSquare,
  MapPin,
  Navigation,
  ExternalLink
} from 'lucide-react';

const DEFAULT_CONTACT_INFO = {
  email: 'info@thepepshop.com',
  hours_line1: 'Monday – Friday, 9am – 5pm',
  hours_line2: 'EST timezone. Typical reply time is within 2–4 hours.',
  facility_name: 'The Pep Shop Bio-Molecular Headquarters',
  address_line: 'Technology Square Bio-Hub, Cambridge, MA 02139 • United States',
  directions_url: 'https://maps.google.com/?q=Technology+Square,+Cambridge,+MA+02139',
  map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2948.176313364421!2d-71.0924976234399!3d42.36219197119294!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e370a599ec51a1%3A0x6b1069b2d35ba49b!2sTechnology%20Square%2C%20Cambridge%2C%20MA%2002139!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus',
  receiving_hours: 'Receiving Dock: Mon–Fri, 8am–4pm EST',
  logistics_note: 'Cold-Chain Express Logistics Dispatch Hub',
};

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [copied, setCopied] = useState(false);
  const [contactInfo, setContactInfo] = useState(DEFAULT_CONTACT_INFO);

  useEffect(() => {
    getSiteContent('home', {}).then((value) => {
      if (value?.contact) {
        setContactInfo({ ...DEFAULT_CONTACT_INFO, ...value.contact });
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message.');
      setSent(true);
      setForm({ name: '', email: '', subject: 'General Inquiry', message: '' });
    } catch (err) {
      setSendError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactInfo.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="contact-page-wrapper">
      {/* 1. UNIFIED PAGE HERO */}
      <PageHeader
        badge="GET IN TOUCH"
        badgeIcon={Mail}
        title="Connect With Our"
        titleHighlight="Research Specialists"
        subtitle="Inquiries regarding compound purity, bulk orders, or custom synthesis quotes are handled promptly by our laboratory team."
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Contact Us' }
        ]}
      />

      {/* 2. MAIN CONTENT CONTAINER */}
      <div className="contact-container">
        <div className="contact-grid">
          {/* Left: Contact Form Card */}
          <div className="contact-form-card">
            <div className="contact-form-header">
              <h2>Send an Inquiry</h2>
              <p>Fill in your project details and our team will get back to you shortly.</p>
            </div>

            {sent && (
              <div className="contact-success-banner">
                <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4>Message Sent Successfully</h4>
                  <p>Thanks for reaching out! Our research and logistics team will review your message and reply shortly.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="contact-input-group">
                <label className="contact-label">Full Name</label>
                <div className="contact-input-wrap">
                  <span className="contact-input-icon">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="contact-input"
                    placeholder="Dr. Jane Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="contact-input-group">
                <label className="contact-label">Email Address</label>
                <div className="contact-input-wrap">
                  <span className="contact-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="contact-input"
                    placeholder="researcher@institution.edu"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="contact-input-group">
                <label className="contact-label">Inquiry Subject</label>
                <div className="contact-input-wrap">
                  <span className="contact-input-icon">
                    <FlaskConical size={16} />
                  </span>
                  <select
                    className="contact-select"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    <option value="General Inquiry">General Research Inquiry</option>
                    <option value="Custom Synthesis Quote">Custom Peptide Synthesis Quote</option>
                    <option value="Bulk Supply Order">Bulk Supply &amp; Volume Pricing</option>
                    <option value="COA & Purity Request">Certificate of Analysis / Quality Control</option>
                    <option value="Shipping & Logistics">Shipping &amp; Logistics Question</option>
                  </select>
                </div>
              </div>

              <div className="contact-input-group">
                <label className="contact-label">Message Details</label>
                <textarea
                  className="contact-textarea"
                  rows={5}
                  placeholder="Please describe your requirements, peptide sequence, or questions..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>

              {sendError && (
                <p style={{ color: '#ff5c72', fontSize: 13.5, marginTop: -6, marginBottom: 14 }}>
                  {sendError}
                </p>
              )}

              <button type="submit" className="contact-submit-btn" disabled={sending}>
                <span>{sending ? 'Sending...' : 'Send Message'}</span>
                <Send size={15} />
              </button>
            </form>
          </div>

          {/* Right: Direct Information & Synthesis Guidelines */}
          <div className="contact-info-col">
            <div className="contact-info-card">
              <div className="contact-info-item">
                <div className="contact-info-icon-box">
                  <Mail size={18} />
                </div>
                <div className="contact-info-content">
                  <div className="contact-info-label">Direct Email</div>
                  <div className="contact-info-val">{contactInfo.email}</div>
                  <p className="contact-info-sub">Monitored directly by our scientific support team.</p>
                  <button 
                    type="button" 
                    className="contact-copy-btn"
                    onClick={handleCopyEmail}
                  >
                    {copied ? (
                      <>
                        <Check size={12} style={{ color: '#16a34a' }} />
                        <span style={{ color: '#16a34a' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon-box">
                  <Clock size={18} />
                </div>
                <div className="contact-info-content">
                  <div className="contact-info-label">Operating Hours</div>
                  <div className="contact-info-val">{contactInfo.hours_line1}</div>
                  <p className="contact-info-sub">{contactInfo.hours_line2}</p>
                </div>
              </div>
            </div>

            {/* Custom Synthesis & Bulk Supply Callout */}
            <div className="contact-quote-card">
              <span className="contact-quote-badge">
                <Sparkles size={12} />
                <span>Custom Synthesis &amp; Bulk</span>
              </span>
              <h3>Quote Request Guidelines</h3>
              <p>
                For quote requests on bulk supply or custom peptide synthesis, please make sure your message includes:
              </p>
              <ul className="contact-quote-list">
                <li>
                  <span className="contact-quote-dot"></span>
                  <span>Target peptide name or amino acid sequence</span>
                </li>
                <li>
                  <span className="contact-quote-dot"></span>
                  <span>Required quantity (mg, grams, or bulk kilograms)</span>
                </li>
                <li>
                  <span className="contact-quote-dot"></span>
                  <span>Purity grade specification (&ge;95% or &ge;98%)</span>
                </li>
                <li>
                  <span className="contact-quote-dot"></span>
                  <span>Target delivery timeline &amp; shipping destination</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 3. INTERACTIVE FACILITY LOCATION MAP */}
        <div className="contact-map-section">
          <div className="contact-map-card">
            <div className="contact-map-header">
              <div className="contact-map-header-left">
                <div className="contact-map-icon-box">
                  <MapPin size={22} />
                </div>
                <div>
                  <div className="contact-map-badge">
                    <span className="contact-map-badge-dot"></span>
                    <span>Synthesis &amp; Research Facility</span>
                  </div>
                  <h3 className="contact-map-title">{contactInfo.facility_name}</h3>
                  <p className="contact-map-address">
                    {contactInfo.address_line}
                  </p>
                </div>
              </div>

              <div className="contact-map-actions">
                <a
                  href={contactInfo.directions_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-map-directions-btn"
                >
                  <Navigation size={14} />
                  <span>Get Directions</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="contact-map-frame-wrap">
              <iframe
                title="The Pep Shop Research Facility Location"
                src={contactInfo.map_embed_url}
                className="contact-map-iframe"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <div className="contact-map-footer">
              <div className="contact-map-pill">
                <Clock size={13} />
                <span>{contactInfo.receiving_hours}</span>
              </div>
              <div className="contact-map-pill">
                <FlaskConical size={13} />
                <span>{contactInfo.logistics_note}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
