-- ============================================================================
-- Supabase setup for the portfolio backend.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to re-run (uses CREATE TABLE IF NOT EXISTS).
-- ============================================================================

-- 1. chat_logs — stores every AI chatbot exchange
create table if not exists public.chat_logs (
  id           bigserial primary key,
  user_message text        not null,
  ai_reply     text        not null,
  created_at   timestamptz not null default now()
);

-- 2. roast_logs — stores every Roast-My-Stack call
create table if not exists public.roast_logs (
  id         bigserial primary key,
  stack      text        not null,
  intensity  text        not null check (intensity in ('mild','medium','savage')),
  roast      text        not null,
  created_at timestamptz not null default now()
);

-- 3. contacts — contact-form submissions
create table if not exists public.contacts (
  id         bigserial primary key,
  name       text        not null,
  email      text        not null,
  subject    text,
  message    text        not null,
  ip         text,
  created_at timestamptz not null default now()
);

-- 4. page_views — anonymous analytics
create table if not exists public.page_views (
  id         bigserial primary key,
  path       text        not null,
  referrer   text,
  user_agent text,
  ip         text,
  created_at timestamptz not null default now()
);

-- 5. recruiter_logs — manual recruiter outreach tracking (admin-only)
create table if not exists public.recruiter_logs (
  id            bigserial primary key,
  company       text        not null,
  role          text,
  source        text,
  contacted_at  timestamptz not null default now(),
  notes         text
);

-- 6. interviews — interview pipeline tracking (admin-only)
create table if not exists public.interviews (
  id              bigserial primary key,
  company         text        not null,
  role            text,
  stage           text,
  outcome         text,
  interview_date  timestamptz not null default now(),
  notes           text
);

-- ── Row-Level Security ─────────────────────────────────────────────────────
-- Service-role key (used by the backend) BYPASSES RLS automatically,
-- so enabling RLS here is purely defence-in-depth: it prevents the public
-- anon key (which the frontend uses for the guestbook GET) from ever
-- reading sensitive tables like chat_logs / contacts / roast_logs.

alter table public.chat_logs       enable row level security;
alter table public.roast_logs      enable row level security;
alter table public.contacts        enable row level security;
alter table public.page_views      enable row level security;
alter table public.recruiter_logs  enable row level security;
alter table public.interviews      enable row level security;

-- Indexes for sane query speeds
create index if not exists chat_logs_created_at_idx      on public.chat_logs (created_at desc);
create index if not exists roast_logs_created_at_idx     on public.roast_logs (created_at desc);
create index if not exists contacts_created_at_idx       on public.contacts (created_at desc);
create index if not exists page_views_created_at_idx     on public.page_views (created_at desc);
create index if not exists page_views_path_idx           on public.page_views (path);

-- ============================================================================
-- Sanity check — run this in the SQL editor to confirm the tables exist:
--   select table_name from information_schema.tables where table_schema='public';
-- ============================================================================
