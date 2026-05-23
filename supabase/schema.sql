-- ============================================================
-- Event-Tejas: Logo Voting App Schema
-- Run this in Supabase SQL Editor (supabase.com > SQL Editor)
-- ============================================================

-- LOGOS TABLE
create table public.logos (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete cascade not null,
  image_url text not null,
  label text not null,
  created_at timestamptz default now() not null
);

alter table public.logos enable row level security;

-- Anyone logged in can view logos (author identity hidden by not selecting author_id in queries)
create policy "Authenticated users can view logos"
  on public.logos for select
  to authenticated
  using (true);

-- Users can only insert their own logos
create policy "Users can insert own logos"
  on public.logos for insert
  to authenticated
  with check (auth.uid() = author_id);

-- Users can delete their own logos
create policy "Users can delete own logos"
  on public.logos for delete
  to authenticated
  using (auth.uid() = author_id);


-- VOTES TABLE
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid references auth.users(id) on delete cascade not null,
  logo_id uuid references public.logos(id) on delete cascade not null,
  rank int not null check (rank in (1, 2, 3)),
  created_at timestamptz default now() not null,
  unique(voter_id, logo_id),
  unique(voter_id, rank)
);

alter table public.votes enable row level security;

-- Users can view all votes (for live results)
create policy "Authenticated users can view votes"
  on public.votes for select
  to authenticated
  using (true);

-- Users can only insert votes where voter = themselves AND logo is not theirs
create policy "Users can vote for others logos only"
  on public.votes for insert
  to authenticated
  with check (
    auth.uid() = voter_id
    and (
      select author_id from public.logos where id = logo_id
    ) != auth.uid()
  );

-- Users can update (change rank) their own votes
create policy "Users can update own votes"
  on public.votes for update
  to authenticated
  using (auth.uid() = voter_id);

-- Users can delete their own votes (to re-vote)
create policy "Users can delete own votes"
  on public.votes for delete
  to authenticated
  using (auth.uid() = voter_id);


-- SETTINGS TABLE (single row, toggled manually in DB for prototype)
create table public.settings (
  id int primary key default 1,
  voting_open boolean default true not null,
  reveal_authors boolean default false not null,
  constraint single_row check (id = 1)
);

alter table public.settings enable row level security;

-- Anyone logged in can read settings
create policy "Authenticated users can read settings"
  on public.settings for select
  to authenticated
  using (true);

-- Seed the single settings row
insert into public.settings(id, voting_open, reveal_authors)
values(1, true, false)
on conflict (id) do nothing;


-- PROFILES TABLE (stores display name from Google OAuth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can upsert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- STORAGE: logos bucket
-- Path layout: <user_id>/<timestamp>.<ext>
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  10485760,
  array['image/png','image/jpeg','image/jpg','image/svg+xml','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (bucket is already public, this is belt-and-braces for object-level reads)
create policy "Public read logos"
  on storage.objects for select
  to public
  using (bucket_id = 'logos');

-- Authenticated users can upload only into their own user-id folder
create policy "Users upload own logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can delete only their own files
create policy "Users delete own logos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
