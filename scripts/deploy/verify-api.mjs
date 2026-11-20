import assert from 'node:assert/strict';

const origin = process.env.API_BASE_URL || 'http://127.0.0.1:3107';
const request = (pathname, options = {}) => fetch(origin + pathname, { ...options, redirect: 'manual', signal: AbortSignal.timeout(110000) });
const headers = { 'Content-Type': 'application/json', 'X-DutyDeck-Request': '1' };

assert.equal((await request('/api/health')).status, 200);
for (const pathname of [
  '/api/ncert/books', '/api/ncert/notes/iesc1/1',
  '/api/ncert/pdf/iesc1/1', '/api/ncert/pdf-rendered-pages/iesc1/1',
  '/api/ncert/page-image/iesc1/01/page-1.png', '/api/current-affairs',
]) {
  const response = await request(pathname);
  assert.equal(response.status, 401, pathname);
  assert.match(response.headers.get('cache-control'), /no-store/);
}
assert.equal((await request('/api/ai/text-action', { method: 'POST', headers, body: '{}' })).status, 401);
assert.equal((await request('/api/session', { method: 'POST', headers, body: '{}' })).status, 401);
assert.equal((await request('/api/session', { method: 'POST', headers: { ...headers, Origin: 'https://cross-site.invalid' }, body: '{}' })).status, 403);
console.log('PASS: health remains available and all study APIs require authentication.');

const token = process.env.CADETSLATE_TEST_ID_TOKEN;
if (token) {
  const session = await request('/api/session', { method: 'POST', headers: { ...headers, Authorization: `Bearer ${token}` }, body: '{}' });
  assert.equal(session.status, 200);
  assert.deepEqual(await session.json(), { authenticated: true });
  const cookie = session.headers.getSetCookie()[0];
  assert.match(cookie, /^__Host-cadetslate-session=/);
  for (const flag of ['Secure', 'HttpOnly', 'SameSite=Lax']) assert.ok(cookie.includes(flag));
  const authenticated = { headers: { ...headers, Cookie: cookie.split(';')[0] } };
  const catalog = await request('/api/ncert/books', authenticated);
  assert.equal(catalog.status, 200);
  assert.ok((await catalog.json()).books.length);
  const pdf = await request('/api/ncert/pdf/iesc1/1', authenticated);
  assert.equal(pdf.status, 200);
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
  const rendered = await request('/api/ncert/pdf-rendered-pages/iesc1/1', authenticated);
  assert.equal(rendered.status, 200);
  const data = await rendered.json();
  assert.ok(data.pages?.[0]?.blocks.length);
  const image = await request(data.pages[0].imagePath, authenticated);
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /image\/png/);
  await image.arrayBuffer();
  assert.equal((await request('/api/session', { ...authenticated, method: 'DELETE' })).status, 204);
  console.log('PASS: verified session cookie, authenticated catalog, PDF, rendered page image and sign-out.');
}
