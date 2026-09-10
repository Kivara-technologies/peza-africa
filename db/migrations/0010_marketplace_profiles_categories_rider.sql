-- PEZA marketplace expansion: profile customization, hierarchical categories,
-- and persisted rider earnings.

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists address text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists country text not null default 'Zambia';
alter table profiles add column if not exists business_name text;
alter table profiles add column if not exists business_type text;
alter table profiles add column if not exists business_description text;
alter table profiles add column if not exists website text;

alter table categories add column if not exists parent_id integer references categories(id) on delete set null;
alter table categories add column if not exists sort_order integer not null default 0;
alter table categories add column if not exists is_active boolean not null default true;
alter table categories add column if not exists description text;
create index if not exists idx_categories_parent_active on categories(parent_id, is_active, sort_order);

alter table orders add column if not exists rider_earning numeric not null default 0;
create index if not exists idx_orders_rider_status_created on orders(rider_id, status, created_at desc);

-- Core marketplace taxonomy. Existing categories are preserved; missing launch
-- categories are added idempotently. Child categories can be added later without
-- changing frontend code because the API reads the database dynamically.
insert into categories (name, slug, image, sort_order, is_active, description)
values
  ('Cars', 'cars', '/assets/categories/cars.svg', 10, true, 'Cars and vehicles'),
  ('Bikes', 'bikes', '/assets/categories/bikes.svg', 20, true, 'Motorcycles and bicycles'),
  ('Agriculture', 'agriculture', '/assets/categories/agriculture.svg', 30, true, 'Farm inputs, equipment and produce'),
  ('Electronics', 'electronics', '/assets/categories/electronics.svg', 40, true, 'Phones, computers and electronics'),
  ('Fashion', 'fashion', '/assets/categories/fashion.svg', 50, true, 'Clothing, footwear and accessories'),
  ('Services', 'services', '/assets/categories/services.svg', 60, true, 'Professional and local services')
on conflict (slug) do update set is_active = true;

-- Useful subcategories for a Takealot-style expandable taxonomy.
insert into categories (name, slug, parent_id, sort_order, is_active)
select 'Used Cars', 'used-cars', id, 10, true from categories where slug = 'cars'
  and not exists (select 1 from categories c2 where c2.slug = 'used-cars');
insert into categories (name, slug, parent_id, sort_order, is_active)
select 'Motorcycles', 'motorcycles', id, 10, true from categories where slug = 'bikes'
  and not exists (select 1 from categories c2 where c2.slug = 'motorcycles');
insert into categories (name, slug, parent_id, sort_order, is_active)
select 'Farm Inputs', 'farm-inputs', id, 10, true from categories where slug = 'agriculture'
  and not exists (select 1 from categories c2 where c2.slug = 'farm-inputs');
