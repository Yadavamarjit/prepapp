import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { generateBookStudyDraft, saveBookStudyDraft } from '../utils/bookStudyNotes';
import type { ChapterStudyNote, StudyAction, StudyDraft } from '../utils/bookStudyNotes';

export interface BookStudyToolsHandle { generate: (action: StudyAction) => void; }
interface Props {
  bookCode: string; bookTitle: string; subject: string; chapterNumber: number;
  chapterTitle: string; selectedText: string; selectedPage: number; pageNumber: number; onJumpPage: (page: number) => void;
  actionRef?: React.Ref<BookStudyToolsHandle>;
}

export function BookStudyTools(props: Props) {
  const { canUseAi } = useAuth();
  const [notes, setNotes] = useState<ChapterStudyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<StudyDraft | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [reload, setReload] = useState(0);
  const [expanded, setExpanded] = useState('');
  const [passage, setPassage] = useState(props.selectedText);
  const [passagePage, setPassagePage] = useState(props.pageNumber);
  const pending = useRef<AbortController | null>(null);
  const locked = useRef(false);
  useEffect(() => {
    if (props.selectedText) { setPassage(props.selectedText); setPassagePage(props.selectedPage); }
  }, [props.selectedText, props.selectedPage]);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    apiFetch(`/api/ncert/notes/${props.bookCode}/${props.chapterNumber}`, { signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok || !data.success || !Array.isArray(data.notes)) throw new Error(); return data.notes as ChapterStudyNote[]; })
      .then(data => { if (!controller.signal.aborted) setNotes(previous => [...new Map([...data, ...previous].map(note => [note.id, note])).values()]); })
      .catch(() => { if (!controller.signal.aborted) setLoadError('Saved material could not be loaded. Retry to see your previous notes.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [props.bookCode, props.chapterNumber, reload]);

  const run = async (action?: StudyAction, readingNote?: StudyDraft) => {
    if (locked.current || (action && !canUseAi)) return;
    if (action && draft) { setError('Save or discard the current result before generating another.'); return; }
    locked.current = true; setBusy(true); setError('');
    const controller = new AbortController();
    pending.current = controller;
    try {
      const result = action ? await generateBookStudyDraft({ ...props, action, text: passage, pageNumber: passagePage }, apiFetch, controller.signal) : readingNote ?? draft;
      if (!result || controller.signal.aborted) return;
      setDraft(result);
      const saved = await saveBookStudyDraft(result, apiFetch, controller.signal);
      if (controller.signal.aborted) return;
      setNotes(previous => [saved, ...previous.filter(note => note.id !== saved.id)]);
      setExpanded(saved.id); setFilter('ALL'); setDraft(null);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not prepare study material. Please retry.');
    } finally {
      if (!controller.signal.aborted) { setBusy(false); locked.current = false; }
    }
  };

  function saveReadingNote() {
    const content = passage.trim();
    if (!content || content.length > 12000) return;
    void run(undefined, {
      bookCode: props.bookCode,
      chapterNumber: props.chapterNumber,
      pageNumber: passagePage,
      type: 'EXPLAIN',
      selectedText: '',
      title: 'Reading note',
      content,
    });
  }
  const filtered = notes.filter(note => filter === 'ALL' || note.type === filter);
  useImperativeHandle(props.actionRef, () => ({ generate: action => { void run(action); } }));
  return <section className="study-panel space-y-5 p-5" aria-label="Textbook study assistant">
    <header><h2 className="section-title">Learn from a passage</h2><p className="mt-2 text-xs leading-6 text-[#818879]">{canUseAi ? 'Highlight text for an explanation or practice questions. You can also save your own notes.' : 'Highlight a passage or write a note, then save it with this chapter.'}</p></header>
    <label className="block text-xs font-medium">Selected passage<textarea aria-label="Selected textbook passage" rows={3} value={passage} onChange={event => { setPassage(event.target.value); setPassagePage(props.pageNumber); }} className="study-input mt-2" placeholder="Highlight a sentence or paragraph on the PDF page" /></label>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy || !!draft || !passage.trim() || passage.trim().length > 12000} onClick={saveReadingNote} className="primary-button disabled:opacity-50">Save reading note</button>
      {canUseAi && <>
        <button type="button" disabled={busy || !!draft || passage.trim().length < 5} onClick={() => void run('EXPLAIN')} className="secondary-button disabled:opacity-50">Explain simply</button>
        <button type="button" disabled={busy || !!draft || passage.trim().length < 5} onClick={() => void run('GENERATE_QUESTIONS')} className="secondary-button disabled:opacity-50">Generate questions</button>
      </>}
      {busy && <p role="status" className="self-center text-xs text-[#818879]">Saving study material…</p>}
    </div>
    {error && <p role="alert" className="rounded-lg bg-[#FBEAE8] p-3 text-sm text-[#9B3E33]">{error}</p>}
    {draft && <div className="space-y-3 rounded-lg border border-[#DDE1D2] p-4 dark:border-slate-700"><p className="text-xs font-medium">Unsaved study material</p><MarkdownRenderer content={draft.content} />{!busy && <div className="flex flex-wrap gap-3"><button type="button" className="primary-button" onClick={() => void run()}>Retry saving</button><button type="button" className="secondary-button" onClick={() => { setDraft(null); setError(''); }}>Discard result</button></div>}</div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E7DE] pt-5 dark:border-slate-800"><h2 className="section-title">Saved for this chapter <span className="ml-1 text-xs font-normal text-[#818879]">({notes.length})</span></h2><select aria-label="Filter saved study material" value={filter} onChange={event => setFilter(event.target.value)} className="rounded-lg border border-[#DDE1D2] bg-transparent p-2 text-xs dark:border-slate-700"><option value="ALL">Everything</option><option value="EXPLAIN">Explanations</option><option value="QUESTIONS">Questions</option></select></div>
    {loading && <p role="status" className="text-xs text-[#818879]">Loading saved study material...</p>}
    {loadError && <div role="alert" className="text-sm"><p>{loadError}</p><button type="button" className="quiet-link mt-2 text-xs" onClick={() => setReload(value => value + 1)}>Reload saved notes</button></div>}
    {!loading && !loadError && !filtered.length && <p className="text-xs text-[#818879]">{notes.length ? 'No saved items in this category.' : 'Your saved study material will appear here.'}</p>}
    <div className="space-y-3">{filtered.map(note => <details key={note.id} open={expanded === note.id} onToggle={event => { if (event.currentTarget.open) setExpanded(note.id); else setExpanded(current => current === note.id ? '' : current); }} className="rounded-lg border border-[#E1E3D8] p-4 dark:border-slate-700"><summary className="cursor-pointer text-sm font-medium">{note.title}<span className="ml-2 text-xs font-normal text-[#818879]">{note.type === 'QUESTIONS' ? 'Questions' : note.title === 'Reading note' ? 'Note' : 'Explanation'}{note.pageNumber ? ` / page ${note.pageNumber}` : ''}</span></summary><div className="mt-4 space-y-3">{note.selectedText && <blockquote className="border-l-2 border-[#BCCBAC] pl-3 text-xs leading-6 text-[#818879]">{note.selectedText}</blockquote>}<MarkdownRenderer content={note.content} />{note.pageNumber && <button type="button" className="quiet-link text-xs" onClick={() => props.onJumpPage(note.pageNumber!)}>Back to page {note.pageNumber}</button>}<p className="text-[11px] text-[#818879]">Saved {new Date(note.createdAt).toLocaleDateString()}</p></div></details>)}</div>
  </section>;
}
