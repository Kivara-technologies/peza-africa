create table if not exists chilimba_circles (
  id serial primary key,
  owner_id uuid not null references profiles(id),
  name text not null,
  contribution_amount numeric not null check (contribution_amount > 0),
  cycle_length integer not null check (cycle_length > 1),
  current_cycle integer not null default 1,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create table if not exists chilimba_members (
  id serial primary key,
  circle_id integer not null references chilimba_circles(id) on delete cascade,
  user_id uuid not null references profiles(id),
  payout_position integer not null,
  joined_at timestamptz not null default now(),
  unique(circle_id, user_id),
  unique(circle_id, payout_position)
);
create table if not exists chilimba_contributions (
  id serial primary key,
  circle_id integer not null references chilimba_circles(id) on delete cascade,
  member_id integer not null references chilimba_members(id),
  cycle integer not null,
  amount numeric not null check (amount > 0),
  wallet_transaction_id integer references wallet_transactions(id),
  created_at timestamptz not null default now(),
  unique(member_id, cycle)
);
create index if not exists chilimba_circles_status_idx on chilimba_circles(status);
create index if not exists chilimba_members_circle_idx on chilimba_members(circle_id);
