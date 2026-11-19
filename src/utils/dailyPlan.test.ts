import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { DailyPlan } from '../components/DailyPlan';
import { INITIAL_QUESTION_BANK } from '../data/questionBank';
import { buildDailyPlan, carryDailyPlan, localPlanDate, parseDailyPlan } from './dailyPlan';
const inputs = { budget: 20 as const, exam: 'UPSC_CAPF' as const, chapters: LEARNING_CHAPTERS, progress: {}, questions: [], mistakes: [], dueCount: 0, now: new Date(2026, 10, 15, 12) };
test('all time budgets provide four tasks with exact totals and no timer or invented completion', () => {
  for (const budget of [20, 45, 90] as const) {
    const plan = buildDailyPlan({ ...inputs, budget });
    assert.equal(plan.tasks.reduce((sum, task) => sum + task.minutes, 0), budget);
    assert.deepEqual(plan.tasks.map(task => task.id), ['recall', 'learn', 'maths', 'practice']);
    assert.ok(plan.tasks.every(task => !task.done && !task.deferred));
  }
});
test('learning starts with earliest unfinished chapter in chosen subject, respecting exam scope', () => {
  const eligible = LEARNING_CHAPTERS.filter(chapter => chapter.examRelevance.includes('UPSC_CAPF'));
  const first = eligible[0];
  const progress = { [first.id]: { chapterId: first.id, isCompleted: true } };
  const plan = buildDailyPlan({ ...inputs, chapters: [...eligible].reverse(), progress });
  const selected = eligible.find(chapter => `/learning/${chapter.id}` === plan.tasks[1].path)!;
  assert.ok(selected);
  assert.notEqual(selected.id, first.id);
  assert.ok(!eligible.some(chapter => chapter.subject === selected.subject && chapter.chapterNumber < selected.chapterNumber && !progress[chapter.id]?.isCompleted));
});
test('only relevant recorded mistakes influence weak subject selection', () => {
  const question = INITIAL_QUESTION_BANK.find(question => question.targetExam.includes('UPSC_CAPF') && LEARNING_CHAPTERS.some(chapter => chapter.subject === question.subject))!;
  const plan = buildDailyPlan({ ...inputs, questions: [question], mistakes: [{ id: 'm', questionId: question.id } as any] });
  assert.equal(plan.tasks[3].path, '/mistake-vault');
  assert.ok(plan.tasks[3].title.includes(question.microTopic));
  assert.ok(LEARNING_CHAPTERS.find(chapter => `/learning/${chapter.id}` === plan.tasks[1].path)?.subject === question.subject);
  assert.equal(buildDailyPlan(inputs).tasks[3].path, '/ai-tutor');
});
test('pending tasks carry forward while finished tasks refresh and time allowance changes', () => {
  const old = buildDailyPlan(inputs);
  old.tasks[0].done = true;
  old.tasks[1].deferred = true;
  old.tasks[1].title = 'Keep my unfinished chapter';
  const fresh = buildDailyPlan({ ...inputs, budget: 45, now: new Date(2026, 10, 16, 12) });
  const next = carryDailyPlan(old, fresh);
  assert.equal(next.date, '2026-11-16');
  assert.equal(next.tasks[1].title, 'Keep my unfinished chapter');
  assert.ok(next.tasks.every(task => !task.done && !task.deferred));
  assert.equal(next.tasks.reduce((sum, task) => sum + task.minutes, 0), 45);
  assert.deepEqual(carryDailyPlan(old, { ...fresh, exam: 'SSC_CPO' }), { ...fresh, exam: 'SSC_CPO' });
});
test('saved plan restores completed and deferred tasks; corrupt data cannot provide unsafe links', () => {
  const plan = buildDailyPlan(inputs);
  plan.tasks[0].done = true; plan.tasks[2].deferred = true;
  assert.deepEqual(parseDailyPlan(JSON.stringify(plan)), plan);
  for (const raw of [null, 'broken', 'null', '{}']) assert.equal(parseDailyPlan(raw), null);
  plan.tasks[1].path = '//untrusted.example';
  assert.equal(parseDailyPlan(JSON.stringify(plan)), null);
});
test('calendar date uses local day, and finished library offers honest revision', () => {
  assert.equal(localPlanDate(new Date(2026, 0, 2, 0, 1)), '2026-01-02');
  const plan = buildDailyPlan({ ...inputs, progress: Object.fromEntries(LEARNING_CHAPTERS.map(chapter => [chapter.id, { chapterId: chapter.id, isCompleted: true }])) });
  assert.equal(plan.tasks[1].path, '/learning');
  assert.equal(plan.tasks[1].title, 'Revisit a chapter');
});
test('new learner can choose time before creating a plan and sees no fabricated completion', () => {
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(DailyPlan, { chapterProgress: {}, questions: [], mistakes: [], dueCount: 0 })));
  for (const text of ['20 min', '45 min', '90 min', 'Build my', 'What should I study today?']) assert.ok(html.includes(text));
  assert.ok(!html.includes('4 of 4'));
});
