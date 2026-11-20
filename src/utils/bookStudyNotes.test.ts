import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BookStudyTools } from '../components/BookStudyTools';
import { generateBookStudyDraft, saveBookStudyDraft } from './bookStudyNotes';
import type { StudyDraft } from './bookStudyNotes';

const input = { action: 'EXPLAIN' as const, text: '  Cells  are the basic units of life. ', bookCode: 'iesc1', bookTitle: 'Science', chapterNumber: 2, chapterTitle: 'Cells', pageNumber: 3, subject: 'Science' };
const draft: StudyDraft = { bookCode: 'iesc1', chapterNumber: 2, pageNumber: 3, selectedText: 'Cells are the basic units of life.', type: 'EXPLAIN', title: 'Easy explanation', content: 'A cell is a small living unit.' };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

test('highlight explanation sends the selected text and correct book/chapter context', async () => {
  const request = (async (url, init) => {
    assert.equal(url, '/api/ai/text-action');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.text, 'Cells are the basic units of life.');
    assert.equal(body.context.chapterTitle, 'Cells');
    assert.equal(body.action, 'EXPLAIN');
    return json({ success: true, explanation: draft.content });
  }) as typeof fetch;
  assert.deepEqual(await generateBookStudyDraft(input, request), draft);
});

test('generated questions use the QUESTIONS database category and preserve source page', async () => {
  const result = await generateBookStudyDraft({ ...input, action: 'GENERATE_QUESTIONS' }, (async () => json({ success: true, output: 'Question and answer' })) as typeof fetch);
  assert.equal(result.type, 'QUESTIONS');
  assert.equal(result.pageNumber, 3);
  assert.equal(result.content, 'Question and answer');
});

test('save uses existing chapter notes endpoint for compatibility with previous saved notes', async () => {
  const request = (async (url, init) => {
    assert.equal(url, '/api/ncert/notes');
    assert.deepEqual(JSON.parse(String(init?.body)), draft);
    return json({ success: true, note: { ...draft, id: 'persisted', createdAt: '2026-11-14' } });
  }) as typeof fetch;
  assert.equal((await saveBookStudyDraft(draft, request)).id, 'persisted');
});

test('failed generation is reported without inventing a replacement explanation', async () => {
  await assert.rejects(generateBookStudyDraft(input, (async () => json({ success: false, error: 'Tutor unavailable' }, 503)) as typeof fetch), /Tutor unavailable/);
  await assert.rejects(generateBookStudyDraft(input, (async () => json({ success: true, explanation: '' })) as typeof fetch), /no content/);
});

test('failed persistence is distinguished from successful generation so saving can be retried', async () => {
  await assert.rejects(saveBookStudyDraft(draft, (async () => json({ success: false }, 503)) as typeof fetch), /saving failed/);
  const note = await saveBookStudyDraft(draft, (async () => json({ success: true, note: { ...draft, id: 'retry-saved' } })) as typeof fetch);
  assert.equal(note.id, 'retry-saved');
});

test('empty and excessive passages do not make a paid generation request', async () => {
  let called = false;
  const request = (async () => { called = true; return json({}); }) as typeof fetch;
  await assert.rejects(generateBookStudyDraft({ ...input, text: 'x' }, request), /Select at least/);
  await assert.rejects(generateBookStudyDraft({ ...input, text: 'x'.repeat(12001) }, request), /shorter passage/);
  assert.equal(called, false);
});

test('book reader lets visitors save notes and view saved material without an account', () => {
  const html = renderToStaticMarkup(React.createElement(BookStudyTools, { ...input, selectedText: '', selectedPage: 3, onJumpPage: () => {} }));
  assert.ok(html.includes('Save reading note'));
  assert.ok(!html.includes('Explain simply'));
  assert.ok(!html.includes('Generate questions'));
  assert.ok(html.includes('Saved for this chapter'));
  assert.ok(html.includes('Filter saved study material'));
  assert.ok(html.includes('Loading saved study material'));
});
