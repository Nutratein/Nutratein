// Throwaway end-to-end test of membership-purchase-via-wallet.
const fs = require('fs');

const env = {};
fs.readFileSync('.env', 'utf8').split(/\r?\n/).forEach((line) => {
  const m = line.match(/^([A-Za-z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
});

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

let passed = 0;
let failed = 0;
function check(label, cond, extra) {
  if (cond) { console.log(`  PASS: ${label}`); passed++; }
  else { console.log(`  FAIL: ${label}` + (extra ? ` -- ${JSON.stringify(extra)}` : '')); failed++; }
}

async function svc(path, opts = {}) {
  const res = await fetch(URL + path, { ...opts, headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}
async function asUser(token, path, opts = {}) {
  const res = await fetch(URL + path, { ...opts, headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: opts.prefer || 'return=representation', ...(opts.headers || {}) } });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}
async function createUser(email, password) {
  const { status, data } = await svc('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }) });
  if (status >= 300) throw new Error('createUser failed: ' + JSON.stringify(data));
  return data.id;
}
async function signIn(email, password) {
  const res = await fetch(URL + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!data.access_token) throw new Error('signIn failed: ' + JSON.stringify(data));
  return data.access_token;
}
async function deleteUser(id) { if (id) await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' }); }

(async () => {
  const stamp = Date.now();
  const email = `membership-test-${stamp}@example.com`;
  const password = 'TestPass!2345';
  let userId;

  try {
    console.log('== Setup ==');
    userId = await createUser(email, password);
    const token = await signIn(email, password);
    console.log('  created user', userId);

    // Directly credit the wallet as service role (simulating an already-approved top-up)
    await svc('/rest/v1/wallets', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ user_id: userId, usd_balance: 3000, cad_balance: 5000 }) });

    console.log('\n== TEST 1: Insufficient balance blocks purchase ==');
    const poorAttempt = await asUser(token, '/rest/v1/rpc/purchase_membership_with_wallet', { method: 'POST', body: JSON.stringify({ p_currency: 'usd', p_price_usd: 999999 }) });
    check('Purchase with absurd price fails (insufficient funds)', poorAttempt.status >= 400, poorAttempt);

    const profileBefore = await asUser(token, `/rest/v1/profiles?id=eq.${userId}&select=is_member,membership_expires_at`);
    check('Profile NOT marked as member after failed attempt', profileBefore.data?.[0]?.is_member === false, profileBefore.data);

    console.log('\n== TEST 2: Successful USD purchase activates membership ==');
    const buy = await asUser(token, '/rest/v1/rpc/purchase_membership_with_wallet', { method: 'POST', body: JSON.stringify({ p_currency: 'usd', p_price_usd: 2497 }) });
    check('Purchase succeeds', buy.status < 300, buy);

    const walletAfter = await asUser(token, `/rest/v1/wallets?user_id=eq.${userId}&select=usd_balance`);
    check('USD balance reduced by exactly 2497 (3000 -> 503)', Number(walletAfter.data?.[0]?.usd_balance) === 503, walletAfter.data);

    const profileAfter = await asUser(token, `/rest/v1/profiles?id=eq.${userId}&select=is_member,membership_expires_at`);
    const expiry = profileAfter.data?.[0]?.membership_expires_at ? new Date(profileAfter.data[0].membership_expires_at) : null;
    const daysAhead = expiry ? (expiry - new Date()) / (1000 * 60 * 60 * 24) : 0;
    check('is_member is true', profileAfter.data?.[0]?.is_member === true, profileAfter.data);
    check('Expiry is ~1 year in the future (364-366 days)', daysAhead > 364 && daysAhead < 366, { daysAhead });

    const ledger = await asUser(token, `/rest/v1/wallet_transactions?user_id=eq.${userId}&type=eq.membership&select=*`);
    check('Ledger has a membership-type entry for -2497 USD', ledger.data?.length === 1 && Number(ledger.data[0].amount) === -2497, ledger.data);

    console.log('\n== TEST 3: Renewal extends from current expiry, not from today ==');
    const firstExpiry = expiry;
    const renew = await asUser(token, '/rest/v1/rpc/purchase_membership_with_wallet', { method: 'POST', body: JSON.stringify({ p_currency: 'usd', p_price_usd: 100 }) });
    check('Renewal purchase succeeds', renew.status < 300, renew);
    const profileAfterRenew = await asUser(token, `/rest/v1/profiles?id=eq.${userId}&select=membership_expires_at`);
    const secondExpiry = new Date(profileAfterRenew.data?.[0]?.membership_expires_at);
    const gapDays = (secondExpiry - firstExpiry) / (1000 * 60 * 60 * 24);
    check('Second purchase extended expiry by ~1 year from the FIRST expiry (not from now)', gapDays >= 365 && gapDays <= 366, { gapDays, firstExpiry, secondExpiry });

    console.log('\n== TEST 4: CAD purchase converts at the configured rate ==');
    const rateRes = await svc('/rest/v1/site_content?key=eq.wallet_settings&select=value');
    const rate = Number(rateRes.data?.[0]?.value?.cad_to_usd_rate || 1.35);
    const cadBuy = await asUser(token, '/rest/v1/rpc/purchase_membership_with_wallet', { method: 'POST', body: JSON.stringify({ p_currency: 'cad', p_price_usd: 50 }) });
    check('CAD-denominated purchase succeeds', cadBuy.status < 300, cadBuy);
    const cadWalletAfter = await asUser(token, `/rest/v1/wallets?user_id=eq.${userId}&select=cad_balance`);
    const expectedCad = Number((5000 - 50 * rate).toFixed(2));
    check(`CAD balance correctly reduced by 50*${rate} (expected ${expectedCad})`, Number(cadWalletAfter.data?.[0]?.cad_balance) === expectedCad, cadWalletAfter.data);

    console.log(`\n${passed} passed, ${failed} failed.`);
  } finally {
    console.log('\n== Cleanup ==');
    await deleteUser(userId);
    console.log('  test user deleted');
  }

  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(1); });
