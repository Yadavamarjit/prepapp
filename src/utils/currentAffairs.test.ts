import test from 'node:test';
import assert from 'node:assert/strict';
import { AFFAIR_FEEDS, parseAffairFeed, plainText, validateAffairLesson } from '../../server/currentAffairs';
import { emptyAffairProgress, enrollAffair, parseAffairProgress, type AffairStory } from './currentAffairs';
const now = Date.parse('2026-11-15T12:00:00Z');
const xml = (url: string, date = 'Sun, 15 Nov 2026 08:00:00 GMT') => `<rss><channel><item><title><![CDATA[New science &amp; research programme]]></title><link>${url}</link><pubDate>${date}</pubDate><description><![CDATA[<p>Official information about scientific research.</p>]]></description></item></channel></rss>`;
test('feeds retain official dated entries and reject unknown hosts, undated, old or future stories', () => {
  const url = 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=123';
  const stories = parseAffairFeed(xml(url), AFFAIR_FEEDS[0], now);
  assert.equal(stories.length, 1); assert.equal(stories[0].topic, 'Science'); assert.equal(stories[0].title, 'New science & research programme');
  for (const bad of [xml('https://evil.example/article'), xml(url, 'bad'), xml(url, 'Sun, 15 Nov 2020 08:00:00 GMT'), xml(url, 'Sun, 15 Nov 2027 08:00:00 GMT')]) assert.equal(parseAffairFeed(bad, AFFAIR_FEEDS[0], now).length, 0);
});
test('source extraction removes script contents and markup', () => {
  assert.equal(plainText('<script>untrusted()</script><p>A &amp; B</p>'), 'A & B');
});
const evidence = 'The programme supports scientific research in India through a new public initiative.';
const lesson = { topic: 'Science' as const, summary: 'Summary of the release.', why: 'A science topic relevant to study.', facts: ['One relevant fact.'], paper2: 'Discuss public research priorities.', quiz: [0, 1].map(() => ({ question: 'What does the programme support?', options: ['Research', 'Sport', 'Banking', 'Tourism'], answer: 0, explanation: 'The release describes scientific research support.', evidence })) };
const story: AffairStory = { id: 'a'.repeat(24), title: 'Research programme', source: 'PIB', url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=123', excerpt: evidence, publishedAt: '2026-11-15T08:00:00Z', topic: 'Science', lesson };
test('AI quizzes require real source evidence, distinct options and valid answer indices', () => {
  assert.deepEqual(validateAffairLesson(lesson, evidence), lesson);
  assert.throws(() => validateAffairLesson(lesson, 'A completely unrelated official source.'), /evidence/);
  assert.throws(() => validateAffairLesson({ ...lesson, quiz: [{ ...lesson.quiz[0], answer: 9 }, lesson.quiz[1]] }, evidence));
});
test('saved and missed stories enroll stable recall cards without duplicates and survive reload', () => {
  const empty = emptyAffairProgress(); assert.equal(empty.cards.length, 0);
  const saved = enrollAffair(empty, story);
  assert.equal(saved.cards.length, 2); assert.equal(saved.saved.length, 1);
  const missed = enrollAffair(saved, story, true);
  assert.equal(missed.cards.length, 2); assert.ok(missed.cards.every(card => card.isMistake));
  assert.deepEqual(parseAffairProgress(JSON.stringify(missed)), missed);
  assert.deepEqual(parseAffairProgress('bad json'), empty);
});
