# Pending Manual Actions

- [ ] **Supabase**, only to bring back analytics, the roast wall, blog comments and the contact inbox. The project behind them no longer exists and `features.supabase` is off. Create a project, run [backend/supabase-setup.sql](backend/supabase-setup.sql), [backend/sql/roasts.sql](backend/sql/roasts.sql) and [backend/sql/blog_comments.sql](backend/sql/blog_comments.sql) in its SQL editor, set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in the Vercel project, then turn `features.supabase` on in both environment files.
