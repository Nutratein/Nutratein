-- ============================================================
-- Signup email OTP verification
-- Run this in the Supabase SQL editor
-- ============================================================

create table if not exists public.otp_codes (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  code        text not null,
  purpose     text not null default 'signup',
  attempts    integer not null default 0,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists otp_codes_email_purpose_idx on public.otp_codes(email, purpose);

-- Locked down: this table holds live verification codes, so it must never be
-- readable/writable via the public anon key. Only the server-side service_role
-- client (lib/supabaseAdmin.js) touches this table — RLS stays on with no
-- policies, which blocks anon/authenticated roles entirely by default.
alter table public.otp_codes enable row level security;
