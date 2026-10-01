export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  // The Supabase project behind analytics, the roast wall, blog comments and the
  // contact inbox no longer exists. Off hides those features; turn it back on once
  // a database is restored.
  features: { supabase: false },
};
