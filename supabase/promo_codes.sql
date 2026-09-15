-- ============================================================
-- Promo codes — real, admin-managed discount codes (replaces
-- the old hardcoded NUTRATEIN10/SAVE10/VIP15 list in cart/page.jsx)
-- ============================================================

create table if not exists public.promo_codes (
  id                uuid primary key default uuid_generate_v4(),
  code              text not null unique,
  label             text,
  discount_percent  numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  is_active         boolean not null default true,
  expires_at        timestamptz,
  max_uses          integer,
  used_count        integer not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

-- No public select policy: codes are validated one-at-a-time through the
-- security-definer function below, never listed wholesale to visitors.
create policy "Admins can manage promo codes" on public.promo_codes
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Record which promo (if any) was used on an order, for admin visibility.
alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists discount_amount numeric(10,2) not null default 0;

create or replace function public.validate_promo_code(p_code text)
returns table(discount_percent numeric, label text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select pc.discount_percent, coalesce(pc.label, pc.code || ' Discount')
  from public.promo_codes pc
  where upper(pc.code) = upper(p_code)
    and pc.is_active = true
    and (pc.expires_at is null or pc.expires_at > now())
    and (pc.max_uses is null or pc.used_count < pc.max_uses);
end;
$$;

grant execute on function public.validate_promo_code(text) to authenticated, anon;

create or replace function public.record_promo_code_use(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.promo_codes
  set used_count = used_count + 1
  where upper(code) = upper(p_code) and is_active = true;
end;
$$;

grant execute on function public.record_promo_code_use(text) to authenticated, anon;

-- Seed the codes that used to be hardcoded, so nothing a customer already
-- knows about breaks. Admin can edit/deactivate these going forward.
insert into public.promo_codes (code, label, discount_percent) values
  ('NUTRATEIN10', '10% OFF Special', 10),
  ('SAVE10', '10% OFF Special', 10),
  ('VIP15', '15% Researcher Discount', 15),
  ('RESEARCH15', '15% Researcher Discount', 15)
on conflict (code) do nothing;
