import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { REEL_COURSES } from '../data/learningReels';
import { LearnReels } from '../components/LearnReels';
import { SectionNavigation } from '../components/StudySections';
import { answerReel, buildReelRecallCards, chapterComplete, chapterUnlocked, emptyReelsProgress, parseReelsProgress, reelFeed, type ReelsProgress } from './learningReels';

const [science, history] = REEL_COURSES;
const [first, second] = science.chapters;
const passChapter = (progress: ReelsProgress, chapter = first) => chapter.lessons.reduce((state, lesson) => answerReel(state, chapter, lesson.id, lesson.answer), progress);

test('starter courses contain ordered chapters, unique concepts and valid recall answers', () => {
  const ids: string[] = [];
  for (const course of REEL_COURSES) {
    assert.deepEqual(course.chapters.map(chapter => chapter.number), [1, 2]);
    for (const chapter of course.chapters) {
      assert.equal(chapter.lessons.length, 5);
      assert.match(chapter.source, /^https:\/\/ncert\.nic\.in\/textbook\/pdf\//);
      for (const lesson of chapter.lessons) {
        ids.push(lesson.id);
        assert.equal(lesson.steps.length, 3);
        assert.ok(lesson.options[lesson.answer]);
        assert.equal(new Set(lesson.options).size, 3);
      }
    }
  }
  assert.equal(ids.length, 20);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(history.chapters[0].source.endsWith('iess301.pdf'));
});

test('feed stops at a check and never mixes chapters or subjects', () => {
  const progress = emptyReelsProgress();
  assert.deepEqual(reelFeed(first, progress).map(item => item.kind), ['lesson', 'lesson', 'lesson', 'check']);
  assert.deepEqual(reelFeed(second, progress), []);
  assert.equal(chapterUnlocked(second.id, progress), false);
  assert.equal(chapterUnlocked(history.chapters[0].id, progress), true);
  assert.equal(chapterUnlocked('missing', progress), false);
});

test('wrong answers enroll only the missed concept and do not unlock anything', () => {
  const lesson = first.lessons[0];
  let progress = answerReel(emptyReelsProgress(), first, lesson.id, (lesson.answer + 1) % 3);
  progress = answerReel(progress, first, lesson.id, (lesson.answer + 2) % 3);
  assert.deepEqual(progress.passed, []);
  assert.deepEqual(progress.missed, [lesson.id]);
  assert.equal(chapterUnlocked(second.id, progress), false);
  const cards = buildReelRecallCards(progress);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].subject, 'Science');
  assert.equal(cards[0].answer, lesson.options[lesson.answer]);
  assert.equal(cards[0].isMistake, true);
});

test('out-of-order, invalid and locked chapter answers cannot advance progress', () => {
  const progress = emptyReelsProgress();
  for (const [chapter, lesson, option] of [
    [first, first.lessons[1], first.lessons[1].answer],
    [second, second.lessons[0], second.lessons[0].answer],
    [first, first.lessons[0], -1],
    [first, first.lessons[0], 0.5],
    [first, first.lessons[0], 99],
  ] as const) assert.equal(answerReel(progress, chapter, lesson.id, option), progress);
});

test('all questions in each batch must pass before more content or a chapter unlocks', () => {
  let progress = emptyReelsProgress();
  for (const lesson of first.lessons.slice(0, 2)) progress = answerReel(progress, first, lesson.id, lesson.answer);
  assert.equal(reelFeed(first, progress).length, 4);
  const third = first.lessons[2];
  progress = answerReel(progress, first, third.id, third.answer);
  assert.deepEqual(reelFeed(first, progress).map(item => item.kind), ['lesson', 'lesson', 'lesson', 'check', 'lesson', 'lesson', 'check']);
  assert.equal(chapterUnlocked(second.id, progress), false);
  for (const lesson of first.lessons.slice(3)) progress = answerReel(progress, first, lesson.id, lesson.answer);
  assert.equal(chapterComplete(first, progress), true);
  assert.equal(chapterUnlocked(second.id, progress), true);
  assert.equal(reelFeed(first, progress).at(-1)?.kind, 'complete');
  assert.equal(chapterUnlocked(history.chapters[1].id, progress), false);
});

test('saved position, bookmark and review enrollment survive reload without enrolling every viewed reel', () => {
  let progress = passChapter(emptyReelsProgress());
  progress = { ...progress, saved: [second.lessons[0].id], missed: [first.lessons[1].id], positions: { [second.id]: second.lessons[1].id } };
  const restored = parseReelsProgress(JSON.stringify(progress));
  assert.deepEqual(restored, progress);
  assert.equal(chapterUnlocked(second.id, restored), true);
  assert.deepEqual(buildReelRecallCards(restored).map(card => card.id), [`reel:${first.lessons[1].id}`, `reel:${second.lessons[0].id}`]);
  assert.equal(buildReelRecallCards(emptyReelsProgress()).length, 0);
});

test('malformed or stale storage cannot create phantom completion or resume a locked chapter', () => {
  for (const raw of [null, 'bad json', 'null', '[]', '42']) assert.deepEqual(parseReelsProgress(raw), emptyReelsProgress());
  const restored = parseReelsProgress(JSON.stringify({ passed: [second.lessons[0].id, first.lessons[2].id, 'missing'], saved: [second.lessons[0].id, 'missing'], missed: 'not-an-array', positions: { [second.id]: second.lessons[0].id, [first.id]: 'missing' } }));
  assert.deepEqual(restored, emptyReelsProgress());
});

function render(path: string, progress = emptyReelsProgress(), storageError = false) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] },
    React.createElement(Routes, null, React.createElement(Route, {
      path: '/reels/:courseId?/:chapterNumber?', element: React.createElement(LearnReels, { progress, storageError, onChange: () => {} }),
    }))));
}

test('course screen explains scope and shows only unlocked chapter links', () => {
  const html = render('/reels');
  assert.ok(html.includes('Learn Reels'));
  assert.ok(html.includes('href="/reels/science-9/1"'));
  assert.ok(!html.includes('href="/reels/science-9/2"'));
  assert.ok(html.includes('10 reels'));
  assert.ok(html.includes('this browser on this device'));
});

test('direct locked chapter and invalid URLs do not render a player or unrelated content', () => {
  for (const path of ['/reels/science-9/2', '/reels/missing/1', '/reels/history-9/9']) {
    const html = render(path);
    assert.ok(!html.includes('<dialog'));
    assert.ok(html.includes('Choose a course'));
  }
});

test('unlocked player exposes caption controls, source and pause controls without future lessons', () => {
  const html = render('/reels/science-9/1');
  assert.ok(html.includes('<dialog'));
  assert.ok(html.includes('Read part 1 of 3'));
  assert.ok(html.includes('Save reel for daily recall'));
  assert.ok(html.includes('href="/books/iesc1/1"'));
  assert.ok(html.includes(first.lessons[0].title));
  assert.ok(!html.includes(first.lessons[3].title));
  assert.ok(!html.includes(second.lessons[0].title));
});

test('storage errors are visible in both course screen and player', () => {
  assert.ok(render('/reels', emptyReelsProgress(), true).includes('role="alert"'));
  assert.ok(render('/reels/science-9/1', emptyReelsProgress(), true).includes('Progress could not be saved'));
});

test('learning navigation recognises deep reel routes', () => {
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/reels/science-9/1'] }, React.createElement(SectionNavigation)));
  assert.ok(/<a(?=[^>]*href="\/reels")(?=[^>]*aria-current="page")/.test(html));
});
