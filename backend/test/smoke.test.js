// Smoke tests: boot the real app on an ephemeral port and hit it with fetch.
// Run: npm test (node --test)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

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

test('GET /api/health returns 200 JSON', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/json/);
});

test('unknown routes 404 as JSON, not an HTML error page', async () => {
  const res = await fetch(`${base}/no/such/route`);
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await res.json(), { error: 'Not found' });
});

test('malformed JSON body returns a JSON 400', async () => {
  const res = await fetch(`${base}/api/roasts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not json',
  });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'Invalid JSON body' });
});

test('security headers from helmet are present', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('admin endpoints reject a missing token', async () => {
  process.env.ADMIN_TOKEN = 'test-secret';
  const res = await fetch(`${base}/api/admin/anything`);
  assert.equal(res.status, 401);
});
