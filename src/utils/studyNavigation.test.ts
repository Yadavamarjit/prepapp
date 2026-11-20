import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LearningHub } from '../components/LearningHub';
import { PracticeHome, RevisionHome, ProgressPage, SectionNavigation } from '../components/StudySections';
import ChapterwisePyq from '../components/ChapterwisePyq';
import { DailyReview } from '../components/DailyReview';
import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { buildRecallCards } from './dailyReview';

function render(element: React.ReactElement, path = '/') {
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] }, element));
}
const chapter = LEARNING_CHAPTERS[0];
const learningProps = { progressMap: {}, onToggleChapterCompleted: () => {}, onSelectTopicForAi: () => {}, onSaveNotes: () => true };

test('subject library links each lesson to a distinct refreshable route', () => {
  const html = render(React.createElement(LearningHub, learningProps), '/learning');
  assert.ok(html.includes('Your learning library'));
  for (const item of LEARNING_CHAPTERS) assert.ok(html.includes(`href="/learning/${item.id}"`));
  assert.ok(html.includes('href="/books"'));
});

test('opening a chapter directly renders its content and four clear learning sections', () => {
  const html = render(React.createElement(Routes, null, React.createElement(Route, {
    path: '/learning/:chapterId', element: React.createElement(LearningHub, learningProps),
  })), `/learning/${chapter.id}`);
  assert.ok(html.includes(chapter.sections[0].heading));
  for (const tab of ['Learn', 'Practise', 'Revise', 'Notes']) assert.ok(html.includes(`>${tab}</button>`));
  assert.ok(!html.includes('Mastered'));
});

test('an invalid chapter route offers a way back instead of showing an unrelated lesson', () => {
  const html = render(React.createElement(Routes, null, React.createElement(Route, {
    path: '/learning/:chapterId', element: React.createElement(LearningHub, learningProps),
  })), '/learning/missing');
  assert.ok(html.includes('Lesson not found'));
  assert.ok(!html.includes(chapter.sections[0].heading));
});

test('practice overview distinguishes selected-topic practice from mixed exam practice', () => {
  const html = render(React.createElement(PracticeHome));
  for (const path of ['/ai-tutor', '/practice/capf-analytica', '/practice/chapterwise-pyq', '/capf-elimination', '/paper-2']) assert.ok(html.includes(`href="${path}"`));
  assert.ok(html.includes('Your selected topic only'));
  assert.ok(html.includes('Mixed topics'));
  assert.doesNotMatch(html, /CPO/i);
});

function renderPyq(path: string) {
  return render(React.createElement(Routes, null, React.createElement(Route, {
    path: '/practice/chapterwise-pyq/:subjectId?/:chapterId?', element: React.createElement(ChapterwisePyq),
  })), `/practice/chapterwise-pyq${path}`);
}

test('chapterwise PYQs open the requested subject and chapter from a direct link', () => {
  for (const [path, heading, questionCount] of [
    ['/general-science/phy-01', 'Units, Measurements &amp; Motion', 2],
    ['/geography/geo-phy-01', 'Origin &amp; Evolution of Earth', 10],
    ['/history/anc-02', 'Indus Valley Civilization', 5],
  ] as const) {
    const html = renderPyq(path);
    assert.match(html, new RegExp(`<h2 id="pyq-chapter-title"[^>]*>${heading}`));
    assert.ok(html.includes(`Question 1 of ${questionCount}`));
    assert.match(html, new RegExp(`<a(?=[^>]*href="/practice/chapterwise-pyq${path}")(?=[^>]*aria-current="page")[^>]*>`));
  }
});

test('the history menu opens a chapter with questions and keeps empty chapters reachable', () => {
  assert.ok(renderPyq('/history').includes('Question 1 of 5'));
  assert.ok(renderPyq('/history/anc-01').includes('There are no questions in this chapter.'));
  assert.ok(renderPyq('/geography/anc-01').includes('Subject or chapter not found'));
});

test('revision overview exposes recall and mistakes with actual queue counts', () => {
  const html = render(React.createElement(RevisionHome, { dueCount: 6, mistakeCount: 2, reviewedToday: 3 }));
  assert.ok(html.includes('href="/daily-review"'));
  assert.ok(html.includes('href="/mistake-vault"'));
  assert.ok(html.includes('3 cards reviewed today'));
});

test('practice subsection links identify the active tool accessibly', () => {
  const html = render(React.createElement(SectionNavigation), '/paper-2');
  assert.ok(html.includes('aria-label="Practice tools"'));
  assert.ok(/<a(?=[^>]*href="\/paper-2")(?=[^>]*aria-current="page")[^>]*>/.test(html));
});

test('chapter revision deep link includes only that exact chapter’s cards', () => {
  const chapters = LEARNING_CHAPTERS.slice(0, 2);
  const progress = Object.fromEntries(chapters.map(item => [item.id, { chapterId: item.id, isCompleted: true }]));
  const cards = buildRecallCards(chapters, progress, [], [], []);
  const query = new URLSearchParams({ topic: JSON.stringify([chapter.subject, chapter.chapterTitle]) });
  const html = render(React.createElement(DailyReview, { cards, progress: {}, onReview: () => true, storageError: false }), `/daily-review?${query}`);
  assert.ok(html.includes(chapter.comprehensionQuiz[0].question.replace(/&/g, '&amp;').replace(/"/g, '&quot;')));
  assert.ok(!html.includes(chapters[1].comprehensionQuiz[0].question));
});

test('progress page has no fabricated streak or achievement claims', () => {
  const html = render(React.createElement(ProgressPage, { chapterProgress: {}, questions: [], mistakes: [], solvedQuestionIds: [], submissions: [], reviewedToday: 0 }));
  assert.ok(html.includes('Questions attempted'));
  assert.ok(!html.includes('4-Day'));
  assert.ok(!html.includes('Mastered'));
});
