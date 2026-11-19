import type { ChapterProgress, LearningChapter, MistakeRecord, Question } from '../types';

export type RecallRating = 'again' | 'unsure' | 'remembered';
export interface RecallProgress {
  stage: number;
  reviews: number;
  dueAt: number;
  lastReviewedAt: number;
  rating: RecallRating;
}
export type RecallProgressMap = Record<string, RecallProgress>;
export interface RecallCard {
  id: string;
  topic: string;
  subject: string;
  prompt: string;
  statements: string[];
  options: string[];
  answer: string;
  explanation: string;
  memoryHook?: string;
  source: string;
  chapterId?: string;
  isMistake: boolean;
}

const DAY = 86_400_000;
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
export const RECALL_STORAGE_KEY = 'dutydeck_daily_review_v1';

// Only studied chapters and attempted questions qualify. Adding questions to the
// bank alone must not silently enroll unrelated or unseen material.
export function buildRecallCards(
  chapters: LearningChapter[],
  chapterProgress: Record<string, ChapterProgress>,
  questions: Question[],
  solvedIds: string[],
  mistakes: MistakeRecord[],
): RecallCard[] {
  const cards: RecallCard[] = [];
  for (const chapter of chapters) {
    if (!chapterProgress[chapter.id]?.isCompleted) continue;
    chapter.comprehensionQuiz.forEach((quiz, index) => {
      if (!quiz.options[quiz.correctIndex]) return;
      cards.push({
        id: `chapter:${chapter.id}:${index}`,
        topic: chapter.chapterTitle,
        subject: chapter.subject,
        prompt: quiz.question,
        statements: [],
        options: quiz.options,
        answer: quiz.options[quiz.correctIndex],
        explanation: quiz.explanation,
        source: chapter.ncertBook,
        chapterId: chapter.id,
        isMistake: false,
      });
    });
  }
  const mistakeIds = new Set(mistakes.map(mistake => mistake.questionId));
  const attemptedIds = new Set([...solvedIds, ...mistakeIds]);
  const seenIds = new Set<string>();
  for (const question of questions) {
    if (!attemptedIds.has(question.id) || seenIds.has(question.id)) continue;
    seenIds.add(question.id);
    const answer = question.options.find(option => option.key === question.correctAnswer);
    if (!answer) continue;
    cards.push({
      id: `question:${question.id}`,
      topic: question.microTopic,
      subject: question.subject,
      prompt: question.questionText,
      statements: question.statements || [],
      options: question.options.map(option => `${option.key}. ${option.text}`),
      answer: `${answer.key}. ${answer.text}`,
      explanation: question.explanation.coreConcept,
      memoryHook: question.explanation.shortcutOrTrick,
      source: question.explanation.standardBookRef || 'Your practice question bank',
      isMistake: mistakeIds.has(question.id),
    });
  }
  return cards;
}

export function scheduleRecall(previous: RecallProgress | undefined, rating: RecallRating, now = Date.now()): RecallProgress {
  const stage = previous?.stage || 0;
  const nextStage = rating === 'again' ? 0 : rating === 'remembered' ? Math.min(stage + 1, REVIEW_INTERVAL_DAYS.length - 1) : stage;
  const delay = rating === 'again' ? 10 * 60_000 : rating === 'unsure' ? DAY : REVIEW_INTERVAL_DAYS[stage] * DAY;
  return {
    stage: nextStage,
    reviews: (previous?.reviews || 0) + 1,
    dueAt: now + delay,
    lastReviewedAt: now,
    rating,
  };
}

export function topicKey(card: Pick<RecallCard, 'subject' | 'topic'>): string {
  return JSON.stringify([card.subject, card.topic]);
}

export function getDueRecallCards(cards: RecallCard[], progress: RecallProgressMap, now = Date.now(), selectedTopic = ''): RecallCard[] {
  return cards.filter(card => (!selectedTopic || topicKey(card) === selectedTopic) &&
    (!progress[card.id] || progress[card.id].dueAt <= now))
    .sort((a, b) => Number(b.isMistake) - Number(a.isMistake) ||
      (progress[a.id]?.dueAt || 0) - (progress[b.id]?.dueAt || 0) || a.id.localeCompare(b.id));
}

// Reject damaged/older storage entries rather than allowing invalid dates to
// hide cards forever or invalid stages to break scheduling.
export function parseRecallProgress(raw: string | null): RecallProgressMap {
  try {
    const parsed: unknown = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const valid: RecallProgressMap = {};
    for (const [id, entry] of Object.entries(parsed)) {
      const value = entry as RecallProgress | null;
      if (value && Number.isInteger(value.stage) && value.stage >= 0 && value.stage < REVIEW_INTERVAL_DAYS.length &&
        Number.isInteger(value.reviews) && value.reviews > 0 && Number.isFinite(value.dueAt) &&
        Number.isFinite(value.lastReviewedAt) && ['again', 'unsure', 'remembered'].includes(value.rating)) {
        valid[id] = value;
      }
    }
    return valid;
  } catch {
    return {};
  }
}
