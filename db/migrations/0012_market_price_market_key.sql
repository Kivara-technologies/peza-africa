update market_prices set market = '' where market is null;
alter table market_prices alter column market set default '';
alter table market_prices alter column market set not null;
drop index if exists idx_market_prices_category_item_market;
create unique index if not exists idx_market_prices_category_item_market on market_prices(category, item, market);
