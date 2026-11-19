import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
const target = path.resolve('build/backend');
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync('build/server.mjs', path.join(target, 'server.mjs'));
const dependencies = Object.fromEntries(['express', 'dotenv', '@google/genai', 'jose', 'helmet', 'express-rate-limit'].map(name => [name, JSON.parse(fs.readFileSync(path.join('node_modules', name, 'package.json'), 'utf8')).version]));
fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name: 'dutydeck-api', private: true, type: 'module', engines: { node: '24.x' }, dependencies }, null, 2) + '\n');
const variables = dotenv.parse(fs.readFileSync('.env'));
const permitted = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'OPENAI_PLANNER_MODEL', 'OPENAI_CURRENT_AFFAIRS_MODEL', 'OPENAI_TUTOR_MODEL', 'GEMINI_MODEL'];
const lines = [];
for (const name of permitted) {
  const value = variables[name];
  if (value && /^[A-Za-z0-9_./:-]+$/.test(value)) lines.push(`${name}=${value}`);
}
fs.writeFileSync('build/backend.keys.env', lines.join('\n') + '\n');
console.log(JSON.stringify({ dependencies, configuredProviders: { openai: !!variables.OPENAI_API_KEY, gemini: !!variables.GEMINI_API_KEY } }));
