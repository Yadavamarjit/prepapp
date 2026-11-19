import test from 'node:test';
import assert from 'node:assert/strict';
import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { INITIAL_QUESTION_BANK } from '../data/questionBank';
import type { MistakeRecord } from '../types';
import { buildRecallCards, getDueRecallCards, parseRecallProgress, scheduleRecall, topicKey } from './dailyReview';
import type { RecallProgress } from './dailyReview';

const DAY = 86_400_000;
const now = 1_800_000_000_000;
const chapter = LEARNING_CHAPTERS[0];
const question = INITIAL_QUESTION_BANK[0];
const mistake: MistakeRecord = {
  id: 'mistake', questionId: question.id, selectedAnswer: 'A', correctAnswer: question.correctAnswer,
  timeSpentSeconds: 30, timestamp: now, reviewCount: 0, nextReviewDate: now + DAY,
};

test('unread chapters and unseen questions do not enter the review queue', () => {
  assert.deepEqual(buildRecallCards(LEARNING_CHAPTERS, {}, INITIAL_QUESTION_BANK, [], []), []);
});

test('completing a chapter enrolls only its quizzes and uses their real answer and explanation', () => {
  const cards = buildRecallCards(LEARNING_CHAPTERS, { [chapter.id]: { chapterId: chapter.id, isCompleted: true } }, INITIAL_QUESTION_BANK, [], []);
  assert.equal(cards.length, chapter.comprehensionQuiz.length);
  assert.ok(cards.every(card => card.topic === chapter.chapterTitle && card.chapterId === chapter.id));
  assert.equal(cards[0].answer, chapter.comprehensionQuiz[0].options[chapter.comprehensionQuiz[0].correctIndex]);
  assert.equal(cards[0].explanation, chapter.comprehensionQuiz[0].explanation);
});

test('attempted questions enroll once, even when also logged as mistakes', () => {
  const cards = buildRecallCards([], {}, [...INITIAL_QUESTION_BANK, question], [question.id, question.id], [mistake]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].topic, question.microTopic);
  assert.equal(cards[0].isMistake, true);
  assert.deepEqual(cards[0].statements, question.statements || []);
  assert.ok(cards[0].answer.endsWith(question.options.find(option => option.key === question.correctAnswer)!.text));
});

test('mistakes enroll even if legacy solved-question tracking missed them', () => {
  assert.equal(buildRecallCards([], {}, INITIAL_QUESTION_BANK, [], [mistake]).length, 1);
});

test('successful recalls schedule 1, 3, 7, 14, then repeated 30-day intervals', () => {
  let previous: RecallProgress | undefined;
  let reviewedAt = now;
  for (const days of [1, 3, 7, 14, 30, 30]) {
    const next = scheduleRecall(previous, 'remembered', reviewedAt);
    assert.equal(next.dueAt, reviewedAt + days * DAY);
    assert.equal(next.reviews, (previous?.reviews || 0) + 1);
    previous = next;
    reviewedAt = next.dueAt;
  }
});

test('a forgotten answer resets progression and returns in 10 minutes', () => {
  const previous = { stage: 4, reviews: 5, dueAt: now, lastReviewedAt: now - DAY, rating: 'remembered' as const };
  const next = scheduleRecall(previous, 'again', now);
  assert.equal(next.stage, 0);
  assert.equal(next.dueAt, now + 600_000);
  assert.equal(scheduleRecall(next, 'remembered', next.dueAt).dueAt, next.dueAt + DAY);
});

test('guessing schedules tomorrow without advancing the stage', () => {
  const first = scheduleRecall(undefined, 'remembered', now);
  const unsure = scheduleRecall(first, 'unsure', now + DAY);
  assert.equal(unsure.stage, first.stage);
  assert.equal(unsure.dueAt, now + 2 * DAY);
});

test('due cards respect exact topic and subject, not overlapping words', () => {
  const base = buildRecallCards([], {}, [question], [question.id], [])[0];
  const otherTopic = { ...base, id: 'other', topic: `${base.topic} advanced` };
  const otherSubject = { ...base, id: 'other-subject', subject: 'Different subject' };
  assert.deepEqual(getDueRecallCards([otherTopic, base, otherSubject], {}, now, topicKey(base)).map(card => card.id), [base.id]);
});

test('reviewed cards leave the queue until due, and overdue cards stay eligible', () => {
  const cards = buildRecallCards([], {}, [question], [question.id], []);
  const progress = { [cards[0].id]: scheduleRecall(undefined, 'again', now) };
  assert.equal(getDueRecallCards(cards, progress, now).length, 0);
  assert.equal(getDueRecallCards(cards, progress, now + 600_000).length, 1);
  assert.equal(getDueRecallCards(cards, progress, now + 10 * DAY).length, 1);
});

test('mistakes appear before ordinary due cards', () => {
  const base = buildRecallCards([], {}, [question], [question.id], [])[0];
  const weak = { ...base, id: 'weak', isMistake: true };
  assert.equal(getDueRecallCards([base, weak], {}, now)[0].id, 'weak');
});

test('review progress survives a storage round trip and still controls due dates', () => {
  const cards = buildRecallCards([], {}, [question], [question.id], []);
  const saved = { [cards[0].id]: scheduleRecall(undefined, 'remembered', now) };
  const restored = parseRecallProgress(JSON.stringify(saved));
  assert.deepEqual(restored, saved);
  assert.equal(getDueRecallCards(cards, restored, now).length, 0);
  assert.equal(getDueRecallCards(cards, restored, now + DAY).length, 1);
});

test('corrupt storage cannot hide cards permanently or create invalid intervals', () => {
  for (const value of [null, 'oops', 'null', '[]', '"string"']) assert.deepEqual(parseRecallProgress(value), {});
  const valid = scheduleRecall(undefined, 'remembered', now);
  const restored = parseRecallProgress(JSON.stringify({ valid, invalid: { ...valid, stage: 99 }, missing: { rating: 'again' }, badDate: { ...valid, dueAt: 'tomorrow' } }));
  assert.deepEqual(Object.keys(restored), ['valid']);
});
