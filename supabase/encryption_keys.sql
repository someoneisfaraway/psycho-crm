-- Encryption keys table and RLS policies for Supabase

-- Table: public.encryption_keys
create table if not exists public.encryption_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dek_encrypted text not null,
  salt text not null,
  kdf_iterations integer not null default 150000,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.encryption_keys enable row level security;

-- Policies: allow each user to manage only their own key
create policy if not exists read_own_encryption_key
  on public.encryption_keys
  for select
  using (auth.uid() = user_id);

create policy if not exists insert_own_encryption_key
  on public.encryption_keys
  for insert
  with check (auth.uid() = user_id);

create policy if not exists update_own_encryption_key
  on public.encryption_keys
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: updated_at maintenance via trigger (requires function)
-- Uncomment if you have a trigger function like public.set_updated_at()
-- create trigger set_updated_at
--   before update on public.encryption_keys
--   for each row
--   execute procedure public.set_updated_at();

