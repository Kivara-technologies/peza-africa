-- Adds real seller ownership to products. Previously "vendor" was a free-text
-- display name with no link to an actual logged-in account, so there was no
-- way for a seller to manage "their" listings. This adds that link.
--
-- vendor_id is nullable: existing platform-seeded demo products (from
-- 0001_seed.sql and 0002_expanded_catalog_seed.sql) have no owning user and
-- stay that way — they're not editable through the vendor dashboard.

alter table products add column if not exists vendor_id uuid references profiles(id);
create index if not exists idx_products_vendor_id on products(vendor_id);
