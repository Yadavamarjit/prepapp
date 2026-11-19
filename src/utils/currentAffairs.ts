import type { RecallCard } from './dailyReview';
export const AFFAIR_TOPICS = ['Security', 'Governance', 'Economy', 'Environment', 'Science', 'International'] as const;
export interface AffairLesson { topic: typeof AFFAIR_TOPICS[number]; summary: string; why: string; facts: string[]; paper2: string; quiz: { question: string; options: string[]; answer: number; explanation: string; evidence: string }[]; }
export interface AffairStory { id: string; title: string; url: string; source: string; publishedAt: string; excerpt: string; topic: string; lesson?: AffairLesson; }
export interface AffairProgress { saved: string[]; read: string[]; missed: string[]; cards: RecallCard[]; }
export const AFFAIR_PROGRESS_KEY = 'dutydeck_current_affairs_v1';
export function emptyAffairProgress(): AffairProgress { return { saved: [], read: [], missed: [], cards: [] }; }
export function parseAffairProgress(raw: string | null): AffairProgress {
  try {
    const value = JSON.parse(raw || 'null'); if (!value || typeof value !== 'object') return emptyAffairProgress();
    const list = (input: unknown) => Array.isArray(input) ? [...new Set(input.filter((id): id is string => typeof id === 'string' && /^[a-f0-9]{24}$/.test(id)))].slice(0, 1000) : [];
    const saved = list(value.saved), missed = list(value.missed);
    const cards = Array.isArray(value.cards) ? value.cards.filter((card: RecallCard) => card && typeof card.id === 'string' && /^affair:[a-f0-9]{24}:\d$/.test(card.id) && [...saved, ...missed].some(id => card.id.startsWith(`affair:${id}:`)) && typeof card.prompt === 'string' && typeof card.answer === 'string' && typeof card.explanation === 'string' && typeof card.topic === 'string' && typeof card.subject === 'string' && typeof card.source === 'string' && Array.isArray(card.options) && card.options.every(option => typeof option === 'string') && Array.isArray(card.statements)).slice(0, 2000) : [];
    return { saved, missed, read: list(value.read), cards };
  } catch { return emptyAffairProgress(); }
}
export function enrollAffair(progress: AffairProgress, story: AffairStory, missed = false): AffairProgress {
  if (!story.lesson) return progress;
  const cards: RecallCard[] = story.lesson.quiz.map((quiz, index) => ({ id: `affair:${story.id}:${index}`, topic: story.title, subject: 'Current Affairs', prompt: quiz.question, statements: [], options: quiz.options, answer: quiz.options[quiz.answer], explanation: quiz.explanation, source: `${story.source} · ${story.publishedAt.slice(0, 10)} · ${story.url}`, isMistake: missed || progress.missed.includes(story.id) }));
  return { ...progress, saved: missed ? progress.saved : [...new Set([...progress.saved, story.id])], missed: missed ? [...new Set([...progress.missed, story.id])] : progress.missed, cards: [...progress.cards.filter(card => !card.id.startsWith(`affair:${story.id}:`)), ...cards] };
}
