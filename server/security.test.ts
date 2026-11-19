import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { installSecurity, PrivateStore, verifyFirebaseToken } from './security';
import { validBookChapter } from './pdf';

test('Firebase tokens require a valid signature, project, Google identity and expiry', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(publicKey), kid: 'test' }] });
  const token = async (overrides: Record<string, unknown> = {}) => new SignJWT({ auth_time: Math.floor(Date.now() / 1000), email_verified: true, firebase: { sign_in_provider: 'google.com' }, ...overrides }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setSubject('alice').setIssuer('https://securetoken.google.com/project-a').setAudience('project-a').setIssuedAt().setExpirationTime('5m').sign(privateKey);
  assert.deepEqual(await verifyFirebaseToken(await token(), 'project-a', keys), { uid: 'alice', guest: false });
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

test('API blocks unauthenticated AI, forged cookies, cross-site changes and guest AI', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'prepapp-http-'));
  const app = express(); const store = installSecurity(app, directory);
  app.post('/api/ai/test', (_req, res) => res.json({ unexpected: true }));
  app.get('/api/ncert/notes/test', (_req, res) => res.json({ uid: res.locals.identity.uid }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}`;
  const headers = { 'Content-Type': 'application/json', 'X-DutyDeck-Request': '1' };
  try {
    assert.equal((await fetch(url + '/api/health')).status, 200);
    assert.equal((await fetch(url + '/api/ai/test', { method: 'POST', headers, body: '{}' })).status, 401);
    assert.equal((await fetch(url + '/api/session', { method: 'POST', headers: { ...headers, Origin: 'https://evil.example' }, body: '{}' })).status, 403);
    assert.equal((await fetch(url + '/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
    assert.equal((await fetch(url + '/api/ncert/notes/test', { headers: { Cookie: 'dutydeck=forged' } })).status, 401);
    const session = await fetch(url + '/api/session', { method: 'POST', headers, body: '{}' });
    assert.equal(session.status, 200);
    const cookieHeader = session.headers.get('set-cookie')!;
    assert.match(cookieHeader, /HttpOnly/); assert.match(cookieHeader, /SameSite=Lax/);
    const cookie = cookieHeader.split(';')[0];
    assert.equal((await fetch(url + '/api/ncert/notes/test', { headers: { Cookie: cookie } })).status, 200);
    assert.equal((await fetch(url + '/api/ai/test', { method: 'POST', headers: { ...headers, Cookie: cookie }, body: '{}' })).status, 403);
    assert.equal((await fetch(url + '/api/ai/test', { method: 'POST', headers: { ...headers, Authorization: 'Bearer forged.identity.token' }, body: '{}' })).status, 401);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); store.db.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('PDF routes reject path traversal and unknown or invalid textbook chapters', () => {
  assert.equal(validBookChapter('iesc1', '01'), true);
  for (const [book, chapter] of [['../../etc/passwd', '1'], ['iesc1', '../1'], ['zzzz1', '1'], ['iesc1', '999'], ['iesc1', '0']]) assert.equal(validBookChapter(book, chapter), false);
});
