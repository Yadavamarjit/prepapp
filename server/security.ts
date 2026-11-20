import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import type { JWTVerifyGetKey } from 'jose';
import { bearerToken, FIREBASE_PROJECT, PRIVATE_CACHE, sessionCookieName, sessionToken, verifyFirebaseToken } from '../shared/firebaseIdentity';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

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

export function installSecurity(app: Express, directory: string, keys?: JWTVerifyGetKey) {
  const production = process.env.NODE_ENV === 'production';
  const cookieName = sessionCookieName(production);
  const cookieOptions = { httpOnly: true, secure: production, sameSite: 'lax', path: '/' } as const;
  const project = process.env.FIREBASE_PROJECT_ID || FIREBASE_PROJECT;
  const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').filter(Boolean));
  const store = new PrivateStore(directory);
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' }, frameguard: false }));
  app.get('/api/health', (_req, res) => res.set('Cache-Control', 'no-store').json({ status: 'ok' }));
  app.use('/api', rateLimit({ windowMs: 60000, limit: 240, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', PRIVATE_CACHE);
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
  app.post('/api/session', rateLimit({ windowMs: 3600000, limit: 30, legacyHeaders: false }), async (req, res) => {
    const token = bearerToken(req.headers.authorization);
    try {
      const { expiresAt } = await verifyFirebaseToken(token, project, keys);
      const maxAge = expiresAt - Date.now();
      if (maxAge <= 0) throw new Error('Session expired');
      res.cookie(cookieName, token, { ...cookieOptions, maxAge }).json({ authenticated: true });
    } catch {
      res.status(401).json({ error: 'Sign in with Google to start a secure session.' });
    }
  });

  app.delete('/api/session', (_req, res) => {
    res.clearCookie(cookieName, cookieOptions).status(204).end();
  });

  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization
        ? bearerToken(req.headers.authorization)
        : sessionToken(req.headers.cookie, production);
      res.locals.identity = await verifyFirebaseToken(token, project, keys);
      next();
    } catch {
      res.status(401).json({ success: false, error: 'Please sign in to continue.' });
    }
  };

  app.use('/api', authenticate);
  const paidRoutes = ['/api/ai', '/api/current-affairs/:id/learn'];
  app.use(paidRoutes, rateLimit({ windowMs: 60000, limit: 6, keyGenerator: (_req, res) => res.locals.identity.uid, standardHeaders: 'draft-8', legacyHeaders: false }), (_req, res, next) => {
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
