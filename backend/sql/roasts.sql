-- Roast Me Back: visitors leave one-line roasts of the portfolio,
-- I read every one and reply to the good ones.
-- Run this in Supabase SQL editor.

create table if not exists roasts (
  id            uuid        primary key default gen_random_uuid(),
  body          text        not null,
  author_name   text,
  author_link   text,
  is_pinned     boolean     not null default false,
  reply_body    text,
  reply_at      timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists roasts_created_idx
  on roasts (created_at desc);

create index if not exists roasts_pinned_idx
  on roasts (is_pinned desc, created_at desc);

-- Seed a few self-roasts so the wall is never empty.
insert into roasts (body, author_name, is_pinned, reply_body, reply_at) values
  ('bro really built a /lab page just to flex he can stream tokens',
   'Nandan (self-roast)', true,
   'guilty. it took 3 evenings and i refuse to take it down.',
   now()),
  ('the bento grid is fine but did you really need 4 different gradient styles',
   'Nandan (self-roast)', false, null, null),
  ('opened the terminal page expecting a gimmick. typed sudo hire-me. now i feel things.',
   'Nandan (self-roast)', false, null, null);
yes main