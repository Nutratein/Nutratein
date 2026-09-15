import { supabase } from './supabaseClient';

export const DEFAULT_SHIPPING_SETTINGS = {
  free_shipping_threshold: 100,
  standard_fee: 9.99,
  cold_chain_fee: 14.99,
  cold_chain_fee_discounted: 6.99,
};

/** Shared shipping fee config, editable from Admin → Homepage → Shipping & Fees. */
export async function getShippingSettings() {
  const { data } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'shipping_settings')
    .maybeSingle();
  return { ...DEFAULT_SHIPPING_SETTINGS, ...(data?.value || {}) };
}

/** Admin only — save updated shipping settings. */
export async function saveShippingSettings(value) {
  return supabase
    .from('site_content')
    .upsert({ key: 'shipping_settings', value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}
