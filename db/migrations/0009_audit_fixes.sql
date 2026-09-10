-- Remediation migration for the September 2026 backend audit. Purely
-- additive / constraint-tightening — no destructive changes, no column
-- drops, nothing that touches the app's UI or API shape.

-- ── #9b / P2: lightweight audit log ──────────────────────────────────
-- Backs the interim admin confirmOrder mutation (order.ts) and the
-- becomeRider / addProduct audit logging called for in the P2 list.
-- Deliberately minimal — a generic (actor, action, target, detail) trail,
-- not a full event-sourcing table.
create table if not exists admin_audit_log (
  id serial primary key,
  actor_id uuid not null references profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  detail jsonb,
  created_at timestamp not null default now()
);

create index if not exists idx_admin_audit_log_target on admin_audit_log(target_type, target_id);

-- ── #10 Webhook idempotency ─────────────────────────────────────────
-- provider_reference identifies a specific provider-side charge event.
-- A partial unique index (ignoring nulls, since most rows never get one)
-- means a webhook replay or duplicate delivery for the same reference
-- can be detected and rejected instead of double-processing a payment.
create unique index if not exists idx_wallet_tx_provider_reference
  on wallet_transactions(provider_reference)
  where provider_reference is not null;

-- ── #11 Chilimba payout mislabeled as "refund" ──────────────────────
-- Existing rows created before this fix are relabeled so historical data
-- matches the corrected application code going forward.
update wallet_transactions
  set type = 'payout'
  where type = 'refund'
    and description like 'Chilimba payout —%';

-- ── P2: enum drift — check constraints on free-text status/type cols ─
-- These mirror the values the application code actually writes today
-- (see db/schema.ts comments). Using NOT VALID + VALIDATE would be the
-- zero-downtime-safe approach on a large existing table; these tables
-- are small enough here that a direct ADD CONSTRAINT is fine, but if
-- any row fails validation the migration will simply fail loudly rather
-- than silently corrupting data — check for stray values first if this
-- errors out.
-- Plain PostgreSQL does not support "ADD CONSTRAINT IF NOT EXISTS" for
-- CHECK constraints (only CREATE INDEX gets that syntax), so each one is
-- guarded with a pg_constraint lookup instead — safe to re-run.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_status_check') then
    alter table orders
      add constraint orders_status_check
      check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wallet_transactions_type_check') then
    alter table wallet_transactions
      add constraint wallet_transactions_type_check
      check (type in ('topup', 'payment', 'refund', 'payout'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wallet_transactions_status_check') then
    alter table wallet_transactions
      add constraint wallet_transactions_status_check
      check (status in ('pending', 'completed', 'failed'));
  end if;

  -- ── P2: lat/lng range validation at the DB layer ──────────────────
  -- Defense in depth alongside the zod validation added in
  -- rider.updateLocation — a stray 999,999 ping should never be storable
  -- even if a future code path forgets to validate it.
  if not exists (select 1 from pg_constraint where conname = 'rider_locations_lat_range') then
    alter table rider_locations add constraint rider_locations_lat_range check (lat between -90 and 90);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'rider_locations_lng_range') then
    alter table rider_locations add constraint rider_locations_lng_range check (lng between -180 and 180);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_delivery_lat_range') then
    alter table orders add constraint orders_delivery_lat_range check (delivery_lat is null or delivery_lat between -90 and 90);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_delivery_lng_range') then
    alter table orders add constraint orders_delivery_lng_range check (delivery_lng is null or delivery_lng between -180 and 180);
  end if;
end $$;
