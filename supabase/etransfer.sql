-- ============================================================
-- Interac e-Transfer as a second CAD top-up method (alongside
-- wire transfer). Run this in the Supabase SQL editor.
-- ============================================================

-- Track which rail a top-up request came in on.
alter table public.wallet_topups add column if not exists method text not null default 'wire'
  check (method in ('wire', 'etransfer'));

-- Seed the e-Transfer recipient details alongside the existing bank details.
-- Admin edits these from Admin -> Wallet Top-ups -> Wallet Settings.
update public.site_content
set value = value || '{
  "cad_etransfer": {
    "email": "",
    "recipient_name": "",
    "security_question": "",
    "security_answer": ""
  }
}'::jsonb
where key = 'wallet_settings'
  and not (value ? 'cad_etransfer');
