import { supabase } from './supabaseClient';

/** Fetch (or lazily default) the current user's wallet balances. */
export async function getWallet(userId) {
  if (!userId) return { usd_balance: 0, cad_balance: 0 };
  const { data } = await supabase
    .from('wallets')
    .select('usd_balance, cad_balance')
    .eq('user_id', userId)
    .maybeSingle();
  return data || { usd_balance: 0, cad_balance: 0 };
}

/** Fetch the user's wallet transaction ledger, newest first. */
export async function getWalletTransactions(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

/** Fetch the user's top-up request history, newest first. */
export async function getWalletTopups(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from('wallet_topups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

/** Submit a new top-up request (wire transfer or, for CAD, Interac e-Transfer). Starts as 'pending'. */
export async function createTopupRequest(userId, currency, amount, referenceNote, proofUrl, method = 'wire') {
  return supabase.from('wallet_topups').insert({
    user_id: userId,
    currency,
    amount: Number(amount),
    reference_note: referenceNote?.trim() || null,
    proof_url: proofUrl || null,
    method,
  });
}

/** Read the shared wallet settings (bank details + CAD/USD rate). */
export async function getWalletSettings() {
  const fallback = {
    cad_to_usd_rate: 1.35,
    usd_bank: { bank_name: '', account_name: '', account_number: '', routing_number: '', swift: '' },
    cad_bank: { bank_name: '', account_name: '', account_number: '', transit_number: '', institution_number: '', swift: '' },
    usd_etransfer: { email: '', recipient_name: '', security_question: '', security_answer: '' },
    cad_etransfer: { email: '', recipient_name: '', security_question: '', security_answer: '' },
    instructions: '',
    min_topup_usd: 10,
    max_topup_usd: 10000,
    min_topup_cad: 10,
    max_topup_cad: 10000,
  };
  const { data } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'wallet_settings')
    .maybeSingle();
  return { ...fallback, ...(data?.value || {}) };
}

/** Admin only — save updated wallet settings. */
export async function saveWalletSettings(value) {
  return supabase
    .from('site_content')
    .upsert({ key: 'wallet_settings', value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}

/** Admin only — fetch all top-up requests, newest first, optionally filtered by status. */
export async function getAllTopups(status) {
  let query = supabase.from('wallet_topups').select('*').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  const { data } = await query;
  return data || [];
}

/** Admin only — approve or reject a pending top-up request. */
export async function reviewTopup(topupId, approve, adminNote) {
  return supabase.rpc('review_wallet_topup', {
    p_topup_id: topupId,
    p_approve: approve,
    p_admin_note: adminNote?.trim() || null,
  });
}

/** Pay for an already-created order using the caller's own wallet balance. */
export async function payOrderWithWallet(orderId, currency) {
  return supabase.rpc('pay_order_with_wallet', {
    p_order_id: orderId,
    p_currency: currency,
  });
}

/** Quick fetch of just the CAD/USD display rate (falls back to 1.35 on any error). */
export async function getCadRate() {
  try {
    const { data } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'wallet_settings')
      .maybeSingle();
    const rate = Number(data?.value?.cad_to_usd_rate);
    return rate > 0 ? rate : 1.35;
  } catch {
    return 1.35;
  }
}

/** Purchase (or renew/extend) the Apex Vault membership using the caller's own wallet balance. */
export async function purchaseMembershipWithWallet(currency, priceUsd) {
  return supabase.rpc('purchase_membership_with_wallet', {
    p_currency: currency,
    p_price_usd: priceUsd,
  });
}
