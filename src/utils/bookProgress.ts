import { READING_BOOKS } from '../data/readingLibrary';

export interface BookProgress {
  chapter: number;
  page: number;
  completed: number[];
  updatedAt: number;
}
export type BookProgressMap = Record<string, BookProgress>;
export const BOOK_PROGRESS_KEY = 'dutydeck_book_reading_v1';

export function parseBookProgress(raw: string | null): BookProgressMap {
  try {
    const data = JSON.parse(raw || '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const valid: BookProgressMap = {};
    for (const book of READING_BOOKS) {
      const entry = data[book.code];
      if (!entry || !book.chapters.some(chapter => chapter.number === entry.chapter) ||
        !Number.isInteger(entry.page) || entry.page < 1 || !Number.isFinite(entry.updatedAt)) continue;
      valid[book.code] = {
        chapter: entry.chapter, page: entry.page, updatedAt: entry.updatedAt,
        completed: Array.isArray(entry.completed) ? [...new Set<number>(entry.completed.filter((number: number) => book.chapters.some(chapter => chapter.number === number)))] : [],
      };
    }
    return valid;
  } catch { return {}; }
}

export function recordBookPosition(progress: BookProgressMap, code: string, chapter: number, page: number, now = Date.now()): BookProgressMap {
  if (!READING_BOOKS.some(book => book.code === code && book.chapters.some(item => item.number === chapter)) || !Number.isInteger(page) || page < 1) return progress;
  return { ...progress, [code]: { chapter, page, completed: progress[code]?.completed || [], updatedAt: now } };
}

export function toggleBookChapter(progress: BookProgressMap, code: string, chapter: number, page: number): BookProgressMap {
  const next = recordBookPosition(progress, code, chapter, page);
  if (next === progress) return progress;
  const completed = next[code].completed;
  return { ...next, [code]: { ...next[code], completed: completed.includes(chapter) ? completed.filter(number => number !== chapter) : [...completed, chapter] } };
}
