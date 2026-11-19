import { REEL_COURSES, type ReelChapter, type ReelLesson } from '../data/learningReels';
import type { RecallCard } from './dailyReview';

export const REELS_STORAGE_KEY = 'dutydeck_learning_reels_v1';
export interface ReelsProgress {
  passed: string[];
  saved: string[];
  missed: string[];
  positions: Record<string, string>;
}
export type ReelItem =
  | { id: string; kind: 'lesson'; lesson: ReelLesson }
  | { id: string; kind: 'check'; lessons: ReelLesson[] }
  | { id: string; kind: 'complete' };
export const emptyReelsProgress = (): ReelsProgress => ({ passed: [], saved: [], missed: [], positions: {} });
export const chapterComplete = (chapter: ReelChapter, progress: ReelsProgress) => chapter.lessons.every(lesson => progress.passed.includes(lesson.id));

export function chapterUnlocked(chapterId: string, progress: ReelsProgress): boolean {
  const course = REEL_COURSES.find(item => item.chapters.some(chapter => chapter.id === chapterId));
  const index = course?.chapters.findIndex(chapter => chapter.id === chapterId) ?? -1;
  return !!course && index >= 0 && course.chapters.slice(0, index).every(chapter => chapterComplete(chapter, progress));
}

// Stop the scroll at an unanswered check. A later chapter cannot be entered
// through a saved position or a manually constructed URL.
export function reelFeed(chapter: ReelChapter, progress: ReelsProgress): ReelItem[] {
  if (!chapterUnlocked(chapter.id, progress)) return [];
  const items: ReelItem[] = [];
  for (let start = 0; start < chapter.lessons.length; start += 3) {
    const group = chapter.lessons.slice(start, start + 3);
    items.push(...group.map(lesson => ({ id: lesson.id, kind: 'lesson' as const, lesson })));
    items.push({ id: `${chapter.id}-check-${start}`, kind: 'check', lessons: group });
    if (!group.every(lesson => progress.passed.includes(lesson.id))) return items;
  }
  items.push({ id: `${chapter.id}-complete`, kind: 'complete' });
  return items;
}

export function answerReel(progress: ReelsProgress, chapter: ReelChapter, lessonId: string, option: number): ReelsProgress {
  const check = reelFeed(chapter, progress).find(item => item.kind === 'check' && item.lessons.some(lesson => !progress.passed.includes(lesson.id)));
  if (!check || check.kind !== 'check') return progress;
  const question = check.lessons.find(lesson => !progress.passed.includes(lesson.id));
  if (!question || question.id !== lessonId || !Number.isInteger(option) || !question.options[option]) return progress;
  if (option !== question.answer) return { ...progress, missed: [...new Set([...progress.missed, question.id])] };
  return { ...progress, passed: [...progress.passed, question.id] };
}

export function parseReelsProgress(raw: string | null): ReelsProgress {
  const clean = emptyReelsProgress();
  try {
    const data = JSON.parse(raw || 'null');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return clean;
    const ids = new Set(REEL_COURSES.flatMap(course => course.chapters.flatMap(chapter => chapter.lessons.map(lesson => lesson.id))));
    const list = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && ids.has(id)))] : [];
    const passed = list(data.passed);
    // A valid course has a prefix of passed questions; drop corrupt out-of-order entries.
    for (const course of REEL_COURSES) {
      for (const lesson of course.chapters.flatMap(chapter => chapter.lessons)) {
        if (!passed.includes(lesson.id)) break;
        clean.passed.push(lesson.id);
      }
    }
    const availableIds = new Set(REEL_COURSES.flatMap(course => course.chapters.flatMap(chapter => reelFeed(chapter, clean).filter(item => item.kind === 'lesson').map(item => item.id))));
    clean.saved = list(data.saved).filter(id => availableIds.has(id));
    clean.missed = list(data.missed).filter(id => availableIds.has(id));
    for (const chapter of REEL_COURSES.flatMap(course => course.chapters)) {
      const position = data.positions?.[chapter.id];
      if (typeof position === 'string' && reelFeed(chapter, clean).some(item => item.id === position)) clean.positions[chapter.id] = position;
    }
  } catch { /* Malformed storage should open a usable, empty course. */ }
  return clean;
}

export function buildReelRecallCards(progress: ReelsProgress): RecallCard[] {
  return REEL_COURSES.flatMap(course => course.chapters.flatMap(chapter => chapter.lessons
    .filter(lesson => progress.saved.includes(lesson.id) || progress.missed.includes(lesson.id))
    .map(lesson => ({
      id: `reel:${lesson.id}`, topic: chapter.title, subject: course.subject,
      prompt: lesson.question, statements: [], options: lesson.options,
      answer: lesson.options[lesson.answer], explanation: lesson.explanation,
      memoryHook: lesson.takeaway, source: `${course.book} · Chapter ${chapter.number}`,
      isMistake: progress.missed.includes(lesson.id),
    }))));
}
