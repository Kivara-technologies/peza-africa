-- Fixes critical pre-launch checkout/wallet issues:
--   * orders: delivery address/phone (previously never collected), a
--     paymentReference column for future provider-webhook correlation.
--   * order_items.product_id: real foreign key (was a bare integer).
--   * wallet_transactions: a status column so a top-up only counts toward
--     the balance once a provider webhook confirms it — this is what makes
--     wallet.topUp stop being an instant free-money mint.
-- Existing rows default to status='completed' (delivery fields default to
-- '') so nothing already in the DB breaks; new checkouts get real values
-- going forward.

alter table orders
  add column if not exists payment_reference text,
  add column if not exists delivery_address text not null default '',
  add column if not exists delivery_phone text not null default '',
  add column if not exists delivery_lat numeric,
  add column if not exists delivery_lng numeric;

alter table wallet_transactions
  add column if not exists status text not null default 'completed',
  add column if not exists provider_reference text;

-- order_items.product_id previously had no FK at all. Add it now that
-- order.create always writes real product ids (server-looked-up, not
-- client-supplied).
alter table order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id) references products(id)
  not valid; -- validate separately if there's existing bad data to clean up first

-- Uncomment once you've confirmed no orphaned product_id values exist:
-- alter table order_items validate constraint order_items_product_id_fkey;

create index if not exists wallet_transactions_status_idx on wallet_transactions (status);
