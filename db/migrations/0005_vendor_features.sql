alter table products add column if not exists seller_id uuid references profiles(id);
create index if not exists products_seller_id_idx on products(seller_id);

create table if not exists vendor_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  business_name text not null,
  description text,
  phone text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table vendor_profiles enable row level security;
drop policy if exists vendor_profiles_read on vendor_profiles;
create policy vendor_profiles_read on vendor_profiles for select using (true);
drop policy if exists vendor_profiles_write on vendor_profiles;
create policy vendor_profiles_write on vendor_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists order_items_product_id_idx on order_items(product_id);
