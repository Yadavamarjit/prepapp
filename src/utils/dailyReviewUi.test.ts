import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { DailyReview } from '../components/DailyReview';
import { scheduleRecall } from './dailyReview';
import type { RecallCard, RecallProgressMap } from './dailyReview';

const card: RecallCard = {
  id: 'recall-ui', subject: 'General Science', topic: 'Plants', prompt: 'How do plants make food?',
  statements: [], options: ['Hidden original option'], answer: 'Hidden correct answer',
  explanation: 'Hidden detailed explanation', source: 'Hidden source', isMistake: false,
};

function render(cards: RecallCard[], progress: RecallProgressMap = {}, storageError = false) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, null,
    React.createElement(DailyReview, { cards, progress, storageError, onReview: () => true })));
}

test('recall screen prompts for a written answer without exposing the solution or options', () => {
  const html = render([card]);
  assert.ok(html.includes(card.prompt));
  assert.ok(html.includes('Your answer from memory'));
  assert.ok(html.includes('Reveal and compare'));
  assert.ok(html.includes('I can’t recall it'));
  for (const hidden of [card.answer, card.explanation, card.source, ...card.options]) {
    assert.ok(!html.includes(hidden), `Must hide ${hidden} before recall`);
  }
});

test('empty queue tells learners how to enroll and links to the Study Hub', () => {
  const html = render([]);
  assert.ok(html.includes('Build your first review cards'));
  assert.ok(html.includes('href="/learning"'));
  assert.ok(!html.includes('recall-answer'));
});

test('scheduled cards show the next review instead of repeating immediately', () => {
  const html = render([card], { [card.id]: scheduleRecall(undefined, 'remembered') });
  assert.ok(html.includes('caught up'));
  assert.ok(html.includes('Next review:'));
  assert.ok(!html.includes('recall-answer'));
});

test('storage failure is visible and does not hide the current exercise', () => {
  const html = render([card], {}, true);
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes('could not be saved'));
  assert.ok(html.includes('recall-answer'));
});
