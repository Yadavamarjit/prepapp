import { LoadingIndicator } from './LoadingIndicator';
import { TextbookPageImage, TextbookPdfFrame } from './TextbookMedia';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, ExternalLink, Search } from 'lucide-react';
import { READING_BOOKS, resolveReadingChapter } from '../data/readingLibrary';
import type { ReadingBook } from '../data/readingLibrary';
import { BOOK_PROGRESS_KEY, parseBookProgress, recordBookPosition, toggleBookChapter } from '../utils/bookProgress';
import type { BookProgress, BookProgressMap } from '../utils/bookProgress';
import { BookStudyTools } from './BookStudyTools';
import type { BookStudyToolsHandle } from './BookStudyTools';

interface BookPage {
  pageNumber: number;
  width: number;
  height: number;
  imagePath: string;
  blocks: { text: string; left: number; top: number; width: number; height: number }[];
}

export function BooksLibrary() {
  const { bookCode, chapterNumber } = useParams();
  const [progress, setProgress] = useState(() => {
    try { return parseBookProgress(localStorage.getItem(BOOK_PROGRESS_KEY)); } catch { return {}; }
  });
  const latest = useRef(progress);
  const [storageError, setStorageError] = useState(false);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const save = useCallback((update: (previous: BookProgressMap) => BookProgressMap) => {
    const next = update(latest.current);
    latest.current = next;
    setProgress(next);
    try { localStorage.setItem(BOOK_PROGRESS_KEY, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }, []);
  const onPosition = useCallback((code: string, chapter: number, page: number) => save(previous => recordBookPosition(previous, code, chapter, page)), [save]);
  const onComplete = useCallback((code: string, chapter: number, page: number) => save(previous => toggleBookChapter(previous, code, chapter, page)), [save]);
  const { book, chapter } = resolveReadingChapter(bookCode, chapterNumber);
  const alert = storageError ? <p role="alert" className="rounded-lg bg-[#FBEAE8] p-3 text-sm text-[#9B3E33]">Reading progress could not be saved. Check your browser storage. Keep this page open until you can save again.</p> : null;

  if (bookCode && (!book || (chapterNumber && !chapter))) return <section className="study-panel space-y-4 p-7"><h1 className="page-title">Book or chapter not found</h1><Link to="/books" className="quiet-link">Back to books</Link></section>;
  if (book && chapter) return <div className="space-y-4">{alert}<BookReader key={`${book.code}:${chapter.number}`} book={book} chapter={chapter} progress={progress[book.code]} onPosition={onPosition} onComplete={onComplete} /></div>;
  if (book) return <div className="space-y-6">{alert}<Link to="/books" className="quiet-link text-xs"><ArrowLeft size={14} />All books</Link><header><p className="eyebrow">NCERT / Class {book.grade} / {book.subject}</p><h1 className="page-title mt-2">{book.title}</h1><p className="page-description">Read the original textbook, chapter by chapter, with the diagrams and examples included.</p></header><div className="flex flex-wrap items-center gap-4"><Link to={`/books/${book.code}/${progress[book.code]?.chapter || 1}`} className="primary-button">{progress[book.code] ? 'Continue reading' : 'Start reading'}<ArrowRight size={15} /></Link><span className="text-xs text-[#818879]">{progress[book.code]?.completed.length || 0} of {book.chapters.length} chapters completed</span></div><BookContents book={book} progress={progress[book.code]} /></div>;
  const books = READING_BOOKS.filter(item => (!subject || item.subject === subject) && `${item.title} ${item.subject} ${item.grade}`.toLowerCase().includes(search.toLowerCase()));
  const recent = READING_BOOKS.filter(item => progress[item.code]).sort((a, b) => progress[b.code].updatedAt - progress[a.code].updatedAt)[0];
  return <div className="space-y-7">{alert}<header><p className="eyebrow">Learn from the original</p><h1 className="page-title mt-2">Read a book</h1><p className="page-description">Full textbook chapters to read at your own pace. Your place is saved as you turn the pages.</p></header>
    {recent && <section className="study-panel flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="eyebrow">Continue reading</p><h2 className="section-title mt-2">Class {recent.grade}: {recent.title}</h2><p className="mt-2 text-xs text-[#818879]">Chapter {progress[recent.code].chapter}, page {progress[recent.code].page}</p></div><Link to={`/books/${recent.code}/${progress[recent.code].chapter}`} className="primary-button">Continue<ArrowRight size={15} /></Link></section>}
    <div className="flex flex-col gap-3 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-lg border border-[#DEE1D4] bg-white px-3 dark:border-slate-700 dark:bg-[#1A2420]"><Search size={16} /><input aria-label="Search textbooks" className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Search by book, subject, or class" value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Book subject" value={subject} onChange={event => setSubject(event.target.value)} className="study-input !w-auto !py-3"><option value="">All subjects</option>{[...new Set(READING_BOOKS.map(item => item.subject))].map(item => <option key={item}>{item}</option>)}</select></div>
    <div className="grid gap-4 sm:grid-cols-2">{books.map(item => <Link key={item.code} to={`/books/${item.code}`} className="study-panel flex items-start gap-4 p-6 transition-colors hover:bg-[#F7F8F3] dark:hover:bg-[#1E2B22]"><span className="rounded-lg bg-[#EEF1E9] p-3 text-[#57704D] dark:bg-[#273C2E]"><BookOpen size={24} strokeWidth={1.5} /></span><div className="min-w-0 flex-1"><p className="eyebrow">Class {item.grade} / {item.subject}</p><h2 className="section-title mt-2 leading-6">{item.title}</h2><p className="mt-3 text-xs text-[#818879]">{item.chapters.length} chapters / Original textbook</p><p className="mt-2 text-xs text-[#818879]">{progress[item.code]?.completed.length || 0} completed</p></div><ArrowRight size={15} className="mt-2 shrink-0 text-[#818879]" /></Link>)}</div>
    {!books.length && <p className="study-panel p-6 text-sm text-[#818879]">No textbooks match. Try another subject or search.</p>}
    <p className="text-xs leading-6 text-[#818879]">This shelf currently has four NCERT textbooks. Full chapters load from NCERT when needed and are cached on the app server. Other study guides remain under Topic lessons. <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noreferrer" className="underline underline-offset-4">Browse the official NCERT library</a>.</p>
  </div>;
}

function BookContents({ book, progress, active }: { book: ReadingBook; progress?: BookProgress; active?: number }) {
  return <nav aria-label="Book contents" className="study-panel overflow-hidden"><h2 className="border-b border-[#E6E7DE] p-4 text-sm font-semibold dark:border-slate-800">Contents</h2><ol className="divide-y divide-[#E6E7DE] dark:divide-slate-800">{book.chapters.map(chapter => <li key={chapter.number}><Link to={`/books/${book.code}/${chapter.number}`} aria-current={chapter.number === active ? 'page' : undefined} className={`flex items-start gap-3 px-4 py-4 text-sm leading-6 ${chapter.number === active ? 'bg-[#EEF3E9] text-[#315840] dark:bg-[#273C2E] dark:text-[#B2D7BA]' : 'hover:bg-[#F7F8F3] dark:hover:bg-[#1E2B22]'}`}><span className="w-5 shrink-0 text-xs text-[#818879]">{chapter.number}</span><span className="flex-1">{chapter.title}</span>{progress?.completed.includes(chapter.number) && <Check size={15} className="mt-1 shrink-0" aria-label="Completed" />}</Link></li>)}</ol></nav>;
}

function BookReader({ book, chapter, progress, onPosition, onComplete }: {
  book: ReadingBook; chapter: ReadingBook['chapters'][number]; progress?: BookProgress;
  onPosition: (code: string, chapter: number, page: number) => void;
  onComplete: (code: string, chapter: number, page: number) => void;
}) {
  const { canUseAi } = useAuth();
  const [page, setPage] = useState(progress?.chapter === chapter.number ? progress.page : 1);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [nativePdf, setNativePdf] = useState(false);
  const pageTextRef = useRef<HTMLElement>(null);
  const [selection, setSelection] = useState({ text: '', page });
  const studyActions = useRef<BookStudyToolsHandle>(null);
  const studyPanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const capture = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const selected = window.getSelection();
        const root = pageTextRef.current;
        if (!selected || !root || !selected.anchorNode || !selected.focusNode ||
          !root.contains(selected.anchorNode) || !root.contains(selected.focusNode)) return;
        const text = selected.toString().replace(/\s+/g, ' ').trim();
        if (text.length >= 5) setSelection({ text, page });
      }, 120);
    };
    document.addEventListener('selectionchange', capture);
    return () => { clearTimeout(timer); document.removeEventListener('selectionchange', capture); };
  }, [page]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setPages([]);
    apiFetch(`/api/ncert/pdf-rendered-pages/${book.code}/${chapter.number}`, { signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok || !data.success || !Array.isArray(data.pages) || !data.pages.length) throw new Error('Chapter unavailable'); return data.pages as BookPage[]; })
      .then(data => { setPages(data); setPage(previous => Math.min(previous, data.length)); })
      .catch(() => { if (!controller.signal.aborted) setError('The original chapter could not be loaded. Retry, or open the PDF directly.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [book.code, chapter.number, retry]);
  useEffect(() => { if (pages.length) onPosition(book.code, chapter.number, page); }, [pages.length, book.code, chapter.number, page, onPosition]);
  const current = pages[page - 1];
  const index = book.chapters.findIndex(item => item.number === chapter.number);
  const previous = book.chapters[index - 1];
  const next = book.chapters[index + 1];
  const pdfUrl = `/api/ncert/pdf/${book.code}/${chapter.number}`;
  const complete = progress?.completed.includes(chapter.number);
  return <div className="space-y-5">
    {selection.text && selection.page === page && <div role="toolbar" aria-label="Selected passage actions" className="fixed bottom-24 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap justify-center gap-2 rounded-xl border border-[#DDE1D2] bg-white p-2 shadow-lg lg:bottom-6 dark:border-slate-700 dark:bg-[#1A2420]">
      {canUseAi ? <>
      <button type="button" className="secondary-button" onPointerDown={event => event.preventDefault()} onClick={() => { studyActions.current?.generate('EXPLAIN'); studyPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Explain simply</button>
      <button type="button" className="primary-button" onPointerDown={event => event.preventDefault()} onClick={() => { studyActions.current?.generate('GENERATE_QUESTIONS'); studyPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Generate questions</button>
      </> : <button type="button" className="secondary-button" onPointerDown={event => event.preventDefault()} onClick={() => studyPanel.current?.querySelector('textarea')?.focus()}>Add reading note</button>}
      <button type="button" aria-label="Dismiss text selection actions" className="px-2 text-sm" onClick={() => setSelection({ text: '', page })}>Close</button>
    </div>}
    <Link to={`/books/${book.code}`} className="quiet-link text-xs"><ArrowLeft size={14} />{book.title}<span className="text-[#818879]">/ Class {book.grade}</span></Link>
    <header><p className="eyebrow">Chapter {chapter.number} of {book.chapters.length}</p><h1 className="page-title mt-2">{chapter.title}</h1><p className="page-description">Original NCERT textbook pages, including examples, illustrations, and exercises.</p></header>
    <div className="grid items-start gap-5 xl:grid-cols-[240px_minmax(0,1fr)]"><details className="xl:sticky xl:top-24"><summary className="mb-3 cursor-pointer text-xs font-medium">Chapter list</summary><BookContents book={book} progress={progress} active={chapter.number} /></details><div className="min-w-0 space-y-4">
      <div className="study-panel flex flex-wrap items-center justify-between gap-3 p-3"><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={page <= 1 || loading || !pages.length} className="secondary-button !px-3 !py-2 disabled:opacity-40" onClick={() => setPage(value => value - 1)}><ArrowLeft size={14} /></button><label className="flex items-center gap-2 text-xs">Page<input aria-label="Page number" type="number" min={1} max={pages.length || 1} value={page} disabled={!pages.length} onChange={event => { const number = Number(event.target.value); if (Number.isInteger(number) && number >= 1 && number <= pages.length) setPage(number); }} className="w-12 rounded border border-[#DEE1D4] bg-transparent p-1.5 dark:border-slate-700" /><span>of {pages.length || '-'}</span></label><button type="button" aria-label="Next page" disabled={page >= pages.length || loading} className="secondary-button !px-3 !py-2 disabled:opacity-40" onClick={() => setPage(value => value + 1)}><ArrowRight size={14} /></button></div><div className="flex items-center gap-3"><select aria-label="Reading zoom" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="rounded bg-transparent p-2 text-xs">{[100,125,150,200].map(value => <option key={value} value={value}>{value}%</option>)}</select><a href={`${pdfUrl}#page=${page}`} target="_blank" rel="noreferrer" className="quiet-link text-xs">Open PDF<ExternalLink size={13} /></a></div></div>
      {loading && <LoadingIndicator className="study-panel p-10 text-center text-sm text-[#818879]" label="Loading original chapter pages. The first visit can take a little longer." />}
      {error && <div role="alert" className="study-panel space-y-4 p-6"><p className="text-sm leading-6">{error}</p><div className="flex flex-wrap gap-3"><button type="button" onClick={() => setRetry(value => value + 1)} className="secondary-button">Retry chapter</button><button type="button" onClick={() => setNativePdf(true)} className="secondary-button">Use browser PDF reader</button><a href={`https://ncert.nic.in/textbook/pdf/${book.code}${String(chapter.number).padStart(2, '0')}.pdf`} target="_blank" rel="noreferrer" className="quiet-link text-xs">Official source<ExternalLink size={13} /></a></div></div>}
      {nativePdf && <TextbookPdfFrame title={`${book.title}, chapter ${chapter.number} PDF`} src={pdfUrl} className="h-[75vh] w-full rounded-lg border border-[#DEE1D4]" />}
      {current && <div className="overflow-auto rounded-lg border border-[#DEE1D4] bg-[#EBEDE5] p-2 dark:border-slate-700 dark:bg-[#253128]"><figure ref={pageTextRef} className="relative mx-auto bg-white" style={{ width: `${zoom}%`, aspectRatio: `${current.width}/${current.height}` }}><TextbookPageImage key={current.imagePath} src={current.imagePath} alt={`Original textbook: ${chapter.title}, page ${page}`} className="block h-full w-full" />{current.blocks.map((block, i) => <span key={i} className="absolute select-text overflow-hidden whitespace-nowrap text-transparent selection:bg-[#B3C8A9]/50 selection:text-transparent" style={{ left: `${block.left}%`, top: `${block.top}%`, width: `${block.width}%`, height: `${block.height}%`, fontSize: 'clamp(4px, 1.2vw, 15px)', lineHeight: 1 }}>{block.text}</span>)}</figure></div>}
      {pages.length > 0 && <p aria-live="polite" className="text-center text-xs text-[#818879]">Chapter {chapter.number}, page {page}. Your reading place is saved in this browser.</p>}
      <div ref={studyPanel}><BookStudyTools actionRef={studyActions} bookCode={book.code} bookTitle={book.title} subject={book.subject} chapterNumber={chapter.number} chapterTitle={chapter.title} selectedText={selection.text} selectedPage={selection.page} pageNumber={page} onJumpPage={number => { if (number >= 1 && number <= pages.length) setPage(number); }} /></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className="secondary-button" onClick={() => onComplete(book.code, chapter.number, page)}>{complete ? 'Mark chapter unread' : 'Mark chapter completed'}</button><div className="flex flex-wrap gap-3">{previous && <Link to={`/books/${book.code}/${previous.number}`} className="quiet-link text-xs"><ArrowLeft size={14} />Previous chapter</Link>}{next ? <Link to={`/books/${book.code}/${next.number}`} className="primary-button">Next chapter<ArrowRight size={14} /></Link> : <Link to={`/books/${book.code}`} className="primary-button">Back to book</Link>}</div></div>
    </div></div>
  </div>;
}
