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
  ('Your bento grid has more cards than my last project had requirements.',
   'Nandan (self-roast)', true,
   'Fair. I got carried away. Three of them are getting cut next sprint.',
   now()),
  ('If I see one more "powered by AI" portfolio I''m switching careers.',
   'Nandan (self-roast)', false, null, null),
  ('The terminal command palette is showing off and I respect it.',
   'Nandan (self-roast)', false, null, null);
yes main