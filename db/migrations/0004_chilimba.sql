-- Chilimba: rotating savings circles (ROSCA). Members contribute a fixed
-- amount per round; the pot pays out to one member per round in join
-- order, until everyone has been paid once. All money movement happens
-- through wallet_transactions (existing table) — this feature only ever
-- transfers between members' own wallet balances, never creates money.

create table if not exists chilimba_circles (
  id serial primary key,
  name text not null,
  description text,
  contribution_amount numeric not null,
  frequency_days integer not null default 7,
  max_members integer not null,
  creator_id uuid not null references profiles(id),
  status text not null default 'recruiting',
  current_round integer not null default 0,
  created_at timestamp not null default now()
);

create table if not exists chilimba_members (
  id serial primary key,
  circle_id integer not null references chilimba_circles(id) on delete cascade,
  user_id uuid not null references profiles(id),
  payout_position integer not null,
  has_been_paid boolean not null default false,
  joined_at timestamp not null default now(),
  unique (circle_id, user_id),
  unique (circle_id, payout_position)
);

create table if not exists chilimba_contributions (
  id serial primary key,
  circle_id integer not null references chilimba_circles(id) on delete cascade,
  user_id uuid not null references profiles(id),
  round integer not null,
  amount numeric not null,
  created_at timestamp not null default now(),
  unique (circle_id, user_id, round)
);

create table if not exists chilimba_payouts (
  id serial primary key,
  circle_id integer not null references chilimba_circles(id) on delete cascade,
  round integer not null,
  recipient_id uuid not null references profiles(id),
  amount numeric not null,
  paid_at timestamp not null default now(),
  unique (circle_id, round)
);

create index if not exists idx_chilimba_members_circle on chilimba_members(circle_id);
create index if not exists idx_chilimba_contributions_circle_round on chilimba_contributions(circle_id, round);

alter table chilimba_circles enable row level security;
alter table chilimba_members enable row level security;
alter table chilimba_contributions enable row level security;
alter table chilimba_payouts enable row level security;
