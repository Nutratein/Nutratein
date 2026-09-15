-- ============================================================
-- Product variants (size/strength options per product)
-- Run this in the Supabase SQL editor
-- ============================================================

create table if not exists public.product_variants (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid not null references public.products(id) on delete cascade,
  label         text not null,              -- e.g. "5mg", "10mg", "1 Kit"
  price         numeric(10,2) not null check (price >= 0),
  compare_price numeric(10,2),
  stock         integer not null default 0,
  sku           text,
  image_url     text,                       -- optional; falls back to the parent product's image when empty
  sort_order    integer not null default 0,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);

alter table public.product_variants enable row level security;

create policy "Public can read variants of active products" on public.product_variants
  for select using (
    exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
  );

create policy "Admins can manage product variants" on public.product_variants
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Snapshot which variant an order line was for, so order history stays
-- accurate even if the variant is edited/deleted later.
alter table public.order_items add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
alter table public.order_items add column if not exists variant_label text;
