import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { NCERT_STUDY_LIBRARY } from '../src/data/ncertCurriculum';
import { READING_BOOKS } from '../src/data/readingLibrary';

export function validBookChapter(bookCode: unknown, chapterNumber: unknown) {
  if (typeof bookCode !== 'string' || !/^[a-z]{4}[1-9]$/.test(bookCode) || !/^0?[1-9][0-9]?$/.test(String(chapterNumber))) return false;
  const full = READING_BOOKS.find(book => book.code === bookCode);
  if (full) return full.chapters.some(chapter => chapter.number === Number(chapterNumber));
  return NCERT_STUDY_LIBRARY.some(book => book.code === bookCode && book.chapters.some(chapter => chapter.chapterNumber === Number(chapterNumber)));
}
export const validateBookRequest: RequestHandler = (req, res, next) => {
  if (!validBookChapter(req.params.bookCode, req.params.chapterNumber)) return void res.status(400).json({ success: false, error: 'Invalid textbook or chapter' });
  next();
};
let activeWork = 0;
export const limitPdfWork: RequestHandler = (_req, res, next) => {
  if (activeWork >= 1) return void res.status(429).set('Retry-After', '5').json({ error: 'A chapter is being prepared. Please retry in a few seconds.' });
  activeWork++;
  let released = false;
  const release = () => { if (!released) { released = true; activeWork--; clearTimeout(timer); } };
  const timer = setTimeout(release, 135000); timer.unref();
  res.once('finish', release); next();
};
export function validPdf(filename: string) {
  try {
    const size = fs.statSync(filename).size;
    if (size < 1000 || size > 40 * 1024 * 1024) return false;
    const fd = fs.openSync(filename, 'r');
    try { const header = Buffer.alloc(5); fs.readSync(fd, header, 0, 5, 0); return header.toString() === '%PDF-'; }
    finally { fs.closeSync(fd); }
  } catch { return false; }
}
export async function ensurePdf(destination: string, name: string) {
  if (validPdf(destination)) return;
  if (!/^[a-z]{4}[1-9][0-9]{2}\.pdf$/.test(name)) throw new Error('Invalid textbook filename');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.part`;
  try {
    await promisify(execFile)(process.platform === 'win32' ? 'curl.exe' : 'curl', ['--fail', '--silent', '--show-error', '--location', '--proto', '=https', '--proto-redir', '=https', '--max-redirs', '3', '--max-time', '35', '--max-filesize', String(40 * 1024 * 1024), '--output', temporary, `https://ncert.nic.in/textbook/pdf/${name}`], { timeout: 40000, maxBuffer: 65536 });
    if (!validPdf(temporary)) throw new Error('The source did not return a valid PDF');
    fs.renameSync(temporary, destination);
  } finally { fs.rmSync(temporary, { force: true }); }
}
