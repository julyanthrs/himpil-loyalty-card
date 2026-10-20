-- Himpil virtual loyalty card — schema, Row Level Security and staff-only RPCs.
--
-- Security model
--   * Customers can READ their own profile, loyalty account, stamp transactions and redemptions.
--   * Customers can UPDATE only their name and notification preferences.
--   * Nobody can write stamps or redemptions directly. The only write path is the
--     SECURITY DEFINER functions below, which check staff_roles first.
--   * Duplicate protection: every staff action carries a client-generated request_id (unique),
--     account rows are locked during updates, a short cooldown blocks accidental double scans,
--     and reward_redemptions is unique per (account, cycle) so a reward can be redeemed only once.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '' check (char_length(full_name) <= 80),
  email         text not null,
  avatar_url    text,
  notify_stamps boolean not null default true,
  notify_offers boolean not null default false,
  created_at    timestamptz not null default now()
);

create table public.staff_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('barista', 'manager')),
  created_at timestamptz not null default now()
);

create table public.loyalty_accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users (id) on delete cascade,
  member_code    text not null unique check (member_code ~ '^HMP-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  stamps         smallint not null default 0 check (stamps between 0 and 9),
  cycle          integer not null default 1 check (cycle >= 1),
  total_stamps   integer not null default 0,
  total_redeemed integer not null default 0,
  last_stamp_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.stamp_transactions (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.loyalty_accounts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  drink      text not null check (char_length(drink) between 1 and 60),
  stamps     smallint not null default 1 check (stamps between 1 and 9),
  cycle      integer not null,
  staff_id   uuid references auth.users (id) on delete set null,
  request_id uuid not null unique,
  created_at timestamptz not null default now()
);
create index stamp_transactions_user_idx on public.stamp_transactions (user_id, created_at desc);

create table public.reward_redemptions (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.loyalty_accounts (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  drink       text not null check (char_length(drink) between 1 and 60),
  cycle       integer not null,
  staff_id    uuid references auth.users (id) on delete set null,
  request_id  uuid not null unique,
  redeemed_at timestamptz not null default now(),
  unique (account_id, cycle)
);
create index reward_redemptions_user_idx on public.reward_redemptions (user_id, redeemed_at desc);

-- Combined history for the customer's Activity page. security_invoker = RLS of the caller applies.
create view public.activity_feed with (security_invoker = true) as
  select id, 'stamp'::text as kind, drink, stamps::int as stamps, cycle, created_at, user_id
    from public.stamp_transactions
  union all
  select id, 'redemption'::text, drink, 0, cycle, redeemed_at, user_id
    from public.reward_redemptions;

-- ---------------------------------------------------------------- row level security

alter table public.profiles           enable row level security;
alter table public.staff_roles        enable row level security;
alter table public.loyalty_accounts   enable row level security;
alter table public.stamp_transactions enable row level security;
alter table public.reward_redemptions enable row level security;

create policy "Read own profile"      on public.profiles           for select to authenticated using (id = (select auth.uid()));
create policy "Update own profile"    on public.profiles           for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Read own staff role"   on public.staff_roles        for select to authenticated using (user_id = (select auth.uid()));
create policy "Read own account"      on public.loyalty_accounts   for select to authenticated using (user_id = (select auth.uid()));
create policy "Read own transactions" on public.stamp_transactions for select to authenticated using (user_id = (select auth.uid()));
create policy "Read own redemptions"  on public.reward_redemptions for select to authenticated using (user_id = (select auth.uid()));

-- Defense in depth: strip table-level write privileges, then allow only safe profile columns.
revoke all on public.profiles, public.staff_roles, public.loyalty_accounts,
              public.stamp_transactions, public.reward_redemptions, public.activity_feed from anon;
revoke insert, update, delete, truncate on public.profiles, public.staff_roles, public.loyalty_accounts,
              public.stamp_transactions, public.reward_redemptions from authenticated;
grant select on public.profiles, public.staff_roles, public.loyalty_accounts,
             public.stamp_transactions, public.reward_redemptions, public.activity_feed to authenticated;
grant update (full_name, notify_stamps, notify_offers) on public.profiles to authenticated;

-- ---------------------------------------------------------------- helpers

create or replace function public.generate_member_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I
  bytes bytea;
  code text;
begin
  loop
    bytes := extensions.gen_random_bytes(8);
    code := 'HMP-';
    for i in 0..7 loop
      if i = 4 then code := code || '-'; end if;
      code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.loyalty_accounts where member_code = code);
  end loop;
  return code;
end;
$$;

-- New sign-up → profile + loyalty account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 80), ''), coalesce(new.email, ''));
  insert into public.loyalty_accounts (user_id, member_code)
  values (new.id, public.generate_member_code());
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff_roles where user_id = (select auth.uid()));
$$;

create or replace function public.assert_staff()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'NOT_STAFF' using errcode = 'P0001';
  end if;
end;
$$;

-- ---------------------------------------------------------------- staff RPCs

create or replace function public.staff_lookup(p_member_code text)
returns table (member_code text, full_name text, stamps smallint, cycle integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.assert_staff();
  return query
    select a.member_code, p.full_name, a.stamps, a.cycle
      from public.loyalty_accounts a
      join public.profiles p on p.id = a.user_id
     where a.member_code = upper(trim(p_member_code));
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.staff_award_stamps(
  p_member_code text,
  p_drink text,
  p_quantity integer,
  p_request_id uuid
)
returns table (member_code text, full_name text, stamps smallint, cycle integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  acct public.loyalty_accounts;
begin
  perform public.assert_staff();

  select * into acct from public.loyalty_accounts a
   where a.member_code = upper(trim(p_member_code))
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Idempotent retry: the same request was already applied.
  if exists (select 1 from public.stamp_transactions t where t.request_id = p_request_id) then
    return query select * from public.staff_lookup(p_member_code);
    return;
  end if;

  if acct.stamps >= 9 then
    raise exception 'REWARD_PENDING' using errcode = 'P0001';
  end if;
  if p_quantity is null or p_quantity < 1 or acct.stamps + p_quantity > 9 then
    raise exception 'EXCEEDS_CARD' using errcode = 'P0001';
  end if;
  if acct.last_stamp_at is not null and acct.last_stamp_at > now() - interval '10 seconds' then
    raise exception 'COOLDOWN' using errcode = 'P0001';
  end if;

  insert into public.stamp_transactions (account_id, user_id, drink, stamps, cycle, staff_id, request_id)
  values (acct.id, acct.user_id, left(trim(p_drink), 60), p_quantity, acct.cycle, auth.uid(), p_request_id);

  update public.loyalty_accounts
     set stamps = acct.stamps + p_quantity,
         total_stamps = acct.total_stamps + p_quantity,
         last_stamp_at = now(),
         updated_at = now()
   where id = acct.id;

  return query select * from public.staff_lookup(p_member_code);
end;
$$;

create or replace function public.staff_redeem_reward(
  p_member_code text,
  p_drink text,
  p_request_id uuid
)
returns table (member_code text, full_name text, stamps smallint, cycle integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  acct public.loyalty_accounts;
begin
  perform public.assert_staff();

  select * into acct from public.loyalty_accounts a
   where a.member_code = upper(trim(p_member_code))
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.reward_redemptions r where r.request_id = p_request_id) then
    return query select * from public.staff_lookup(p_member_code);
    return;
  end if;

  if acct.stamps < 9 then
    raise exception 'REWARD_LOCKED' using errcode = 'P0001';
  end if;

  -- unique (account_id, cycle) guarantees a single redemption per completed card.
  insert into public.reward_redemptions (account_id, user_id, drink, cycle, staff_id, request_id)
  values (acct.id, acct.user_id, left(trim(p_drink), 60), acct.cycle, auth.uid(), p_request_id);

  update public.loyalty_accounts
     set stamps = 0,
         cycle = acct.cycle + 1,
         total_redeemed = acct.total_redeemed + 1,
         updated_at = now()
   where id = acct.id;

  return query select * from public.staff_lookup(p_member_code);
end;
$$;

revoke execute on function public.generate_member_code(), public.handle_new_user(), public.assert_staff() from public, anon, authenticated;
revoke execute on function public.is_staff(), public.staff_lookup(text),
  public.staff_award_stamps(text, text, integer, uuid), public.staff_redeem_reward(text, text, uuid) from public, anon;
grant execute on function public.is_staff(), public.staff_lookup(text),
  public.staff_award_stamps(text, text, integer, uuid), public.staff_redeem_reward(text, text, uuid) to authenticated;

-- Live stamp updates on the customer's card (Realtime honours the RLS select policy).
alter publication supabase_realtime add table public.loyalty_accounts;
