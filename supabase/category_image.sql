-- ============================================================
-- Category image (banner image shown on homepage & shop filters)
-- Run this in the Supabase SQL editor
-- ============================================================

alter table public.categories add column if not exists image_url text;
alter table public.categories add column if not exists show_on_homepage boolean not null default true;
