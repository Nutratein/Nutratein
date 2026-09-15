'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSiteContent, saveSiteContent } from '@/lib/siteContent';
import { MapPin, Save, CheckCircle2 } from 'lucide-react';

const DEFAULT_CONTACT = {
  email: 'info@thepepshop.com',
  hours_line1: 'Monday – Friday, 9am – 5pm',
  hours_line2: 'EST timezone. Typical reply time is within 2–4 hours.',
  facility_name: 'The Pep Shop Bio-Molecular Headquarters',
  address_line: 'Technology Square Bio-Hub, Cambridge, MA 02139 • United States',
  directions_url: 'https://maps.google.com/?q=Technology+Square,+Cambridge,+MA+02139',
  map_embed_url: '',
  receiving_hours: 'Receiving Dock: Mon–Fri, 8am–4pm EST',
  logistics_note: 'Cold-Chain Express Logistics Dispatch Hub',
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_linkedin: '',
  social_youtube: '',
};

export default function AdminContactInfo() {
  // Holds the FULL 'home' site_content blob so saving here never wipes out
  // hero/features/testimonials/membership content that lives under the same key.
  const [fullContent, setFullContent] = useState(null);
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 2500);
  };

  useEffect(() => {
    getSiteContent('home', {}).then((value) => {
      setFullContent(value || {});
      setContact({ ...DEFAULT_CONTACT, ...(value?.contact || {}) });
      setLoading(false);
    });
  }, []);

  function updateContact(field, val) {
    setContact((c) => ({ ...c, [field]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await saveSiteContent('home', { ...fullContent, contact });
      if (error) throw error;
      showToast('Contact info updated live!');
    } catch (err) {
      showToast('Failed to save contact info.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2].map((i) => (
          <div key={i} className="account-skeleton-box" style={{ height: 50, width: '100%' }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="account-toast"
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="admin-dash-header">
        <div className="admin-dash-title-group">
          <h1>Contact Info</h1>
          <p className="admin-dash-subtitle">
            Powers the email, hours, facility map, and social links shown on the Contact Us page and Footer.
          </p>
        </div>
      </div>

      <div className="admin-card-section" style={{ padding: '24px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <MapPin size={18} style={{ color: 'var(--color-brand)' }} />
          <h3 style={{ margin: 0 }}>Contact Page Details</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Support Email
            </label>
            <input
              value={contact.email || ''}
              onChange={(e) => updateContact('email', e.target.value)}
              placeholder="info@thepepshop.com"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Operating Hours (line 1)
            </label>
            <input
              value={contact.hours_line1 || ''}
              onChange={(e) => updateContact('hours_line1', e.target.value)}
              placeholder="Monday – Friday, 9am – 5pm"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Operating Hours (line 2)
            </label>
            <input
              value={contact.hours_line2 || ''}
              onChange={(e) => updateContact('hours_line2', e.target.value)}
              placeholder="EST timezone. Typical reply time is within 2–4 hours."
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Facility Name
            </label>
            <input
              value={contact.facility_name || ''}
              onChange={(e) => updateContact('facility_name', e.target.value)}
              placeholder="The Pep Shop Bio-Molecular Headquarters"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Address Line
            </label>
            <input
              value={contact.address_line || ''}
              onChange={(e) => updateContact('address_line', e.target.value)}
              placeholder="123 Example St, City, ST 00000 • Country"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              &quot;Get Directions&quot; Link
            </label>
            <input
              value={contact.directions_url || ''}
              onChange={(e) => updateContact('directions_url', e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Receiving Dock Note
            </label>
            <input
              value={contact.receiving_hours || ''}
              onChange={(e) => updateContact('receiving_hours', e.target.value)}
              placeholder="Receiving Dock: Mon–Fri, 8am–4pm EST"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
              Logistics Note
            </label>
            <input
              value={contact.logistics_note || ''}
              onChange={(e) => updateContact('logistics_note', e.target.value)}
              placeholder="Cold-Chain Express Logistics Dispatch Hub"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-ink-soft)' }}>
            Google Maps Embed URL
          </label>
          <textarea
            rows={3}
            value={contact.map_embed_url || ''}
            onChange={(e) => updateContact('map_embed_url', e.target.value)}
            placeholder="Paste the src= URL from Google Maps > Share > Embed a map"
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid var(--color-border)', borderRadius: 8, fontFamily: 'monospace', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 0' }}>
            In Google Maps, search your address → Share → Embed a map → copy only the URL inside <code>src=&quot;...&quot;</code>.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 750 }}>Social Media Links</h4>
          <p style={{ fontSize: 12, color: '#a8adb4', margin: '0 0 12px' }}>
            Shown as icons in the footer. Leave any field blank to hide that icon.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#a8adb4', marginBottom: 4 }}>Facebook URL</label>
              <input
                value={contact.social_facebook || ''}
                onChange={(e) => updateContact('social_facebook', e.target.value)}
                placeholder="https://facebook.com/yourpage"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#a8adb4', marginBottom: 4 }}>Instagram URL</label>
              <input
                value={contact.social_instagram || ''}
                onChange={(e) => updateContact('social_instagram', e.target.value)}
                placeholder="https://instagram.com/yourpage"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#a8adb4', marginBottom: 4 }}>Twitter / X URL</label>
              <input
                value={contact.social_twitter || ''}
                onChange={(e) => updateContact('social_twitter', e.target.value)}
                placeholder="https://x.com/yourpage"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#a8adb4', marginBottom: 4 }}>LinkedIn URL</label>
              <input
                value={contact.social_linkedin || ''}
                onChange={(e) => updateContact('social_linkedin', e.target.value)}
                placeholder="https://linkedin.com/company/yourpage"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#a8adb4', marginBottom: 4 }}>YouTube URL</label>
              <input
                value={contact.social_youtube || ''}
                onChange={(e) => updateContact('social_youtube', e.target.value)}
                placeholder="https://youtube.com/@yourpage"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        <button className="account-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Contact Info'}</span>
        </button>
      </div>
    </div>
  );
}
