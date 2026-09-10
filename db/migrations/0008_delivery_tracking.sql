-- Live delivery tracking. Riders are just profiles with role='rider' (no
-- separate riders table) — self-service via rider.becomeRider, the same
-- pattern as customer signup. rider_locations is deliberately its own
-- one-row-per-rider table (not a column on profiles) so a rider's location
-- history isn't tangled into the profile row and so the "one row, upserted
-- constantly" access pattern is isolated to a small table.

create table if not exists rider_locations (
  rider_id uuid primary key references profiles(id) on delete cascade,
  lat numeric not null,
  lng numeric not null,
  is_online boolean not null default true,
  updated_at timestamp not null default now()
);

-- Same posture as every other table (see 0000_init.sql): RLS on, no
-- policies. All reads/writes go through the tRPC server via the service
-- role key, which bypasses RLS — the app never talks to Postgrest directly
-- with the anon key for real data, only for auth. This keeps that one
-- consistent security model instead of carving out a live-tracking
-- exception with hand-written RLS policies.
alter table rider_locations enable row level security;

-- Which rider (if any) is delivering this order. Nullable — most orders
-- never touch this until a rider claims them.
alter table orders add column if not exists rider_id uuid references profiles(id);

create index if not exists idx_orders_rider on orders(rider_id);
