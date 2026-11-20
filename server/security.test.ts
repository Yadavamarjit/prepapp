import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { installSecurity, PrivateStore } from './security';
import { FIREBASE_PROJECT, verifyFirebaseToken } from '../shared/firebaseIdentity';
import { pageAccess } from '../shared/pageAccess';
import { afterLogin } from '../shared/authRoutes';
import { validBookChapter } from './pdf';

test('Firebase tokens require a valid signature, project, Google identity and expiry', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(publicKey), kid: 'test' }] });
  const token = async (overrides: Record<string, unknown> = {}) => new SignJWT({ auth_time: Math.floor(Date.now() / 1000), email_verified: true, firebase: { sign_in_provider: 'google.com' }, ...overrides }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setSubject('alice').setIssuer('https://securetoken.google.com/project-a').setAudience('project-a').setIssuedAt().setExpirationTime('5m').sign(privateKey);
  const identity = await verifyFirebaseToken(await token(), 'project-a', keys);
  assert.equal(identity.uid, 'alice');
  assert.ok(identity.expiresAt > Date.now());
  await assert.rejects(verifyFirebaseToken(await token(), 'project-b', keys));
  await assert.rejects(verifyFirebaseToken(await token({ email_verified: false }), 'project-a', keys));
  await assert.rejects(verifyFirebaseToken(await token({ firebase: { sign_in_provider: 'anonymous' } }), 'project-a', keys));
  await assert.rejects(verifyFirebaseToken(await token({ auth_time: Date.now() }), 'project-a', keys));
  const expired = await new SignJWT({ auth_time: 1 }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setSubject('alice').setIssuer('https://securetoken.google.com/project-a').setAudience('project-a').setIssuedAt(1).setExpirationTime(2).sign(privateKey);
  await assert.rejects(verifyFirebaseToken(expired, 'project-a', keys));
  const other = await generateKeyPair('RS256');
  const forged = await new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setSubject('alice').setIssuer('https://securetoken.google.com/project-a').setAudience('project-a').setExpirationTime('5m').sign(other.privateKey);
  await assert.rejects(verifyFirebaseToken(forged, 'project-a', keys));
});

test('notes are isolated by owner and daily quotas persist across restarts', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'prepapp-store-'));
  const first = new PrivateStore(directory);
  try {
    assert.equal(first.save('alice', { id: 'one', bookCode: 'iesc1', chapterNumber: 1, content: 'private' }), true);
    assert.equal(first.list('bob', 'iesc1', 1).length, 0);
    assert.equal(first.delete('bob', 'one'), 0);
    first.clear('bob', 'iesc1', 1);
    assert.equal(first.list('alice', 'iesc1', 1).length, 1);
    assert.equal(first.consumeAI('alice', 1, 2), true);
    assert.equal(first.consumeAI('alice', 1, 2), false);
    const reopened = new PrivateStore(directory);
    try {
      assert.equal(reopened.consumeAI('alice', 1, 2), false);
      assert.equal(reopened.consumeAI('bob', 1, 2), true);
      assert.equal(reopened.consumeAI('eve', 1, 2), false);
    } finally { reopened.db.close(); }
  } finally { first.db.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('secure sessions gate study APIs and frontend assets', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(publicKey), kid: 'test' }] });
  const token = await new SignJWT({ auth_time: Math.floor(Date.now() / 1000), email_verified: true, firebase: { sign_in_provider: 'google.com' } })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' }).setSubject('alice').setIssuer(`https://securetoken.google.com/${FIREBASE_PROJECT}`)
    .setAudience(FIREBASE_PROJECT).setIssuedAt().setExpirationTime('5m').sign(privateKey);
  const directory = mkdtempSync(path.join(tmpdir(), 'prepapp-http-'));
  const app = express();
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const store = installSecurity(app, directory, keys);
  if (previousEnvironment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnvironment;
  app.post('/api/ai/test', (_req, res) => res.json({ uid: res.locals.identity.uid }));
  app.get('/api/ncert/books', (_req, res) => res.json({ uid: res.locals.identity.uid }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}`;
  const headers = { 'Content-Type': 'application/json', 'X-DutyDeck-Request': '1' };
  const authorization = 'Bearer ' + token;
  try {
    assert.equal((await fetch(url + '/api/health')).status, 200);
    assert.equal((await fetch(url + '/api/session', { method: 'POST', headers, body: '{}' })).status, 401);
    assert.equal((await fetch(url + '/api/session', { method: 'POST', headers: { ...headers, Authorization: authorization, Origin: 'https://cross-site.invalid' }, body: '{}' })).status, 403);
    assert.equal((await fetch(url + '/api/ncert/books')).status, 401);
    assert.equal((await fetch(url + '/api/ncert/books', { headers: { Cookie: '__Host-dutydeck=legacy-guest' } })).status, 401);
    assert.equal((await fetch(url + '/api/ai/test', { method: 'POST', headers, body: '{}' })).status, 401);

    const session = await fetch(url + '/api/session', { method: 'POST', headers: { ...headers, Authorization: authorization }, body: '{}' });
    assert.equal(session.status, 200);
    assert.deepEqual(await session.json(), { authenticated: true });
    const setCookie = session.headers.get('set-cookie')!;
    assert.match(setCookie, /^__Host-cadetslate-session=/);
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(setCookie.includes(flag));
    assert.ok(!setCookie.includes('Domain='));
    const cookie = setCookie.split(';')[0];
    const catalog = await fetch(url + '/api/ncert/books', { headers: { Cookie: cookie } });
    assert.equal(catalog.status, 200);
    assert.deepEqual(await catalog.json(), { uid: 'alice' });
    const ai = await fetch(url + '/api/ai/test', { method: 'POST', headers: { ...headers, Authorization: authorization }, body: '{}' });
    assert.equal(ai.status, 200);
    assert.equal(ai.headers.get('cache-control'), 'private, no-store');
    const cleared = await fetch(url + '/api/session', { method: 'DELETE', headers: { ...headers, Cookie: cookie } });
    assert.equal(cleared.status, 204);
    assert.match(cleared.headers.get('set-cookie')!, /^__Host-cadetslate-session=;/);

    const gate = (path: string, cookieHeader?: string) => pageAccess(new URL(path, url), cookieHeader, true,
      value => verifyFirebaseToken(value, FIREBASE_PROJECT, keys));
    assert.deepEqual(await gate('/dashboard?view=today'), { denied: 302, location: '/login?next=%2Fdashboard%3Fview%3Dtoday' });
    assert.deepEqual(await gate('/index.html'), { denied: 302, location: '/login?next=%2Findex.html' });
    assert.deepEqual(await gate('/'), { public: true });
    assert.deepEqual(await gate('/login'), { public: true });
    assert.deepEqual(await gate('/capf-study-hero.webp'), { public: true });
    assert.deepEqual(await gate('/capf-study-hero-mobile.webp'), { public: true });
    assert.deepEqual(await gate('/assets/App-abc123.css'), { denied: 401 });
    assert.deepEqual(await gate('/assets/site-entry-abc123.js'), { public: true });
    assert.deepEqual(await gate('/assets/App-abc123.js'), { denied: 401 });
    assert.deepEqual(await gate('/upsc_capf_complete_syllabus.json'), { denied: 401 });
    assert.deepEqual(await gate('/books', '__Host-cadetslate-session=invalid'), { denied: 302, location: '/login?next=%2Fbooks' });
    assert.deepEqual(await gate('/books', cookie), { public: false });
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); store.db.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('sign-in returns to an internal page only', () => {
  assert.equal(afterLogin('/books/iesc1/1?mode=read#page'), '/books/iesc1/1?mode=read#page');
  for (const path of ['https://external.invalid', '//external.invalid', '/\\external.invalid', '/login', '/api/ncert/books', '/assets/App.js']) {
    assert.equal(afterLogin(path), '/', path);
  }
});

test('PDF routes reject path traversal and unknown or invalid textbook chapters', () => {
  assert.equal(validBookChapter('iesc1', '01'), true);
  for (const [book, chapter] of [['../../etc/passwd', '1'], ['iesc1', '../1'], ['zzzz1', '1'], ['iesc1', '999'], ['iesc1', '0']]) assert.equal(validBookChapter(book, chapter), false);
});
