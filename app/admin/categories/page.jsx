'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tags,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Edit2,
  ExternalLink,
  Layers,
  Sparkles,
  X,
  Check
} from 'lucide-react';
import Link from 'next/link';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [editingCat, setEditingCat] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 2500);
  };

  async function load() {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (err) throw err;
      setCategories(data ?? []);
    } catch (err) {
      console.error('Error loading categories', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleStartNew() {
    setEditingCat(null);
    setName('');
    setDescription('');
    setShowDrawer(true);
  }

  function handleStartEdit(cat) {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setShowDrawer(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSaving(true);

    try {
      const slug = slugify(name);
      const payload = {
        name: name.trim(),
        slug,
        description: description.trim() || null,
      };

      const query = editingCat
        ? supabase.from('categories').update(payload).eq('id', editingCat.id)
        : supabase.from('categories').insert(payload);

      const { error: err } = await query;
      if (err) throw err;

      showToast(editingCat ? `Category updated!` : `Category "${name}" created in Supabase!`);
      setShowDrawer(false);
      setName('');
      setDescription('');
      setEditingCat(null);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, catName) {
    if (!window.confirm(`Delete category "${catName}"? Linked products will become uncategorized.`)) return;
    try {
      const { error: err } = await supabase.from('categories').delete().eq('id', id);
      if (err) throw err;
      showToast(`Category "${catName}" deleted.`);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete category.');
    }
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  return (
    <div>
      {/* Toast Alert */}
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

      {/* Header */}
      <div className="admin-dash-header">
        <div className="admin-dash-title-group">
          <h1>Product Categories</h1>
          <p className="admin-dash-subtitle">
            Organize peptides and supplements. Categories power shop navigation and filter chips.
          </p>
        </div>

        <div className="admin-dash-actions">
          <button onClick={load} className="account-btn-secondary" title="Refresh">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>

          <button onClick={handleStartNew} className="account-btn-primary">
            <Plus size={16} />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Stat Bar */}
      <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon blue">
              <Tags size={20} />
            </div>
            <span className="admin-stat-pill neutral">Active</span>
          </div>
          <div>
            <span className="stat-title">Total Categories</span>
            <div>
              <strong>{categories.length}</strong>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <div className="admin-stat-card-icon emerald">
              <Sparkles size={20} />
            </div>
            <span className="admin-stat-pill success">Live Sync</span>
          </div>
          <div>
            <span className="stat-title">Storefront Status</span>
            <div>
              <strong style={{ fontSize: 18 }}>Filter Ready</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Categories List Section */}
      <div className="admin-card-section">
        <div className="admin-card-section-header">
          <div>
            <h3>All Classifications ({filtered.length})</h3>
            <span style={{ fontSize: 12.5, color: '#a8adb4' }}>
              Categories linked to store catalog
            </span>
          </div>

          <div className="admin-table-controls">
            <div className="admin-table-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search category name, slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="account-skeleton-box" style={{ height: 50, width: '100%' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <FolderOpen size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', color: 'var(--color-ink)' }}>No Categories Found</h4>
            <p style={{ fontSize: 13, color: '#a8adb4', margin: '0 0 16px' }}>
              Create a category to group your research compounds.
            </p>
            <button onClick={handleStartNew} className="account-btn-primary">
              <Plus size={15} /> Add First Category
            </button>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>URL Filter Slug</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'rgba(200, 16, 46, 0.08)',
                            color: 'var(--color-brand)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Tags size={16} />
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>

                    <td>
                      <code style={{ fontSize: 12.5, color: '#a8adb4', background: '#171b23', padding: '3px 8px', borderRadius: 6 }}>
                        /{c.slug}
                      </code>
                    </td>

                    <td style={{ color: '#a8adb4', fontSize: 13, maxWidth: 300, whiteSpace: 'normal' }}>
                      {c.description || <span style={{ color: '#94a3b8' }}>— No description —</span>}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Link href={`/shop?category=${c.slug}`} target="_blank" className="admin-copy-icon-btn" title="View in shop">
                          <ExternalLink size={15} />
                        </Link>
                        <button
                          className="account-btn-secondary"
                          style={{ padding: '5px 12px', fontSize: 12 }}
                          onClick={() => handleStartEdit(c)}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="admin-copy-icon-btn"
                          style={{ color: '#dc2626', padding: 6 }}
                          onClick={() => handleDelete(c.id, c.name)}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INTERACTIVE MODAL / DRAWER FOR ADD / EDIT CATEGORY */}
      <AnimatePresence>
        {showDrawer && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                background: 'var(--color-surface)',
                borderRadius: 20,
                maxWidth: 540,
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#171b23',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                    {editingCat ? `Edit: ${editingCat.name}` : 'Create New Category'}
                  </h3>
                  <span style={{ fontSize: 12.5, color: '#a8adb4' }}>
                    Saves directly to Supabase categories table
                  </span>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a8adb4' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ padding: '24px' }}>
                {error && (
                  <div style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                    Category Name *
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Muscle Recovery &amp; Growth"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                    URL Filter Slug (Auto-generated)
                  </label>
                  <div
                    style={{
                      background: '#171b23',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      color: 'var(--color-brand)',
                    }}
                  >
                    /shop?category={name ? slugify(name) : 'category-slug'}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                    Category Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what peptides or products belong in this category..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13.5, fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="account-btn-secondary" onClick={() => setShowDrawer(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="account-btn-primary" disabled={saving}>
                    <Check size={16} />
                    <span>{saving ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
