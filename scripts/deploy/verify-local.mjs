import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
const data = path.resolve('build/smoke-data');
fs.mkdirSync(path.join(data, 'ncert_textbooks'), { recursive: true });
fs.copyFileSync('data/ncert_textbooks/iesc101.pdf', path.join(data, 'ncert_textbooks/iesc101.pdf'));
const child = spawn(process.execPath, ['build/server.mjs'], { env: { ...process.env, NODE_ENV: 'production', API_ONLY: 'true', HOST: '127.0.0.1', PORT: '3107', DATA_DIR: data, FIREBASE_PROJECT_ID: 'gen-lang-client-0456258653', SESSION_SECRET: randomBytes(48).toString('hex') }, stdio: ['ignore', 'pipe', 'pipe'] });
let diagnostics = '';
child.stdout.on('data', value => { diagnostics += value.toString(); });
child.stderr.on('data', value => { diagnostics += value.toString(); });
try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try { ready = (await fetch('http://127.0.0.1:3107/api/health')).ok; } catch {}
    if (ready) break;
    if (child.exitCode !== null) throw new Error('Backend failed to start: ' + diagnostics);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error('Backend startup timed out: ' + diagnostics);
  await import('./verify-api.mjs');
  const result = await fetch('http://127.0.0.1:3107/api/ncert/pdf-rendered-pages/iesc1/1', { signal: AbortSignal.timeout(110000) });
  const pages = await result.json();
  if (!result.ok || !pages.success || !pages.pages?.length) throw new Error('PDF rendering check failed: ' + JSON.stringify(pages));
  console.log(`PASS: native PDF rendering returned ${pages.totalPages} pages.`);
} finally { child.kill(); }
