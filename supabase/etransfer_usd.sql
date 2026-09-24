-- ============================================================
-- Extend e-Transfer to USD wallet top-ups too (mirrors cad_etransfer).
-- Run this in the Supabase SQL editor.
-- ============================================================

update public.site_content
set value = value || '{
  "usd_etransfer": {
    "email": "",
    "recipient_name": "",
    "security_question": "",
    "security_answer": ""
  }
}'::jsonb
where key = 'wallet_settings'
  and not (value ? 'usd_etransfer');
