-- ============================================================================
-- severrir — database schema
--
-- Paste this whole file into the Supabase SQL editor and run it once. It is
-- idempotent: running it again is safe and changes nothing.
--
-- The site is a static export on GitHub Pages, so there is no server of ours
-- between the visitor and this database. Every rule that matters is therefore
-- written here, as row-level security, and not in the browser. The anon key
-- shipped in the bundle is public by design; on its own it opens nothing that
-- the policies below do not explicitly open.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- admins
--
-- Membership is granted by hand in the SQL editor and never from the browser:
-- the table has a read policy and no write policy at all, so there is no path
-- through the API that adds an admin.
-- ---------------------------------------------------------------------------

create table if not exists public.admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.admins enable row level security;

/*
 * security definer so it can read admins while admins itself is behind RLS.
 * Without that the read policy would have to consult the table it guards and
 * Postgres would reject the recursion. Every admin policy below calls this one
 * function rather than re-inlining the subquery, so there is a single place
 * where "is this the owner" is decided.
 */
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

/*
 * Only signed-in callers ever evaluate this. Every policy that calls it is
 * granted to `authenticated`, so leaving EXECUTE on PUBLIC would hand an
 * anonymous caller a security definer function it has no use for. Narrow it to
 * the one role that needs it.
 */
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins read own membership" on public.admins;
create policy "admins read own membership"
  on public.admins for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- project_overrides
--
-- Editable copy for the showcase cards. src/data/projects.ts stays the
-- committed default and is what renders at build time; a row here wins over it
-- at runtime, matched on slug. A missing row means "unchanged", and a null
-- column means "unchanged" too, so the dashboard only ever stores real edits.
--
-- Read is open to everyone because this is public page content — it is the
-- text on the homepage. Write is the owner alone.
-- ---------------------------------------------------------------------------

create table if not exists public.project_overrides (
  slug       text primary key,
  title      text,
  summary    text,
  stack      text[],
  github_url text,
  youtube_id text,
  -- Which diagram the card draws. Null means "unchanged" on a committed card
  -- and "module trace" on one added here, so a new card is never the only card
  -- on the page with nothing where the others have a drawing.
  schematic text,
  sort_order integer,
  visible    boolean not null default true,
  updated_at timestamptz not null default now(),

  -- Card height drives the stacking geometry on the homepage, so an
  -- unbounded summary would break the layout rather than merely look wrong.
  constraint summary_length check (summary is null or char_length(summary) <= 400),
  constraint title_length   check (title   is null or char_length(title)   <= 80),
  -- A YouTube id is exactly 11 characters of URL-safe base64.
  constraint youtube_id_shape check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  constraint github_url_shape check (github_url is null or github_url ~ '^https://github\.com/'),
  constraint stack_size check (stack is null or array_length(stack, 1) <= 6),
  constraint schematic_kind check (
    schematic is null
    or schematic in ('graph', 'grid', 'fanout', 'lattice', 'bands', 'module', 'none')
  )
);

-- Added after the table shipped, so an existing database needs this rather than
-- the column list above. Both are safe to run on a database that already has it.
alter table public.project_overrides
  add column if not exists schematic text;

do $$
begin
  alter table public.project_overrides
    add constraint schematic_kind check (
      schematic is null
      or schematic in ('graph', 'grid', 'fanout', 'lattice', 'bands', 'module', 'none')
    );
exception
  when duplicate_object then null;
end $$;

alter table public.project_overrides enable row level security;

drop policy if exists "anyone reads project overrides" on public.project_overrides;
create policy "anyone reads project overrides"
  on public.project_overrides for select to anon, authenticated
  using (true);

/*
 * Written as three policies rather than one FOR ALL. A FOR ALL policy also
 * covers SELECT, which would sit alongside the public read policy above and
 * make Postgres evaluate both on every read for a signed-in visitor — for a
 * result that cannot change, since the read policy already returns true. The
 * split leaves exactly one policy per action.
 */
drop policy if exists "only the owner writes project overrides" on public.project_overrides;

drop policy if exists "only the owner adds project overrides" on public.project_overrides;
create policy "only the owner adds project overrides"
  on public.project_overrides for insert to authenticated
  with check (public.is_admin());

drop policy if exists "only the owner edits project overrides" on public.project_overrides;
create policy "only the owner edits project overrides"
  on public.project_overrides for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "only the owner removes project overrides" on public.project_overrides;
create policy "only the owner removes project overrides"
  on public.project_overrides for delete to authenticated
  using (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists project_overrides_touch on public.project_overrides;
create trigger project_overrides_touch
  before update on public.project_overrides
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- bookings
--
-- A second, independent record of what Formspree already delivers to Discord.
-- Two paths means a commission request survives either one failing.
-- ---------------------------------------------------------------------------

create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  discord    text not null,
  email      text,
  tier       text not null,
  message    text not null,
  status     text not null default 'open',
  created_at timestamptz not null default now(),

  constraint status_known  check (status in ('open', 'handled')),
  constraint name_length    check (char_length(name)    between 1 and 80),
  constraint discord_length check (char_length(discord) between 2 and 40),
  constraint email_length   check (email is null or char_length(email) <= 254),
  constraint tier_length    check (char_length(tier)    between 1 and 40),
  constraint message_length check (char_length(message) between 1 and 5000)
);

create index if not exists bookings_created_at_idx on public.bookings (created_at desc);

/* Covers the foreign key to auth.users, which every policy below also filters
   on. Without it, deleting an account has to scan this table. */
create index if not exists bookings_user_id_idx on public.bookings (user_id);

alter table public.bookings enable row level security;

/*
 * auth.uid() is wrapped in a subselect throughout. Called bare, Postgres treats
 * it as volatile per row and re-runs it for every row the policy examines;
 * wrapped, it is evaluated once and the result compared against the column.
 * Same rule, one call instead of one per row.
 */
drop policy if exists "signed-in visitors file their own request" on public.bookings;
create policy "signed-in visitors file their own request"
  on public.bookings for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "read own requests, owner reads all" on public.bookings;
create policy "read own requests, owner reads all"
  on public.bookings for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "only the owner marks requests handled" on public.bookings;
create policy "only the owner marks requests handled"
  on public.bookings for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

/*
 * An authenticated account is a weak enough gate that a bored visitor could
 * still fill the table. Ten requests a day is far above any honest use and far
 * below anything that costs storage. security definer so the count sees every
 * row, not just the ones the caller is allowed to read.
 */
create or replace function public.bookings_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (
    select count(*) from public.bookings
    where user_id = new.user_id and created_at > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'Too many requests from this account in 24 hours.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

/*
 * A trigger function is invoked by the trigger, not called by the client, and
 * Postgres checks EXECUTE when the trigger is created rather than when it
 * fires. Nobody therefore needs this grant, and a security definer function
 * that can be called directly is worth one line to close.
 */
revoke execute on function public.bookings_rate_limit() from public, anon, authenticated;

drop trigger if exists bookings_rate_limit_check on public.bookings;
create trigger bookings_rate_limit_check
  before insert on public.bookings
  for each row execute function public.bookings_rate_limit();

-- ---------------------------------------------------------------------------
-- visitors
--
-- One row per distinct person, keyed by a one-way hash of IP + user agent +
-- a secret pepper that only the edge function holds. No address is ever
-- written down, so there is nothing here to leak.
--
-- Deliberately has NO policies. RLS is on and nothing is granted, which means
-- the anon and authenticated roles cannot read, insert or update a single row.
-- The edge function reaches it with the service role, which bypasses RLS. The
-- count comes back through visitor_stats() below and nowhere else, so the
-- number cannot be scraped or inflated from a browser console.
-- ---------------------------------------------------------------------------

create table if not exists public.visitors (
  visitor_hash text primary key,
  first_seen   timestamptz not null default now(),
  last_seen    timestamptz not null default now(),
  excluded     boolean not null default false
);

create index if not exists visitors_first_seen_idx on public.visitors (first_seen desc);

alter table public.visitors enable row level security;

/*
 * The only readable view of the visitor table. security definer to see past
 * the absent policies, with the admin check written inside the body so the
 * grant to authenticated cannot be turned into a leak.
 */
create or replace function public.visitor_stats()
returns table (total bigint, last_7_days bigint, excluded_devices bigint)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.' using errcode = 'insufficient_privilege';
  end if;

  return query
    select
      count(*) filter (where not v.excluded),
      count(*) filter (where not v.excluded and v.first_seen > now() - interval '7 days'),
      count(*) filter (where v.excluded)
    from public.visitors v;
end;
$$;

/* The body already refuses anyone who is not the owner, so this is the second
   of two locks rather than the only one. An anonymous caller cannot be the
   owner by definition, and now cannot reach the function at all. */
revoke execute on function public.visitor_stats() from public, anon;
grant execute on function public.visitor_stats() to authenticated;

-- ============================================================================
-- Final step, once and by hand.
--
-- Sign in on the site with Discord first so the account exists. Then take your
-- Discord account id (Discord Settings -> Advanced -> Developer Mode, then
-- right-click your name -> Copy User ID) and run:
--
--   insert into public.admins (user_id)
--   select u.id
--   from auth.users u
--   join auth.identities i on i.user_id = u.id
--   where i.provider = 'discord'
--     and i.provider_id = 'YOUR_DISCORD_USER_ID'
--   on conflict do nothing;
--
-- Matched on the Discord id rather than on whichever row in auth.users is
-- oldest: the oldest row is only yours until someone else signs in first.
-- Confirm with:
--
--   select u.raw_user_meta_data ->> 'user_name' as discord_handle,
--          i.provider_id as discord_id, a.added_at
--   from public.admins a
--   join auth.users u      on u.id = a.user_id
--   join auth.identities i on i.user_id = u.id and i.provider = 'discord';
-- ============================================================================
