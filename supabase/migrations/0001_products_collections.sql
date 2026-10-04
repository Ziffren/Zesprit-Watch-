-- SUPERSEDED 2026-10-04 — never applied to a real database. The admin was
-- repointed at an already-existing Supabase project (shared with the
-- "Watch Report" app at /Users/phamhiendz/Bussiness Report) instead of a new
-- one, so these tables were never created. Kept only as history of the
-- original (now-abandoned) schema design. See
-- 0002_watch_catalog_fields.sql for what's actually live.
--
-- Zesprit Watch — Module 1: Collections & Products
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- for the project whose URL/keys go into .env.local.

-- ── collections ──────────────────────────────────────────────────────────
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  kind text not null default 'specialty' check (kind in ('brand', 'specialty')),
  cover_image_url text,
  created_at timestamptz not null default now()
);

-- ── products ─────────────────────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description_html text,
  vendor text not null default 'Z''esprit Watch',
  category text not null default 'Watches',
  price_cents integer,
  price_mode text not null default 'on_request' check (price_mode in ('fixed', 'on_request')),
  status text not null default 'draft' check (status in ('active', 'draft')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ── product_collections (many-to-many) ──────────────────────────────────
create table if not exists product_collections (
  product_id uuid not null references products(id) on delete cascade,
  collection_id uuid not null references collections(id) on delete cascade,
  primary key (product_id, collection_id)
);

-- ── product_images ───────────────────────────────────────────────────────
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position integer not null default 0,
  alt_text text
);

create index if not exists product_images_product_id_idx on product_images(product_id, position);

-- ── admin_users (gates /admin/*) ─────────────────────────────────────────
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- Helper used by every admin-only policy below.
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- ── Row Level Security ───────────────────────────────────────────────────
alter table collections enable row level security;
alter table products enable row level security;
alter table product_collections enable row level security;
alter table product_images enable row level security;
alter table admin_users enable row level security;

-- Public (anon + authenticated) can read published products/collections.
create policy "public read active products" on products
  for select using (status = 'active' or is_admin());

create policy "public read collections" on collections
  for select using (true);

create policy "public read product_collections" on product_collections
  for select using (true);

create policy "public read product_images" on product_images
  for select using (true);

-- Everything else (insert/update/delete, and admin_users reads) is admin-only.
create policy "admins write products" on products
  for all using (is_admin()) with check (is_admin());

create policy "admins write collections" on collections
  for all using (is_admin()) with check (is_admin());

create policy "admins write product_collections" on product_collections
  for all using (is_admin()) with check (is_admin());

create policy "admins write product_images" on product_images
  for all using (is_admin()) with check (is_admin());

create policy "admins read admin_users" on admin_users
  for select using (is_admin());

-- ── Storage bucket for product photos ───────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public read product-images bucket" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "admins write product-images bucket" on storage.objects
  for all using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

-- ── Bootstrapping your own admin account ────────────────────────────────
-- After you sign up the owner account once (via Supabase Auth, e.g. the
-- /admin/login page's "create the first admin" flow, or the Supabase
-- dashboard), run this once with that user's UUID to grant admin access:
--
--   insert into admin_users (user_id) values ('<your-auth-user-uuid>');
