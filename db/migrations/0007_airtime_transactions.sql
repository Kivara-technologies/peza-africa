create table if not exists airtime_transactions (
  id serial primary key,
  user_id uuid not null references profiles(id),
  network text not null,
  product_type text not null,
  phone_number text not null,
  amount numeric not null check (amount > 0),
  status text not null default 'pending',
  provider_reference text,
  wallet_transaction_id integer references wallet_transactions(id),
  created_at timestamptz not null default now()
);
create index if not exists airtime_transactions_user_idx on airtime_transactions(user_id, created_at desc);
