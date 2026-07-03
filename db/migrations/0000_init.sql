-- PEZA marketplace schema for Supabase Postgres.
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.

create table if not exists profiles (
  id uuid primary key,
  name text,
  email text,
  phone text,
  role text not null default 'customer',
  created_at timestamp not null default now()
);

create table if not exists categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  image text
);

create table if not exists products (
  id serial primary key,
  name text not null,
  slug text,
  description text,
  price numeric not null,
  compare_price numeric,
  image text not null,
  real_photo text,
  category_id integer references categories(id),
  category_slug text,
  vendor text not null default 'PEZA Marketplace',
  rating numeric not null default 4.5,
  review_count integer not null default 0,
  whatsapp_number text,
  layby_months integer,
  featured boolean not null default false,
  is_deal boolean not null default false,
  stock integer not null default 100,
  created_at timestamp not null default now()
);
create index if not exists idx_products_category_slug on products(category_slug);

create table if not exists orders (
  id serial primary key,
  user_id uuid not null references profiles(id),
  order_number text not null unique,
  subtotal numeric not null,
  shipping numeric not null,
  discount numeric not null default 0,
  total numeric not null,
  payment_method text not null,
  status text not null default 'pending',
  created_at timestamp not null default now()
);
create index if not exists idx_orders_user on orders(user_id);

create table if not exists order_items (
  id serial primary key,
  order_id integer not null references orders(id) on delete cascade,
  product_id integer not null,
  product_name text not null,
  product_image text,
  price numeric not null,
  quantity integer not null,
  total numeric not null
);

create table if not exists wallet_transactions (
  id serial primary key,
  user_id uuid not null references profiles(id),
  amount numeric not null,
  type text not null,
  provider text,
  description text,
  created_at timestamp not null default now()
);
create index if not exists idx_wallet_user on wallet_transactions(user_id);

create table if not exists suppliers (
  id serial primary key,
  name text not null,
  image text,
  city text not null,
  country text not null,
  verified boolean not null default false,
  rating numeric not null default 4.5,
  description text,
  min_order text,
  lead_time text,
  category text not null default 'All'
);

create table if not exists market_prices (
  id serial primary key,
  category text not null,
  item text not null,
  price text not null,
  change text not null default '0%',
  is_up boolean,
  updated_at timestamp not null default now()
);

create table if not exists jobs (
  id serial primary key,
  title text not null,
  company text not null,
  category text not null,
  location text not null,
  type text not null,
  salary text not null,
  description text,
  requirements jsonb default '[]',
  urgent boolean not null default false,
  posted_at timestamp not null default now()
);

create table if not exists job_applications (
  id serial primary key,
  job_id integer not null references jobs(id),
  user_id uuid not null references profiles(id),
  cover_letter text,
  created_at timestamp not null default now()
);

create table if not exists chats (
  id serial primary key,
  user_id uuid not null references profiles(id),
  name text not null,
  avatar text not null default 'S',
  last_msg text not null default '',
  unread integer not null default 0,
  updated_at timestamp not null default now()
);
create index if not exists idx_chats_user on chats(user_id);

create table if not exists chat_messages (
  id serial primary key,
  chat_id integer not null references chats(id) on delete cascade,
  text text not null,
  is_outgoing boolean not null default true,
  created_at timestamp not null default now()
);

create table if not exists notifications (
  id serial primary key,
  user_id uuid not null references profiles(id),
  type text not null default 'info',
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamp not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id);

-- Lock every table down at the PostgREST layer. The app only ever talks to
-- Postgres through the server-side DATABASE_URL connection (Drizzle), never
-- through the Supabase anon/public API, so RLS with no policies is a safe
-- default that blocks any accidental public exposure.
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table wallet_transactions enable row level security;
alter table suppliers enable row level security;
alter table market_prices enable row level security;
alter table jobs enable row level security;
alter table job_applications enable row level security;
alter table chats enable row level security;
alter table chat_messages enable row level security;
alter table notifications enable row level security;
