import { INITIAL_QUESTION_BANK } from '../data/questionBank';
import type { QuestionOption } from '../types';

export type Option = QuestionOption['key'];
export const paper = INITIAL_QUESTION_BANK.filter(q => q.targetExam.includes('UPSC_CAPF') && q.subject !== 'English Comprehension');
export type Response = { choice?: Option; crossed?: Option[] };
export type Attempt = {
  ids: string[]; index: number; deadline: number; finished: boolean;
  answers: Record<string, Response>; drill: boolean;
};

export function startAttempt(ids: string[], drill: boolean, now = Date.now()): Attempt {
  return { ids, index: 0, deadline: now + ids.length * 60_000, answers: {}, finished: false, drill };
}

export function report(a: Attempt) {
  const questions = paper.filter(q => a.ids.includes(q.id));
  const missed = questions.filter(q => a.answers[q.id]?.choice !== q.correctAnswer);
  const wrong = missed.filter(q => a.answers[q.id]?.choice);
  const correct = questions.length - missed.length;
  const eliminated = questions.filter(q => a.answers[q.id]?.crossed?.length);
  return {
    correct, wrong: wrong.length, skipped: missed.length - wrong.length,
    net: (correct * 6 - wrong.length * 2) / 3, penalty: wrong.length * 2 / 3,
    eliminated: eliminated.length,
    crossedKey: eliminated.filter(q => a.answers[q.id].crossed?.includes(q.correctAnswer)).length,
    missed
  };
}

export function validAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object') return false;
  const a = value as Attempt;
  const option = (v: unknown) => ['A', 'B', 'C', 'D'].includes(String(v));
  return Array.isArray(a.ids) && a.ids.length > 0 && new Set(a.ids).size === a.ids.length &&
    a.ids.every(id => paper.some(q => q.id === id)) && Number.isInteger(a.index) &&
    a.index >= 0 && a.index < a.ids.length && Number.isFinite(a.deadline) &&
    typeof a.drill === 'boolean' && typeof a.finished === 'boolean' &&
    !!a.answers && typeof a.answers === 'object' && Object.values(a.answers).every(r =>
      r && (!r.choice || option(r.choice)) && (!r.crossed || (Array.isArray(r.crossed) && r.crossed.every(option))));
}

export const attemptKey = (uid: string) => "capf-analytica-v1:" + uid;
type RecordBook = { current: Attempt | null; scores: number[] };

export function loadAttemptBook(key: string): RecordBook {
  try {
    const data = JSON.parse(localStorage.getItem(key) || 'null');
    if (data && (data.current === null || validAttempt(data.current)) &&
      Array.isArray(data.scores) && data.scores.every(Number.isFinite)) {
      const a = data.current;
      if (a && !a.finished && a.deadline <= Date.now()) {
        return { current: { ...a, finished: true }, scores: a.drill ? data.scores : [...data.scores, report(a).net] };
      }
      return data;
    }
  } catch { /* Start a new record if this browser has no readable history. */ }
  return { current: null, scores: [] };
}
