# Pending Manual Actions

- [ ] **Supabase**, only to bring back analytics, blog comments and the contact inbox. The project behind them no longer exists and `features.supabase` is off. Create a project, run [backend/supabase-setup.sql](backend/supabase-setup.sql) and [backend/sql/blog_comments.sql](backend/sql/blog_comments.sql) in its SQL editor, set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in the Vercel project, then turn `features.supabase` on in both environment files.
- [ ] **Vercel**: remove `GEMINI_API_KEY` from the portfolio API project, plus `LLM_PROVIDER`, `GEMINI_MODEL`, `ANTHROPIC_API_KEY` and `DAILY_LLM_CALL_CAP` if they are set. Nothing in `backend/` reads them any more. Do not revoke the Gemini key itself: planning-desk uses the same key.
