// Throwaway end-to-end test of the wallet system. Creates 2 disposable
// auth users (customer + admin), drives the real RLS-scoped REST API as
// each of them, asserts the expected outcomes, then deletes everything.
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
  if (cond) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.log(`  FAIL: ${label}` + (extra ? ` -- ${JSON.stringify(extra)}` : ''));
    failed++;
  }
}

async function svc(path, opts = {}) {
  const res = await fetch(URL + path, {
    ...opts,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function asUser(token, path, opts = {}) {
  const res = await fetch(URL + path, {
    ...opts,
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: opts.prefer || 'return=representation', ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function createUser(email, password) {
  const { status, data } = await svc('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (status >= 300) throw new Error('createUser failed: ' + JSON.stringify(data));
  return data.id;
}

async function signIn(email, password) {
  const res = await fetch(URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('signIn failed: ' + JSON.stringify(data));
  return data.access_token;
}

async function deleteUser(id) {
  if (!id) return;
  await svc(`/auth/v1/admin/users/${id}`, { method: 'DELETE' });
}

(async () => {
  const stamp = Date.now();
  const customerEmail = `wallet-test-customer-${stamp}@example.com`;
  const adminEmail = `wallet-test-admin-${stamp}@example.com`;
  const password = 'TestPass!2345';

  let customerId, adminId;

  try {
    console.log('== Setup ==');
    customerId = await createUser(customerEmail, password);
    adminId = await createUser(adminEmail, password);
    await svc(`/rest/v1/profiles?id=eq.${adminId}`, { method: 'PATCH', body: JSON.stringify({ is_admin: true }) });
    console.log('  created customer', customerId, 'and admin', adminId);

    const customerToken = await signIn(customerEmail, password);
    const adminToken = await signIn(adminEmail, password);
    console.log('  signed in both test users');

    // ---- TEST 1: RLS blocks a user from directly editing their own wallet ----
    console.log('\n== TEST 1: RLS blocks direct wallet balance edit ==');
    const directEdit = await asUser(customerToken, '/rest/v1/wallets', {
      method: 'POST',
      body: JSON.stringify({ user_id: customerId, usd_balance: 999999 }),
    });
    check('Direct wallet insert/update is rejected by RLS', directEdit.status >= 400, directEdit);

    // ---- TEST 2: min/max top-up limits enforced server-side ----
    console.log('\n== TEST 2: Top-up amount limits enforced ==');
    const tooSmall = await asUser(customerToken, '/rest/v1/wallet_topups', {
      method: 'POST',
      body: JSON.stringify({ user_id: customerId, currency: 'usd', amount: 1, reference_note: 'too small' }),
    });
    check('Below-minimum top-up amount rejected', tooSmall.status >= 400, tooSmall);

    const tooLarge = await asUser(customerToken, '/rest/v1/wallet_topups', {
      method: 'POST',
      body: JSON.stringify({ user_id: customerId, currency: 'usd', amount: 999999, reference_note: 'too large' }),
    });
    check('Above-maximum top-up amount rejected', tooLarge.status >= 400, tooLarge);

    // ---- TEST 3: valid top-up request creation ----
    console.log('\n== TEST 3: Valid top-up request ==');
    const topupUsd = await asUser(customerToken, '/rest/v1/wallet_topups', {
      method: 'POST',
      body: JSON.stringify({ user_id: customerId, currency: 'usd', amount: 100, reference_note: 'TXN-USD-1' }),
    });
    check('Valid USD top-up request created', topupUsd.status < 300 && topupUsd.data?.[0]?.status === 'pending', topupUsd);
    const topupUsdId = topupUsd.data?.[0]?.id;

    // ---- TEST 4: non-admin cannot approve ----
    console.log('\n== TEST 4: Non-admin cannot approve a top-up ==');
    const nonAdminApprove = await asUser(customerToken, '/rest/v1/rpc/review_wallet_topup', {
      method: 'POST',
      body: JSON.stringify({ p_topup_id: topupUsdId, p_approve: true }),
    });
    check('Customer calling review_wallet_topup is rejected', nonAdminApprove.status >= 400, nonAdminApprove);

    // ---- TEST 5: admin approves ----
    console.log('\n== TEST 5: Admin approves top-up, wallet credited ==');
    const approve = await asUser(adminToken, '/rest/v1/rpc/review_wallet_topup', {
      method: 'POST',
      body: JSON.stringify({ p_topup_id: topupUsdId, p_approve: true }),
    });
    check('Admin approve call succeeds', approve.status < 300, approve);

    const walletAfterApprove = await asUser(customerToken, `/rest/v1/wallets?user_id=eq.${customerId}&select=usd_balance,cad_balance`);
    const usdBalance = Number(walletAfterApprove.data?.[0]?.usd_balance);
    check('USD wallet balance is exactly 100.00 after approval', usdBalance === 100, walletAfterApprove.data);

    // ---- TEST 6: cannot re-review the same top-up ----
    console.log('\n== TEST 6: Cannot review an already-reviewed top-up ==');
    const reReview = await asUser(adminToken, '/rest/v1/rpc/review_wallet_topup', {
      method: 'POST',
      body: JSON.stringify({ p_topup_id: topupUsdId, p_approve: false }),
    });
    check('Second review attempt on same top-up fails', reReview.status >= 400, reReview);

    // ---- TEST 7: pay an order with USD wallet ----
    console.log('\n== TEST 7: Pay order with USD wallet ==');
    const order1 = await asUser(customerToken, '/rest/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        user_id: customerId, email: customerEmail, full_name: 'Wallet Tester', total: 35.5,
        shipping_address: { address1: '1 Test St', city: 'Testville', state: 'TS', postal_code: '00000', country: 'United States' },
      }),
    });
    const order1Id = order1.data?.[0]?.id;
    check('Test order created', order1.status < 300 && !!order1Id, order1);

    const pay1 = await asUser(customerToken, '/rest/v1/rpc/pay_order_with_wallet', {
      method: 'POST',
      body: JSON.stringify({ p_order_id: order1Id, p_currency: 'usd' }),
    });
    check('pay_order_with_wallet succeeds for sufficient USD balance', pay1.status < 300, pay1);

    const walletAfterPay1 = await asUser(customerToken, `/rest/v1/wallets?user_id=eq.${customerId}&select=usd_balance`);
    check('USD balance reduced to exactly 64.50 (100 - 35.50)', Number(walletAfterPay1.data?.[0]?.usd_balance) === 64.5, walletAfterPay1.data);

    const orderAfterPay1 = await asUser(customerToken, `/rest/v1/orders?id=eq.${order1Id}&select=payment_status,payment_method`);
    check('Order marked paid via wallet_usd', orderAfterPay1.data?.[0]?.payment_status === 'paid' && orderAfterPay1.data?.[0]?.payment_method === 'wallet_usd', orderAfterPay1.data);

    // ---- TEST 8: cannot pay an already-paid order again ----
    console.log('\n== TEST 8: Cannot pay an already-paid order ==');
    const payAgain = await asUser(customerToken, '/rest/v1/rpc/pay_order_with_wallet', {
      method: 'POST',
      body: JSON.stringify({ p_order_id: order1Id, p_currency: 'usd' }),
    });
    check('Second payment attempt on same order fails', payAgain.status >= 400, payAgain);

    // ---- TEST 9: insufficient balance is rejected ----
    console.log('\n== TEST 9: Insufficient balance rejected ==');
    const bigOrder = await asUser(customerToken, '/rest/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        user_id: customerId, email: customerEmail, full_name: 'Wallet Tester', total: 5000,
        shipping_address: { address1: '1 Test St', city: 'Testville', state: 'TS', postal_code: '00000', country: 'United States' },
      }),
    });
    const bigOrderId = bigOrder.data?.[0]?.id;
    const payBig = await asUser(customerToken, '/rest/v1/rpc/pay_order_with_wallet', {
      method: 'POST',
      body: JSON.stringify({ p_order_id: bigOrderId, p_currency: 'usd' }),
    });
    check('Payment fails when balance is insufficient', payBig.status >= 400, payBig);

    const walletUnaffected = await asUser(customerToken, `/rest/v1/wallets?user_id=eq.${customerId}&select=usd_balance`);
    check('Balance untouched after failed insufficient-funds attempt', Number(walletUnaffected.data?.[0]?.usd_balance) === 64.5, walletUnaffected.data);

    // ---- TEST 10: CAD top-up + conversion on payment ----
    console.log('\n== TEST 10: CAD wallet top-up + conversion-based payment ==');
    const topupCad = await asUser(customerToken, '/rest/v1/wallet_topups', {
      method: 'POST',
      body: JSON.stringify({ user_id: customerId, currency: 'cad', amount: 200, reference_note: 'TXN-CAD-1' }),
    });
    const topupCadId = topupCad.data?.[0]?.id;
    check('Valid CAD top-up request created', topupCad.status < 300, topupCad);

    await asUser(adminToken, '/rest/v1/rpc/review_wallet_topup', {
      method: 'POST',
      body: JSON.stringify({ p_topup_id: topupCadId, p_approve: true }),
    });

    const rateRes = await svc(`/rest/v1/site_content?key=eq.wallet_settings&select=value`);
    const rate = Number(rateRes.data?.[0]?.value?.cad_to_usd_rate || 1.35);

    const cadOrder = await asUser(customerToken, '/rest/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        user_id: customerId, email: customerEmail, full_name: 'Wallet Tester', total: 20,
        shipping_address: { address1: '1 Test St', city: 'Testville', state: 'TS', postal_code: '00000', country: 'United States' },
      }),
    });
    const cadOrderId = cadOrder.data?.[0]?.id;
    const payCad = await asUser(customerToken, '/rest/v1/rpc/pay_order_with_wallet', {
      method: 'POST',
      body: JSON.stringify({ p_order_id: cadOrderId, p_currency: 'cad' }),
    });
    check('CAD wallet payment succeeds', payCad.status < 300, payCad);

    const expectedCadRemaining = Number((200 - 20 * rate).toFixed(2));
    const walletAfterCadPay = await asUser(customerToken, `/rest/v1/wallets?user_id=eq.${customerId}&select=cad_balance`);
    check(
      `CAD balance correctly converted at rate ${rate} (expected ${expectedCadRemaining})`,
      Number(walletAfterCadPay.data?.[0]?.cad_balance) === expectedCadRemaining,
      walletAfterCadPay.data
    );

    // ---- TEST 11: ledger has the right number of entries ----
    console.log('\n== TEST 11: Transaction ledger integrity ==');
    const ledger = await asUser(customerToken, `/rest/v1/wallet_transactions?user_id=eq.${customerId}&select=type,currency,amount&order=created_at.asc`);
    check('Ledger has exactly 4 entries (2 topups + 2 successful payments)', (ledger.data || []).length === 4, ledger.data);

    // ---- TEST 12: a user cannot see another user's wallet ----
    console.log('\n== TEST 12: Wallet privacy between users ==');
    const crossRead = await asUser(adminToken, `/rest/v1/wallets?user_id=eq.${customerId}&select=usd_balance`);
    check("Admin CAN read customer's wallet (admin policy)", crossRead.status < 300 && crossRead.data.length === 1, crossRead.data);

    console.log(`\n${passed} passed, ${failed} failed.`);
  } finally {
    console.log('\n== Cleanup ==');
    await deleteUser(customerId);
    await deleteUser(adminId);
    console.log('  test users deleted (cascade removes their wallets/orders/topups/ledger rows)');
  }

  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  console.error('SCRIPT ERROR', e);
  process.exit(1);
});
