alter table jobs add column if not exists posted_by uuid references profiles(id);
create index if not exists jobs_posted_by_idx on jobs(posted_by);
