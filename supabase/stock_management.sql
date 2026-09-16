-- ============================================================
-- Automatic stock decrement on order placement
-- Run this in the Supabase SQL editor
-- ============================================================

-- Whenever an order_item row is inserted (i.e. a customer completes checkout),
-- decrement stock on the matching product_variant (if the line was for a
-- specific variant) or otherwise the parent product. SECURITY DEFINER so it
-- runs regardless of who inserted the row (checkout is often anonymous/customer),
-- bypassing the RLS that normally blocks non-admins from writing to products.
create or replace function public.decrement_stock_on_order_item()
returns trigger as $$
begin
  if new.variant_id is not null then
    update public.product_variants
    set stock = greatest(stock - new.quantity, 0)
    where id = new.variant_id;
  elsif new.product_id is not null then
    update public.products
    set stock = greatest(stock - new.quantity, 0)
    where id = new.product_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_decrement_stock_on_order_item on public.order_items;
create trigger trg_decrement_stock_on_order_item
  after insert on public.order_items
  for each row
  execute function public.decrement_stock_on_order_item();

-- If an order is cancelled, restock the items (so cancelling doesn't
-- permanently lose inventory to a dead order).
create or replace function public.restock_on_order_cancel()
returns trigger as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.product_variants pv
    set stock = pv.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = new.id and oi.variant_id = pv.id;

    update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = new.id and oi.variant_id is null and oi.product_id = p.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_restock_on_order_cancel on public.orders;
create trigger trg_restock_on_order_cancel
  after update on public.orders
  for each row
  execute function public.restock_on_order_cancel();
