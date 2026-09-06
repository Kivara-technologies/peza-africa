-- Operational audit found several real hot-path queries running with no
-- supporting index — fine at today's data volume, but each of these gets
-- slower as the table grows. All purely additive, safe to run anytime.

-- Every chat screen load filters messages by chat_id.
create index if not exists idx_chat_messages_chat on chat_messages(chat_id);

-- applyToJob checks (job_id, user_id) on every single application attempt
-- to prevent duplicate applications.
create index if not exists idx_job_applications_job_user on job_applications(job_id, user_id);

-- Chilimba's "myCircles" and "contribute" ownership checks both filter
-- members by user_id directly (not through circle_id).
create index if not exists idx_chilimba_members_user on chilimba_members(user_id);

-- order.list now joins order_items for every order in one query — needs
-- this index to stay a single index lookup instead of a sequential scan.
create index if not exists idx_order_items_order on order_items(order_id);

-- vendor.salesSummary filters order_items by product_id (across a seller's
-- products) — Postgres does not auto-index a column just because it has a
-- foreign key constraint, so this needs to be explicit.
create index if not exists idx_order_items_product on order_items(product_id);
