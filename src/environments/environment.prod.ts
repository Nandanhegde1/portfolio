export const environment = {
  production: true,
  apiUrl: 'https://nandan-portfolio-api.vercel.app',
  features: {
    // The Supabase project behind analytics, blog comments and the contact inbox no
    // longer exists. Off hides those features; turn it back on once a database is
    // restored.
    supabase: false,
    // The blog is hidden until it has posts whose dates and numbers hold up. Off sends
    // /blog home and drops it from the nav; the posts stay in blog.component.ts.
    blog: false,
  },
};
