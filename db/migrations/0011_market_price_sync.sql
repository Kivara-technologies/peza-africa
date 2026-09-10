alter table market_prices add column if not exists source text;
alter table market_prices add column if not exists unit text not null default 'ZMW';
alter table market_prices add column if not exists market text;
create unique index if not exists idx_market_prices_category_item_market on market_prices(category, item, coalesce(market, ''));
