import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { READING_BOOKS, resolveReadingChapter } from '../data/readingLibrary';
import { BooksLibrary } from '../components/BooksLibrary';
import { parseBookProgress, recordBookPosition, toggleBookChapter } from './bookProgress';

test('full-book shelf excludes partial study selections and provides sequential chapters', () => {
  assert.equal(READING_BOOKS.length, 4);
  for (const book of READING_BOOKS) {
    assert.ok(!book.code.includes('comb'));
    assert.deepEqual(book.chapters.map(chapter => chapter.number), Array.from({ length: book.chapters.length }, (_, i) => i + 1));
  }
  assert.equal(READING_BOOKS.find(book => book.code === 'jess1')?.chapters.length, 7);
  assert.equal(resolveReadingChapter('jess1', '7').chapter?.title, 'Lifelines of National Economy');
});

test('invalid textbook or chapter never falls back to another book', () => {
  assert.equal(resolveReadingChapter('missing', '1').book, undefined);
  assert.equal(resolveReadingChapter('iesc1', '999').chapter, undefined);
});

test('position and completion survive reload and remain independent for each book', () => {
  let progress = recordBookPosition({}, 'iesc1', 3, 5, 100);
  progress = toggleBookChapter(progress, 'iesc1', 3, 5);
  progress = recordBookPosition(progress, 'jesc1', 2, 4, 200);
  const restored = parseBookProgress(JSON.stringify(progress));
  assert.equal(restored.iesc1.chapter, 3);
  assert.equal(restored.iesc1.page, 5);
  assert.deepEqual(restored.iesc1.completed, [3]);
  assert.equal(restored.jesc1.page, 4);
  assert.deepEqual(restored.jesc1.completed, []);
});

test('turning pages preserves completion and marking unread does not reset the bookmark', () => {
  const first = toggleBookChapter({}, 'iesc1', 1, 3);
  const turned = recordBookPosition(first, 'iesc1', 2, 4);
  assert.deepEqual(turned.iesc1.completed, [1]);
  const unread = toggleBookChapter(turned, 'iesc1', 1, 3);
  assert.deepEqual(unread.iesc1.completed, []);
  assert.equal(unread.iesc1.page, 3);
});

test('corrupt saved progress and invalid page/chapter values are ignored', () => {
  for (const raw of ['invalid', '[]', 'null']) assert.deepEqual(parseBookProgress(raw), {});
  assert.deepEqual(recordBookPosition({}, 'iesc1', 99, 1), {});
  assert.deepEqual(recordBookPosition({}, 'iesc1', 1, 0), {});
  assert.deepEqual(recordBookPosition({}, 'iesc1', 1, 1.5), {});
  const valid = recordBookPosition({}, 'iesc1', 1, 2);
  valid.iesc1.completed = [1, 1, 999];
  assert.deepEqual(parseBookProgress(JSON.stringify(valid)).iesc1.completed, [1]);
});

function render(path: string) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] },
    React.createElement(Routes, null, React.createElement(Route, { path: '/books/:bookCode?/:chapterNumber?', element: React.createElement(BooksLibrary) }))));
}

test('book catalog exposes full book routes and identifies the current shelf size', () => {
  const html = render('/books');
  assert.ok(html.includes('Read a book'));
  assert.ok(html.includes('four NCERT textbooks'));
  for (const book of READING_BOOKS) assert.ok(html.includes(`href="/books/${book.code}"`));
});

test('book contents link every original chapter including the final one', () => {
  const html = render('/books/iesc1');
  for (let number = 1; number <= 13; number++) assert.ok(html.includes(`href="/books/iesc1/${number}"`));
  assert.ok(html.includes('Start reading'));
});

test('direct reader link offers real PDF access, paging and next chapter without summary substitution', () => {
  const html = render('/books/iesc1/1');
  assert.ok(html.includes('href="/api/ncert/pdf/iesc1/1#page=1"'));
  assert.ok(html.includes('aria-label="Next page"'));
  assert.ok(html.includes('href="/books/iesc1/2"'));
  assert.ok(html.includes('Loading original chapter pages'));
});

test('invalid chapter URL clearly reports the missing item', () => {
  assert.ok(render('/books/iesc1/999').includes('Book or chapter not found'));
});
