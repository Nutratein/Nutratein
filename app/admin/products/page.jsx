'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  Upload,
  RefreshCw,
  ExternalLink,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  Eye,
  X,
  Sliders,
  Check
} from 'lucide-react';
import Link from 'next/link';

const BLANK = {
  id: null,
  name: '',
  slug: '',
  short_desc: '',
  description: '',
  price: '',
  compare_price: '',
  image_url: '',
  category_id: '',
  stock: 100,
  sku: '',
  featured: false,
  is_active: true,
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [variants, setVariants] = useState([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 2500);
  };

  async function loadAll() {
    setLoading(true);
    try {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);
      setProducts(prods ?? []);
      setCategories(cats ?? []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function startEdit(p) {
    setForm({ ...BLANK, ...p });
    setVariants([]);
    setDeletedVariantIds([]);
    setShowModal(true);
    setVariantsLoading(true);
    try {
      const { data } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', p.id)
        .order('sort_order');
      setVariants(data || []);
    } finally {
      setVariantsLoading(false);
    }
  }

  function startNew() {
    setForm(BLANK);
    setVariants([]);
    setDeletedVariantIds([]);
    setShowModal(true);
  }

  function addVariantRow() {
    setVariants((prev) => [
      ...prev,
      { _key: `new-${Date.now()}-${prev.length}`, label: '', price: '', compare_price: '', stock: 0, sku: '', is_default: prev.length === 0 },
    ]);
  }

  function updateVariantField(index, field, value) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function setDefaultVariant(index) {
    setVariants((prev) => prev.map((v, i) => ({ ...v, is_default: i === index })));
  }

  function removeVariantRow(index) {
    setVariants((prev) => {
      const target = prev[index];
      if (target?.id) {
        setDeletedVariantIds((ids) => [...ids, target.id]);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  async function toggleFeatured(product) {
    const nextVal = !product.featured;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, featured: nextVal } : p))
    );
    try {
      const { error: err } = await supabase
        .from('products')
        .update({ featured: nextVal })
        .eq('id', product.id);
      if (err) throw err;
      showToast(nextVal ? `"${product.name}" is now Featured on Homepage!` : `"${product.name}" unfeatured.`);
    } catch (err) {
      showToast('Failed to update featured status.');
      await loadAll();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      short_desc: form.short_desc?.trim() || null,
      description: form.description?.trim() || null,
      price: Number(form.price) || 0,
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      image_url: form.image_url?.trim() || null,
      category_id: form.category_id || null,
      stock: Number(form.stock) || 0,
      sku: form.sku?.trim() || null,
      featured: !!form.featured,
      is_active: !!form.is_active,
    };

    try {
      let productId = form.id;

      if (productId) {
        const { error: err } = await supabase.from('products').update(payload).eq('id', productId);
        if (err) throw err;
      } else {
        const { data: inserted, error: err } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        if (err) throw err;
        productId = inserted.id;
      }

      const validVariants = variants.filter((v) => v.label && v.label.trim());

      if (deletedVariantIds.length) {
        const { error: delErr } = await supabase.from('product_variants').delete().in('id', deletedVariantIds);
        if (delErr) throw delErr;
      }

      for (let i = 0; i < validVariants.length; i++) {
        const v = validVariants[i];
        const vPayload = {
          product_id: productId,
          label: v.label.trim(),
          price: Number(v.price) || 0,
          compare_price: v.compare_price ? Number(v.compare_price) : null,
          stock: Number(v.stock) || 0,
          sku: v.sku?.trim() || null,
          image_url: v.image_url?.trim() || null,
          sort_order: i,
          is_default: !!v.is_default,
        };
        const vQuery = v.id
          ? supabase.from('product_variants').update(vPayload).eq('id', v.id)
          : supabase.from('product_variants').insert(vPayload);
        const { error: vErr } = await vQuery;
        if (vErr) throw vErr;
      }

      showToast(form.id ? 'Product updated in Supabase!' : 'New product created in Supabase!');
      setShowModal(false);
      setForm(BLANK);
      setVariants([]);
      setDeletedVariantIds([]);
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to save product in Supabase.');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      setForm((f) => ({ ...f, image_url: data.url }));
      showToast('Image uploaded successfully!');
    } catch (err) {
      showToast(err.message || 'Upload error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}" from Supabase catalog?`)) return;
    try {
      const { error: err } = await supabase.from('products').delete().eq('id', id);
      if (err) throw err;
      showToast(`"${name}" deleted.`);
      loadAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete.');
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = categoryFilter === 'all' || p.category_id === categoryFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.slug && p.slug.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [products, categoryFilter, searchQuery]);

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
          <h1>Product Catalog</h1>
          <p className="admin-dash-subtitle">
            Create, update pricing, manage stock, and edit SKU specifications.
          </p>
        </div>

        <div className="admin-dash-actions">
          <button onClick={loadAll} className="account-btn-secondary" title="Refresh">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>

          <button onClick={startNew} className="account-btn-primary">
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Catalog Search & Controls */}
      <div className="admin-card-section" style={{ marginBottom: 24 }}>
        <div className="admin-card-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={18} style={{ color: 'var(--color-brand)' }} />
            <h3 style={{ margin: 0 }}>Inventory ({filteredProducts.length} Items)</h3>
          </div>

          <div className="admin-table-controls">
            <div className="admin-table-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by product name, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: '#171b23',
                outline: 'none',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="account-skeleton-box" style={{ height: 50, width: '100%' }} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ color: '#a8adb4', fontSize: 14 }}>No products found matching your filter.</p>
            <button onClick={startNew} className="account-btn-primary" style={{ marginTop: 10 }}>
              <Plus size={15} /> Add First Product
            </button>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Inventory</th>
                  <th>Category</th>
                  <th>Visibility</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.category_id);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt=""
                              style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 8,
                                background: '#232830',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8',
                              }}
                            >
                              <Package size={18} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span>{p.name}</span>
                              <button
                                type="button"
                                onClick={() => toggleFeatured(p)}
                                style={{
                                  border: 'none',
                                  background: p.featured ? 'rgba(220,38,38,0.15)' : '#232830',
                                  color: p.featured ? '#dc2626' : '#a8adb4',
                                  padding: '2px 8px',
                                  borderRadius: 9999,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  transition: 'all 0.15s ease',
                                }}
                                title="Click to toggle Featured on Homepage"
                              >
                                {p.featured ? '★ Featured' : '+ Feature'}
                              </button>
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                              /{p.slug} {p.sku ? `• SKU: ${p.sku}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--color-ink)' }}>
                          ${Number(p.price).toFixed(2)}
                        </strong>
                        {p.compare_price && (
                          <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through', marginLeft: 4 }}>
                            ${Number(p.compare_price).toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontWeight: 650, color: p.stock > 0 ? '#34d399' : '#dc2626' }}>
                          {p.stock} units
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: 13, color: '#a8adb4' }}>{cat?.name || '—'}</span>
                      </td>

                      <td>
                        <span className={`admin-table-status ${p.is_active ? 'delivered' : 'cancelled'}`}>
                          {p.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Link href={`/shop/${p.slug}`} target="_blank" className="admin-copy-icon-btn" title="View in store">
                            <ExternalLink size={15} />
                          </Link>
                          <button
                            className="account-btn-secondary"
                            style={{ padding: '5px 12px', fontSize: 12 }}
                            onClick={() => startEdit(p)}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            className="admin-copy-icon-btn"
                            style={{ color: '#dc2626', padding: 6 }}
                            onClick={() => handleDelete(p.id, p.name)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INTERACTIVE ADD / EDIT PRODUCT MODAL (WITH LIVE PREVIEW) */}
      <AnimatePresence>
        {showModal && (
          <div
            className="admin-modal-overlay"
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
              overflowY: 'auto',
            }}
          >
            <motion.div
              className="admin-modal-box"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                background: 'var(--color-surface)',
                borderRadius: 20,
                maxWidth: 900,
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                className="admin-modal-header"
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
                    {form.id ? `Edit Product: ${form.name}` : 'Create New Product'}
                  </h3>
                  <span style={{ fontSize: 12.5, color: '#a8adb4' }}>
                    Configure pricing, specifications, and instant Supabase catalog synchronization
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a8adb4' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body with Live Preview */}
              <form onSubmit={handleSubmit} className="admin-modal-body" style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
                {error && (
                  <div style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                  {/* Left Form Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                        Product Name *
                      </label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. BPC-157 – 5mg"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                          Slug (auto if blank)
                        </label>
                        <input
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: e.target.value })}
                          placeholder={slugify(form.name) || 'product-slug'}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13.5 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                          Category
                        </label>
                        <select
                          value={form.category_id ?? ''}
                          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13.5 }}
                        >
                          <option value="">— Uncategorized —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                          Price ($) *
                        </label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          placeholder="49.99"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                          Compare-At Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.compare_price ?? ''}
                          onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
                          placeholder="59.99"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                          Inventory Stock *
                        </label>
                        <input
                          type="number"
                          value={form.stock}
                          onChange={(e) => setForm({ ...form, stock: e.target.value })}
                          placeholder="100"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                          SKU / Batch Code
                        </label>
                        <input
                          value={form.sku ?? ''}
                          onChange={(e) => setForm({ ...form, sku: e.target.value })}
                          placeholder="NT-001"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
                        />
                      </div>
                    </div>

                    {/* Variants (Strengths / Sizes) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 700 }}>
                          Variants (Strengths / Sizes)
                        </label>
                        <button
                          type="button"
                          onClick={addVariantRow}
                          className="account-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          <Plus size={13} /> Add Variant
                        </button>
                      </div>
                      <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '0 0 10px' }}>
                        Optional. Add strengths/sizes each with its own price &amp; stock (e.g. 5mg, 10mg). Leave empty to sell at the single price above.
                      </p>

                      {variantsLoading ? (
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading variants...</div>
                      ) : variants.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                          No variants yet — product sells at the single price above.
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 480 }}>
                            {variants.map((v, i) => (
                              <div
                                key={v.id || v._key}
                                style={{
                                  display: 'flex',
                                  gap: 6,
                                  alignItems: 'center',
                                  background: '#171b23',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 8,
                                  padding: 8,
                                }}
                              >
                                <input
                                  placeholder="Label e.g. 5mg"
                                  value={v.label}
                                  onChange={(e) => updateVariantField(i, 'label', e.target.value)}
                                  style={{ flex: 1.4, minWidth: 100, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12.5 }}
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Price"
                                  value={v.price}
                                  onChange={(e) => updateVariantField(i, 'price', e.target.value)}
                                  style={{ width: 80, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12.5 }}
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Compare"
                                  value={v.compare_price ?? ''}
                                  onChange={(e) => updateVariantField(i, 'compare_price', e.target.value)}
                                  style={{ width: 80, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12.5 }}
                                />
                                <input
                                  type="number"
                                  placeholder="Stock"
                                  value={v.stock}
                                  onChange={(e) => updateVariantField(i, 'stock', e.target.value)}
                                  style={{ width: 64, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12.5 }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setDefaultVariant(i)}
                                  title="Set as default variant"
                                  style={{
                                    background: v.is_default ? 'rgba(0,102,255,0.15)' : 'transparent',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 6,
                                    padding: '6px 8px',
                                    fontSize: 11,
                                    color: v.is_default ? 'var(--color-brand)' : '#94a3b8',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {v.is_default ? '★ Default' : 'Set default'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(i)}
                                  style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4, flexShrink: 0 }}
                                  title="Remove variant"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image URL & Upload */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                        Product Image
                      </label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          style={{ fontSize: 12 }}
                        />
                        {uploading && <span style={{ fontSize: 12, color: 'var(--color-brand)' }}>Uploading...</span>}
                      </div>
                      <input
                        value={form.image_url ?? ''}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        placeholder="Or image URL (e.g. /images/bpc-157-300x300.webp)"
                        style={{ width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                        Short Summary Highlight
                      </label>
                      <input
                        value={form.short_desc ?? ''}
                        onChange={(e) => setForm({ ...form, short_desc: e.target.value })}
                        placeholder="One sentence summary for catalog cards"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13.5 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                        Full Scientific Description
                      </label>
                      <textarea
                        rows={3}
                        value={form.description ?? ''}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Detailed compound description..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13.5, fontFamily: 'inherit' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 20 }}>
                      <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form.featured}
                          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        />
                        <span style={{ fontWeight: 650 }}>Featured on Homepage</span>
                      </label>

                      <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        />
                        <span style={{ fontWeight: 650 }}>Active in Shop</span>
                      </label>
                    </div>
                  </div>

                  {/* Right Live Preview Column */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 750, color: '#a8adb4', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>
                      Live Storefront Card Preview
                    </div>

                    <div
                      style={{
                        background: '#171b23',
                        border: '1px solid var(--color-border)',
                        borderRadius: 16,
                        padding: 16,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      }}
                    >
                      <div style={{ height: 180, background: '#12151b', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {form.image_url ? (
                          <img src={form.image_url} alt="" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Package size={40} style={{ color: '#454a56' }} />
                        )}
                      </div>

                      <div style={{ marginTop: 14 }}>
                        {form.featured && (
                          <span style={{ fontSize: 10, fontWeight: 750, background: 'rgba(0,102,255,0.15)', color: 'var(--color-brand)', padding: '2px 8px', borderRadius: 100 }}>
                            FEATURED
                          </span>
                        )}
                        <h4 style={{ margin: '6px 0 4px', fontSize: 15, fontWeight: 750 }}>
                          {form.name || 'Your Product Name'}
                        </h4>
                        <p style={{ fontSize: 12.5, color: '#a8adb4', margin: '0 0 12px', lineHeight: 1.4 }}>
                          {form.short_desc || 'Short compound summary will appear here on customer cards.'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-ink)' }}>
                            {variants.filter((v) => v.label?.trim()).length > 1 && (
                              <span style={{ fontSize: 11, fontWeight: 650, color: '#94a3b8', textTransform: 'uppercase', marginRight: 4 }}>
                                From
                              </span>
                            )}
                            $
                            {(() => {
                              const validPrices = variants.filter((v) => v.label?.trim()).map((v) => Number(v.price) || 0);
                              return validPrices.length > 0 ? Math.min(...validPrices).toFixed(2) : Number(form.price || 0).toFixed(2);
                            })()}
                          </span>
                          <span style={{ fontSize: 11.5, color: form.stock > 0 ? '#34d399' : '#dc2626', fontWeight: 650 }}>
                            {form.stock > 0 ? `${form.stock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="account-btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="account-btn-primary" disabled={saving}>
                    <Check size={16} />
                    <span>{saving ? 'Saving to Supabase...' : form.id ? 'Save Changes' : 'Create Product'}</span>
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
