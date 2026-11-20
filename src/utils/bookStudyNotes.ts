import { apiFetch } from '../lib/api';
export type StudyAction = 'EXPLAIN' | 'GENERATE_QUESTIONS';
export interface ChapterStudyNote {
  id: string;
  bookCode: string;
  chapterNumber: number;
  pageNumber?: number;
  type: 'EXPLAIN' | 'QUESTIONS';
  selectedText: string;
  title: string;
  content: string;
  createdAt: string;
}
export interface StudyDraft {
  bookCode: string;
  chapterNumber: number;
  pageNumber: number;
  type: 'EXPLAIN' | 'QUESTIONS';
  selectedText: string;
  title: string;
  content: string;
}

export async function generateBookStudyDraft(input: {
  action: StudyAction; text: string; bookCode: string; bookTitle: string;
  chapterNumber: number; chapterTitle: string; pageNumber: number; subject: string;
}, request: typeof fetch = apiFetch, signal?: AbortSignal): Promise<StudyDraft> {
  const text = input.text.replace(/\s+/g, ' ').trim();
  if (text.length < 5) throw new Error('Select at least a short sentence from the textbook.');
  if (text.length > 12000) throw new Error('Select a shorter passage, up to 12,000 characters.');
  const response = await request('/api/ai/text-action', {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: input.action, text, context: { bookTitle: input.bookTitle, chapterTitle: input.chapterTitle, subject: input.subject } }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || 'Could not generate study material. Please retry.');
  const content = input.action === 'EXPLAIN' ? data.explanation : data.output;
  if (typeof content !== 'string' || !content.trim()) throw new Error('The tutor returned no content. Please retry.');
  return { bookCode: input.bookCode, chapterNumber: input.chapterNumber, pageNumber: input.pageNumber,
    type: input.action === 'EXPLAIN' ? 'EXPLAIN' : 'QUESTIONS', selectedText: text,
    title: input.action === 'EXPLAIN' ? 'Easy explanation' : 'Practice questions', content };
}

export async function saveBookStudyDraft(draft: StudyDraft, request: typeof fetch = apiFetch, signal?: AbortSignal): Promise<ChapterStudyNote> {
  const response = await request('/api/ncert/notes', { method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
  const data = await response.json();
  if (!response.ok || !data.success || !data.note?.id) throw new Error('Study material saving failed. Keep this page open and retry below.');
  return data.note;
}
