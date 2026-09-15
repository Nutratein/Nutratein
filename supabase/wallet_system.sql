-- ============================================================
-- Wallet System (USD + CAD) — wire-transfer top-up, admin
-- approval, and "Pay with Wallet" at checkout.
-- Run this in the Supabase SQL editor (or it has already been
-- applied directly via the pooler connection).
-- ============================================================

-- ---------- Orders: payment tracking columns ----------
alter table public.orders add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'paid', 'refunded'));
alter table public.orders add column if not exists payment_method text;

-- ---------- Wallets: one row per user, two currency balances ----------
create table if not exists public.wallets (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  usd_balance numeric(10,2) not null default 0,
  cad_balance numeric(10,2) not null default 0,
  updated_at  timestamptz not null default now()
);

-- ---------- Wallet top-up requests (wire transfer submissions) ----------
create table if not exists public.wallet_topups (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  currency        text not null check (currency in ('usd', 'cad')),
  amount          numeric(10,2) not null check (amount > 0),
  reference_note  text,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  proof_url       text,
  admin_note      text,
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references auth.users(id)
);

create index if not exists wallet_topups_user_idx on public.wallet_topups(user_id);
create index if not exists wallet_topups_status_idx on public.wallet_topups(status);

-- ---------- Wallet transaction ledger (audit trail) ----------
create table if not exists public.wallet_transactions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  currency          text not null check (currency in ('usd', 'cad')),
  amount            numeric(10,2) not null, -- positive = credit, negative = debit
  balance_after     numeric(10,2) not null,
  type              text not null check (type in ('topup', 'order_payment', 'refund', 'adjustment')),
  related_topup_id  uuid references public.wallet_topups(id) on delete set null,
  related_order_id  uuid references public.orders(id) on delete set null,
  note              text,
  created_at        timestamptz not null default now()
);

create index if not exists wallet_transactions_user_idx on public.wallet_transactions(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- All balance mutations happen ONLY through the security-definer
-- functions below — no insert/update policy exists for these
-- tables, so a client can never edit a balance directly.
-- ============================================================
alter table public.wallets enable row level security;
alter table public.wallet_topups enable row level security;
alter table public.wallet_transactions enable row level security;

create policy "Users can view own wallet" on public.wallets
  for select using (auth.uid() = user_id);

create policy "Admins can view all wallets" on public.wallets
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Users can view own topups" on public.wallet_topups
  for select using (auth.uid() = user_id);

create policy "Users can create own topup requests" on public.wallet_topups
  for insert with check (
    auth.uid() = user_id
    and status = 'pending'
    and amount >= coalesce((select (value->>('min_topup_' || currency))::numeric from public.site_content where key = 'wallet_settings'), 0)
    and amount <= coalesce((select (value->>('max_topup_' || currency))::numeric from public.site_content where key = 'wallet_settings'), 999999999)
  );

create policy "Admins can view all topups" on public.wallet_topups
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Users can view own wallet transactions" on public.wallet_transactions
  for select using (auth.uid() = user_id);

create policy "Admins can view all wallet transactions" on public.wallet_transactions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ============================================================
-- FUNCTION: pay_order_with_wallet
-- Deducts the order total from the caller's own wallet (in the
-- chosen currency), converting via the admin-set CAD rate when
-- paying from the CAD balance. Runs as the function owner
-- (security definer) so it can bypass RLS to write the ledger.
-- ============================================================
create or replace function public.pay_order_with_wallet(p_order_id uuid, p_currency text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid := auth.uid();
  v_order       record;
  v_rate        numeric := 1;
  v_required    numeric;
  v_balance     numeric;
  v_new_balance numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_currency not in ('usd', 'cad') then
    raise exception 'Invalid currency';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order is null then
    raise exception 'Order not found';
  end if;
  if v_order.user_id is distinct from v_user_id then
    raise exception 'This order does not belong to you';
  end if;
  if v_order.payment_status = 'paid' then
    raise exception 'Order has already been paid';
  end if;

  if p_currency = 'cad' then
    select coalesce((value->>'cad_to_usd_rate')::numeric, 1) into v_rate
    from public.site_content where key = 'wallet_settings';
    if v_rate is null or v_rate <= 0 then
      v_rate := 1;
    end if;
    v_required := round(v_order.total * v_rate, 2);
  else
    v_required := v_order.total;
  end if;

  insert into public.wallets (user_id) values (v_user_id) on conflict (user_id) do nothing;

  if p_currency = 'usd' then
    select usd_balance into v_balance from public.wallets where user_id = v_user_id for update;
  else
    select cad_balance into v_balance from public.wallets where user_id = v_user_id for update;
  end if;

  if v_balance < v_required then
    raise exception 'Insufficient wallet balance';
  end if;

  v_new_balance := v_balance - v_required;

  if p_currency = 'usd' then
    update public.wallets set usd_balance = v_new_balance, updated_at = now() where user_id = v_user_id;
  else
    update public.wallets set cad_balance = v_new_balance, updated_at = now() where user_id = v_user_id;
  end if;

  insert into public.wallet_transactions (user_id, currency, amount, balance_after, type, related_order_id, note)
  values (v_user_id, p_currency, -v_required, v_new_balance, 'order_payment', p_order_id,
          'Order #' || substr(p_order_id::text, 1, 8) || ' paid via wallet');

  update public.orders
  set payment_status = 'paid',
      payment_method = case when p_currency = 'usd' then 'wallet_usd' else 'wallet_cad' end
  where id = p_order_id;
end;
$$;

grant execute on function public.pay_order_with_wallet(uuid, text) to authenticated;

-- ============================================================
-- FUNCTION: review_wallet_topup
-- Admin-only. Approves or rejects a pending top-up. On approval,
-- credits the wallet and writes a ledger entry atomically.
-- ============================================================
create or replace function public.review_wallet_topup(p_topup_id uuid, p_approve boolean, p_admin_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin       uuid := auth.uid();
  v_is_admin    boolean;
  v_topup       record;
  v_new_balance numeric;
begin
  select is_admin into v_is_admin from public.profiles where id = v_admin;
  if not coalesce(v_is_admin, false) then
    raise exception 'Not authorized';
  end if;

  select * into v_topup from public.wallet_topups where id = p_topup_id for update;
  if v_topup is null then
    raise exception 'Top-up request not found';
  end if;
  if v_topup.status <> 'pending' then
    raise exception 'This top-up has already been reviewed';
  end if;

  if p_approve then
    insert into public.wallets (user_id) values (v_topup.user_id) on conflict (user_id) do nothing;

    if v_topup.currency = 'usd' then
      update public.wallets set usd_balance = usd_balance + v_topup.amount, updated_at = now()
      where user_id = v_topup.user_id
      returning usd_balance into v_new_balance;
    else
      update public.wallets set cad_balance = cad_balance + v_topup.amount, updated_at = now()
      where user_id = v_topup.user_id
      returning cad_balance into v_new_balance;
    end if;

    insert into public.wallet_transactions (user_id, currency, amount, balance_after, type, related_topup_id, note)
    values (v_topup.user_id, v_topup.currency, v_topup.amount, v_new_balance, 'topup', p_topup_id,
            'Wire transfer top-up approved');
  end if;

  update public.wallet_topups
  set status = case when p_approve then 'approved' else 'rejected' end,
      admin_note = p_admin_note,
      reviewed_at = now(),
      reviewed_by = v_admin
  where id = p_topup_id;
end;
$$;

grant execute on function public.review_wallet_topup(uuid, boolean, text) to authenticated;

-- ============================================================
-- Membership: purchase Apex Vault with wallet balance
-- ============================================================
alter table public.profiles add column if not exists is_member boolean not null default false;
alter table public.profiles add column if not exists membership_expires_at timestamptz;

alter table public.wallet_transactions drop constraint if exists wallet_transactions_type_check;
alter table public.wallet_transactions add constraint wallet_transactions_type_check
  check (type in ('topup', 'order_payment', 'refund', 'adjustment', 'membership'));

create or replace function public.purchase_membership_with_wallet(p_currency text, p_price_usd numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id        uuid := auth.uid();
  v_rate           numeric := 1;
  v_required       numeric;
  v_balance        numeric;
  v_new_balance    numeric;
  v_current_expiry timestamptz;
  v_new_expiry     timestamptz;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_currency not in ('usd', 'cad') then
    raise exception 'Invalid currency';
  end if;
  if p_price_usd is null or p_price_usd <= 0 then
    raise exception 'Invalid membership price';
  end if;

  if p_currency = 'cad' then
    select coalesce((value->>'cad_to_usd_rate')::numeric, 1) into v_rate
    from public.site_content where key = 'wallet_settings';
    if v_rate is null or v_rate <= 0 then
      v_rate := 1;
    end if;
    v_required := round(p_price_usd * v_rate, 2);
  else
    v_required := p_price_usd;
  end if;

  insert into public.wallets (user_id) values (v_user_id) on conflict (user_id) do nothing;

  if p_currency = 'usd' then
    select usd_balance into v_balance from public.wallets where user_id = v_user_id for update;
  else
    select cad_balance into v_balance from public.wallets where user_id = v_user_id for update;
  end if;

  if v_balance < v_required then
    raise exception 'Insufficient wallet balance';
  end if;

  v_new_balance := v_balance - v_required;

  if p_currency = 'usd' then
    update public.wallets set usd_balance = v_new_balance, updated_at = now() where user_id = v_user_id;
  else
    update public.wallets set cad_balance = v_new_balance, updated_at = now() where user_id = v_user_id;
  end if;

  select membership_expires_at into v_current_expiry from public.profiles where id = v_user_id;
  if v_current_expiry is not null and v_current_expiry > now() then
    v_new_expiry := v_current_expiry + interval '1 year';
  else
    v_new_expiry := now() + interval '1 year';
  end if;

  update public.profiles set is_member = true, membership_expires_at = v_new_expiry where id = v_user_id;

  insert into public.wallet_transactions (user_id, currency, amount, balance_after, type, note)
  values (v_user_id, p_currency, -v_required, v_new_balance, 'membership', 'Apex Vault Membership — 1 year');
end;
$$;

grant execute on function public.purchase_membership_with_wallet(text, numeric) to authenticated;

-- ============================================================
-- SEED — default wallet settings (bank details + CAD rate).
-- Edit these from Admin → Wallet → Settings.
-- ============================================================
insert into public.site_content (key, value) values (
  'wallet_settings',
  '{
    "cad_to_usd_rate": 1.35,
    "min_topup_usd": 10,
    "max_topup_usd": 10000,
    "min_topup_cad": 10,
    "max_topup_cad": 10000,
    "usd_bank": {
      "bank_name": "",
      "account_name": "",
      "account_number": "",
      "routing_number": "",
      "swift": ""
    },
    "cad_bank": {
      "bank_name": "",
      "account_name": "",
      "account_number": "",
      "transit_number": "",
      "institution_number": "",
      "swift": ""
    },
    "instructions": "After sending your wire, submit the reference/confirmation number below. Approval usually takes a few hours once funds are received."
  }'::jsonb
)
on conflict (key) do nothing;
