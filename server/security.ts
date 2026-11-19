import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTVerifyGetKey } from 'jose';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export interface Identity { uid: string; guest: boolean; }
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export async function verifyFirebaseToken(token: string, project: string, keys: JWTVerifyGetKey = googleKeys): Promise<Identity> {
  const { payload } = await jwtVerify(token, keys, {
    algorithms: ['RS256'], audience: project, issuer: `https://securetoken.google.com/${project}`,
    requiredClaims: ['exp', 'iat', 'auth_time', 'sub'], clockTolerance: 5,
  });
  if (!payload.sub || payload.sub.length > 128 || typeof payload.iat !== 'number' || payload.iat > Date.now() / 1000 + 5 || typeof payload.auth_time !== 'number' || payload.auth_time < 0 || payload.auth_time > Date.now() / 1000 + 5) throw new Error('Invalid identity');
  if ((payload.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider !== 'google.com' || payload.email_verified !== true) throw new Error('Google sign-in is required');
  return { uid: payload.sub, guest: false };
}

export class PrivateStore {
  readonly db: DatabaseSync;
  constructor(directory: string) {
    fs.mkdirSync(directory, { recursive: true });
    this.db = new DatabaseSync(path.join(directory, 'private.sqlite'));
    this.db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, owner TEXT NOT NULL, book TEXT NOT NULL, chapter INTEGER NOT NULL, data TEXT NOT NULL); CREATE INDEX IF NOT EXISTS notes_owner ON notes(owner, book, chapter); CREATE TABLE IF NOT EXISTS ai_usage (day TEXT NOT NULL, owner TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(day, owner));");
  }
  list(owner: string, book: string, chapter: number) { return this.db.prepare('SELECT data FROM notes WHERE owner=? AND book=? AND chapter=? ORDER BY rowid DESC').all(owner, book, chapter).map((row: any) => JSON.parse(row.data)); }
  save(owner: string, note: any) {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM notes WHERE owner=?').get(owner) as { count: number };
    if (row.count >= 500) return false;
    this.db.prepare('INSERT INTO notes VALUES (?, ?, ?, ?, ?)').run(note.id, owner, note.bookCode, note.chapterNumber, JSON.stringify(note)); return true;
  }
  delete(owner: string, id: string) { return Number(this.db.prepare('DELETE FROM notes WHERE owner=? AND id=?').run(owner, id).changes); }
  clear(owner: string, book: string, chapter: number) { this.db.prepare('DELETE FROM notes WHERE owner=? AND book=? AND chapter=?').run(owner, book, chapter); }
  consumeAI(owner: string, userLimit: number, globalLimit: number, now = new Date()) {
    const day = now.toISOString().slice(0, 10);
    const user = this.db.prepare('SELECT count FROM ai_usage WHERE day=? AND owner=?').get(day, owner) as { count: number } | undefined;
    const total = this.db.prepare('SELECT SUM(count) AS count FROM ai_usage WHERE day=?').get(day) as { count: number | null };
    if ((user?.count || 0) >= userLimit || (total.count || 0) >= globalLimit) return false;
    this.db.prepare('INSERT INTO ai_usage VALUES (?, ?, 1) ON CONFLICT(day, owner) DO UPDATE SET count=count+1').run(day, owner);
    this.db.prepare('DELETE FROM ai_usage WHERE day < ?').run(new Date(now.getTime() - 32 * 86400000).toISOString().slice(0, 10)); return true;
  }
}

export function installSecurity(app: Express, directory: string) {
  const production = process.env.NODE_ENV === 'production';
  if (production && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 48 || !process.env.FIREBASE_PROJECT_ID)) throw new Error('Production authentication configuration is missing');
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET || randomBytes(48).toString('hex'));
  const project = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0456258653';
  const cookieName = production ? '__Host-dutydeck' : 'dutydeck';
  const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').filter(Boolean));
  const store = new PrivateStore(directory);
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' }, frameguard: false }));
  app.get('/api/health', (_req, res) => res.set('Cache-Control', 'no-store').json({ status: 'ok' }));
  app.use('/api', rateLimit({ windowMs: 60000, limit: 240, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if ((req.headers.origin && !allowedOrigins.has(req.headers.origin)) || req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'Request origin is not allowed.' });
      if (req.headers['x-dutydeck-request'] !== '1' && !req.headers.authorization) return res.status(403).json({ error: 'A same-origin API request is required.' });
      if (req.method === 'POST' && !req.is('application/json')) return res.status(415).json({ error: 'Send a JSON request.' });
    }
    next();
  });
  app.use(express.json({ limit: '256kb', strict: true }));
  app.use('/api', (req, res, next) => {
    const valid = (value: unknown, depth = 0): boolean => {
      if (depth > 10) return false;
      if (typeof value === 'string') return value.length <= 24000;
      if (Array.isArray(value)) return value.length <= 500 && value.every(item => valid(item, depth + 1));
      if (value && typeof value === 'object') return Object.keys(value).length <= 100 && Object.entries(value).every(([key, item]) => !['__proto__', 'constructor', 'prototype'].includes(key) && valid(item, depth + 1));
      return true;
    };
    if (req.body && !valid(req.body)) return res.status(400).json({ error: 'Request values exceed allowed limits.' });
    next();
  });
  app.post('/api/session', rateLimit({ windowMs: 3600000, limit: 30, legacyHeaders: false }), async (req, res, next) => {
    try {
      let uid: string | undefined;
      const token = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
      if (token) { try { const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'], issuer: 'dutydeck', audience: 'guest' }); uid = payload.sub; } catch {} }
      uid ||= `guest:${randomBytes(24).toString('hex')}`;
      const signed = await new SignJWT({ guest: true }).setProtectedHeader({ alg: 'HS256' }).setSubject(uid).setIssuer('dutydeck').setAudience('guest').setIssuedAt().setExpirationTime('7d').sign(secret);
      res.cookie(cookieName, signed, { httpOnly: true, secure: production, sameSite: 'lax', path: '/', maxAge: 7 * 86400000 });
      res.json({ success: true });
    } catch (error) { next(error); }
  });
  app.delete('/api/session', (_req, res) => { res.clearCookie(cookieName, { httpOnly: true, secure: production, sameSite: 'lax', path: '/' }); res.json({ success: true }); });
  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bearer = req.headers.authorization;
      if (bearer) {
        if (!/^Bearer [A-Za-z0-9_.-]{20,10000}$/.test(bearer)) throw new Error('Invalid bearer');
        res.locals.identity = await verifyFirebaseToken(bearer.slice(7), project);
      } else {
        const token = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
        if (!token) throw new Error('Missing session');
        const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'], issuer: 'dutydeck', audience: 'guest' });
        if (!payload.sub?.startsWith('guest:') || payload.guest !== true) throw new Error('Invalid guest');
        res.locals.identity = { uid: payload.sub, guest: true };
      }
      next();
    } catch { res.status(401).json({ success: false, error: 'Please sign in again to continue.' }); }
  };
  app.use('/api/ncert/notes', authenticate);
  const paidRoutes = ['/api/ai', '/api/current-affairs/:id/learn'];
  app.use(paidRoutes, authenticate, (req, res, next) => {
    const identity = res.locals.identity as Identity;
    if (identity.guest) return res.status(403).json({ error: 'Sign in with Google to use AI features. Guest reading remains available.' });
    next();
  }, rateLimit({ windowMs: 60000, limit: 6, keyGenerator: (_req, res) => res.locals.identity.uid, standardHeaders: 'draft-8', legacyHeaders: false }), (_req, res, next) => {
    if (!store.consumeAI(res.locals.identity.uid, Number(process.env.AI_USER_DAILY_LIMIT) || 30, Number(process.env.AI_GLOBAL_DAILY_LIMIT) || 100)) return res.status(429).json({ error: 'The daily AI request limit has been reached. Please try tomorrow.' });
    next();
  });
  let activeAI = 0;
  app.use(paidRoutes, (_req, res, next) => {
    if (activeAI >= 2) return res.status(429).json({ error: 'The tutor is busy. Please try again shortly.' });
    activeAI++;
    let released = false; const release = () => { if (!released) { released = true; activeAI--; } };
    res.once('finish', release); res.once('close', release); next();
  });
  return store;
}
