import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CalculationCoach, FractionBar } from '../components/CalculationCoach';
import { SKILLS, makeQuestion, expectedAnswer, gradeAnswer, solutionSteps, fraction, skillStats, createCoachSession, mistakesForReview, parseCoachState } from './calculationCoach';
import type { MathAttempt, MathQuestion } from './calculationCoach';

const q: MathQuestion = { id: 'fraction', skill: 'fractionAddition', a: 1, b: 2, c: 1, d: 3 };
const attempt = (question: MathQuestion, correct = true, helped = false, seconds = 4): MathAttempt => ({ question, correct, helped, seconds, skipped: false, at: 100 });

test('every generated skill has a valid numeric answer and worked steps across varied inputs', () => {
  let seed = 12345;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (const skill of SKILLS) for (let i = 0; i < 200; i++) {
    const question = makeQuestion(skill, `${skill}-${i}`, random);
    const [n, d] = expectedAnswer(question);
    assert.ok(Number.isFinite(n) && d > 0);
    const reduced = fraction(n, d).split('/');
    const input = skill === 'comparison' ? n < 0 ? '<' : n > 0 ? '>' : '=' : reduced[0];
    const graded = gradeAnswer(question, input, reduced[1] || '1');
    assert.equal(graded.valid, true, `${skill}: ${JSON.stringify(question)}`);
    assert.equal(graded.correct, true);
    assert.equal(solutionSteps(question).length, 3);
  }
});

test('fraction addition uses a common denominator, accepts equivalent answers, and rejects adding denominators', () => {
  assert.deepEqual(expectedAnswer(q), [5, 6]);
  assert.equal(gradeAnswer(q, '5', '6').correct, true);
  assert.equal(gradeAnswer(q, '10', '12').correct, true);
  assert.equal(gradeAnswer(q, '2', '5').correct, false);
  assert.ok(solutionSteps(q)[1].includes('3/6'));
});

test('simplification distinguishes equivalent but unfinished answers from wrong values', () => {
  const simplify = { ...q, skill: 'equivalence' as const, a: 6, b: 8 };
  assert.equal(gradeAnswer(simplify, '3', '4').correct, true);
  const unfinished = gradeAnswer(simplify, '12', '16');
  assert.equal(unfinished.valid, false);
  assert.ok(unfinished.message.includes('right value'));
  assert.equal(gradeAnswer(simplify, '2', '4').correct, false);
});

test('empty fields, zero denominators, invalid symbols and nonnumeric input never count as attempts', () => {
  for (const [n,d] of [['',''],['5','0'],['5',''],['NaN','6'],['1.5','2'],['-1','2']]) assert.equal(gradeAnswer(q, n, d).valid, false);
  assert.equal(gradeAnswer({ ...q, skill: 'comparison' }, '?').valid, false);
  assert.equal(gradeAnswer({ ...q, skill: 'addition' }, '12.5').valid, false);
});

test('fractions are compared by value, including equality with different denominators', () => {
  assert.equal(gradeAnswer({ ...q, skill: 'comparison', a: 1, b: 3, c: 1, d: 4 }, '>').correct, true);
  assert.equal(gradeAnswer({ ...q, skill: 'comparison', a: 1, b: 2, c: 2, d: 4 }, '=').correct, true);
});

test('speed requires nine independent correct answers in the last ten of that skill', () => {
  const questions = Array.from({ length: 10 }, (_, i) => makeQuestion('addition', String(i)));
  let history = questions.map(question => attempt(question));
  assert.equal(skillStats(history.slice(0, 9), 'addition').speedReady, false);
  assert.equal(skillStats(history, 'addition').speedReady, true);
  history[0].helped = true;
  assert.equal(skillStats(history, 'addition').speedReady, true);
  history[1].correct = false;
  assert.equal(skillStats(history, 'addition').speedReady, false);
  assert.equal(skillStats(history, 'division').speedReady, false);
});

test('average speed uses only correct unassisted answers', () => {
  const history = [attempt(q, true, false, 6), attempt(q, false, false, 1), attempt(q, true, true, 50), attempt(q, true, false, 10)];
  assert.equal(skillStats(history, 'fractionAddition').seconds, 8);
});

test('mistake review removes a question after independent success and retains hinted answers', () => {
  assert.equal(mistakesForReview([attempt(q, false)]).length, 1);
  assert.equal(mistakesForReview([attempt(q, false), attempt(q, true, true)]).length, 1);
  assert.equal(mistakesForReview([attempt(q, false), attempt(q, true)]).length, 0);
});

test('diagnostic covers all skills; practice stays on the selected skill; only speed is timed', () => {
  const check = createCoachSession('check', 'addition', [], 1000);
  assert.equal(check.questions.length, 12);
  assert.equal(new Set(check.questions.map(item => item.skill)).size, SKILLS.length);
  assert.equal(check.deadline, null);
  const practice = createCoachSession('practice', 'division', [], 1000);
  assert.ok(practice.questions.every(item => item.skill === 'division'));
  assert.equal(practice.questions.length, 8);
  assert.equal(createCoachSession('speed', 'addition', [], 1000).deadline, 61000);
});

test('saved sessions preserve input, feedback, scratchpad and original speed deadline', () => {
  const session = createCoachSession('speed', 'fractionAddition', [], 1000);
  session.numerator = '5'; session.denominator = '6'; session.scratch = '3/6 + 2/6'; session.feedback = 'correct';
  const original = { session, attempts: [attempt(q)], checkCompleted: true };
  assert.deepEqual(parseCoachState(JSON.stringify(original)), original);
  assert.equal(parseCoachState(JSON.stringify(original)).session?.deadline, 61000);
});

test('corrupt session data does not crash the coach or produce a zero denominator', () => {
  for (const value of ['invalid', 'null', '[]']) assert.equal(parseCoachState(value).session, null);
  const session = createCoachSession('practice', 'addition', []);
  session.questions[0].b = 0;
  assert.equal(parseCoachState(JSON.stringify({ session })).session, null);
});

test('fraction bar exposes an accessible description and coach offers a gentle start', () => {
  const bar = renderToStaticMarkup(React.createElement(FractionBar, { numerator: 3, denominator: 4 }));
  assert.ok(bar.includes('3 of 4 equal parts shaded'));
  const html = renderToStaticMarkup(React.createElement(CalculationCoach));
  assert.ok(html.includes('Start a gentle skill check'));
  assert.ok(html.includes('Optional 60-second speed round'));
  assert.ok(html.includes('Understanding fractions'));
  assert.ok(html.includes('No timer until you choose one'));
});
