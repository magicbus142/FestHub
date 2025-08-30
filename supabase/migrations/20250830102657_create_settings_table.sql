-- Create settings table to store key-value app settings like previous_amount
create table if not exists public.settings (
  key text primary key,
  value numeric default 0,
  updated_at timestamp with time zone default now()
);

-- Enable RLS and add permissive policies (mirroring other open tables behavior)
alter table public.settings enable row level security;

-- Allow anyone to read settings
create policy if not exists "Allow read to all" on public.settings
  for select
  using (true);

-- Allow inserts by anyone
create policy if not exists "Allow insert to all" on public.settings
  for insert
  with check (true);

-- Allow updates by anyone
create policy if not exists "Allow update to all" on public.settings
  for update
  using (true)
  with check (true);

-- Seed default previous_amount if not present
insert into public.settings(key, value)
select 'previous_amount', 0
where not exists (
  select 1 from public.settings where key = 'previous_amount'
);
