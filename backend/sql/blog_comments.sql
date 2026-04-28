-- Run this in Supabase SQL editor.
create table if not exists blog_comments (
  id          uuid primary key default gen_random_uuid(),
  post_slug   text not null,
  name        text not null,
  body        text not null,
  reactions   jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists blog_comments_slug_created_idx
  on blog_comments (post_slug, created_at desc);

-- Backend uses the service-role key, so RLS isn't strictly required.
-- If you'd rather lock it down, enable RLS and add a service_role bypass policy:
-- alter table blog_comments enable row level security;
