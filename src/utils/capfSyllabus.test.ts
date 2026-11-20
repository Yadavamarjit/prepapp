import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CAPF_AREAS, CAPF_MISSING, capfAttention, parseCapfConfidence } from '../data/capfSyllabus';
import { CapfSyllabus } from '../components/CapfSyllabus';

test('trend totals account for missing questions rather than implying complete coverage', () => {
  for (let year = 0; year < 5; year++) assert.equal(CAPF_AREAS.reduce((total, area) => total + area.counts[year], CAPF_MISSING[year]), 125);
});
test('attention never implies confidence from an empty practice record and mistakes override green', () => {
  assert.equal(capfAttention(undefined, 0), 'unknown');
  assert.equal(capfAttention('steady', 1), 'focus');
  assert.equal(capfAttention('steady', 0), 'steady');
  assert.equal(capfAttention('review', 0), 'review');
});
test('confidence survives reload while corrupt values and unknown subjects are discarded', () => {
  assert.deepEqual(parseCapfConfidence('{"science":"focus","polity":"steady","fake":"review","history":"bad"}'), { science: 'focus', polity: 'steady' });
  for (const raw of ['null', 'broken', '42', null]) assert.deepEqual(parseCapfConfidence(raw), {});
});
test('empty learner sees unassessed subjects, source limitations and usable actions', () => {
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(CapfSyllabus, { questions: [], mistakes: [], solvedQuestionIds: [] })));
  for (const text of ['Not assessed', 'Missing from index', 'How confident', 'Official UPSC notice', 'href="/books"', 'href="/paper-2"']) assert.ok(html.includes(text), text);
  assert.match(html, /620 (?:out )?of 625/);
  assert.ok(!html.includes('100%'));
});
