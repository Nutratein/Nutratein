import { supabase } from './supabaseClient';

/** Validate a promo code and return its discount, or null if invalid/expired/inactive. */
export async function validatePromoCode(code) {
  if (!code || !code.trim()) return null;
  const { data, error } = await supabase.rpc('validate_promo_code', { p_code: code.trim() });
  if (error || !data || data.length === 0) return null;
  return { code: code.trim().toUpperCase(), discountPercent: Number(data[0].discount_percent) / 100, label: data[0].label };
}

/** Marks a promo code as used (increments its usage counter) — call after an order succeeds. */
export async function recordPromoCodeUse(code) {
  if (!code) return;
  await supabase.rpc('record_promo_code_use', { p_code: code });
}

/** Admin only — list all promo codes. */
export async function getAllPromoCodes() {
  const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
  return data || [];
}

/** Admin only — create a promo code. */
export async function createPromoCode(payload) {
  return supabase.from('promo_codes').insert(payload);
}

/** Admin only — update a promo code. */
export async function updatePromoCode(id, payload) {
  return supabase.from('promo_codes').update(payload).eq('id', id);
}

/** Admin only — delete a promo code. */
export async function deletePromoCode(id) {
  return supabase.from('promo_codes').delete().eq('id', id);
}
