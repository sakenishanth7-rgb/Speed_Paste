
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default 'folder',
  color text default 'violet',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_user_idx on public.categories(user_id);
alter table public.categories enable row level security;
create policy "cat select own" on public.categories for select using (auth.uid() = user_id);
create policy "cat insert own" on public.categories for insert with check (auth.uid() = user_id);
create policy "cat update own" on public.categories for update using (auth.uid() = user_id);
create policy "cat delete own" on public.categories for delete using (auth.uid() = user_id);

-- snippets
create table public.snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  pinned boolean not null default false,
  favorite boolean not null default false,
  position int not null default 0,
  last_copied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index snippets_user_idx on public.snippets(user_id);
create index snippets_category_idx on public.snippets(category_id);
alter table public.snippets enable row level security;
create policy "snip select own" on public.snippets for select using (auth.uid() = user_id);
create policy "snip insert own" on public.snippets for insert with check (auth.uid() = user_id);
create policy "snip update own" on public.snippets for update using (auth.uid() = user_id);
create policy "snip delete own" on public.snippets for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger trg_snippets_updated before update on public.snippets for each row execute function public.set_updated_at();

-- auto profile + default categories on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));

  insert into public.categories (user_id, name, icon, color, position) values
    (new.id, 'TTD', 'landmark', 'amber', 0),
    (new.id, 'IRCTC', 'train', 'sky', 1),
    (new.id, 'Personal', 'user', 'violet', 2);
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
