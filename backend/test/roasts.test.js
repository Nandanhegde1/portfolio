// GET /api/roasts when the database answers with an error. No network: the
// Supabase module is replaced before the app loads, with a client whose every
// query fails the way an unreachable or paused project does.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const failingQuery = {
  select: () => failingQuery,
  order: () => failingQuery,
  limit: async () => ({ data: null, error: { message: 'project unreachable' } }),
};
const supabasePath = require.resolve('../supabase');
require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { getSupabase: () => ({ from: () => failingQuery }) },
};

process.env.ALLOWED_ORIGINS = 'http://localhost:4200';
const app = require('../app');

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test('a failed read of the roast wall is a 503, not a 500', async () => {
  const res = await fetch(`${base}/api/roasts`);
  assert.equal(res.status, 503);
  assert.match(res.headers.get('content-type'), /application\/json/);
});
