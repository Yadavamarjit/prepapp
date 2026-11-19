import { apiFetch } from '../lib/api';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react';
import { AFFAIR_TOPICS, enrollAffair, type AffairProgress, type AffairStory } from '../utils/currentAffairs';

function StoryQuiz({ story, onMiss }: { story: AffairStory; onMiss: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return <div className="mt-6 space-y-5"><h3 className="section-title">Quick recall · try before checking</h3>{story.lesson!.quiz.map((quiz, index) => <fieldset key={index}><legend className="text-sm font-medium">{index + 1}. {quiz.question}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{quiz.options.map((option, choice) => <button key={choice} disabled={answers[index] !== undefined} aria-pressed={answers[index] === choice} className={`rounded-lg border p-3 text-left text-xs leading-5 ${answers[index] === choice ? 'border-[#52744d] bg-[#E9EFE9] dark:bg-[#273C2E]' : 'border-[#DDE1D7] dark:border-slate-700'}`} onClick={() => { setAnswers({ ...answers, [index]: choice }); if (choice !== quiz.answer) onMiss(); }}>{option}</button>)}</div>{answers[index] !== undefined && <div className="mt-3 rounded-lg bg-[#F0F3E9] p-4 text-xs leading-6 dark:bg-[#25352A]" role="status"><p className="font-semibold">{answers[index] === quiz.answer ? 'Correct.' : `Answer: ${quiz.options[quiz.answer]}`}</p><p>{quiz.explanation}</p><p className="mt-2">Source evidence: “{quiz.evidence}”</p>{answers[index] !== quiz.answer && <p className="mt-2">Added to Daily Recall for review.</p>}</div>}</fieldset>)}</div>;
}

export function CurrentAffairs({ progress, onChange, storageError }: { progress: AffairProgress; onChange: (next: AffairProgress) => void; storageError: boolean }) {
  const [stories, setStories] = useState<AffairStory[]>([]);
  const latest = useRef({ progress, onChange }); latest.current = { progress, onChange };
  const [tab, setTab] = useState('Today');
  const [topic, setTopic] = useState('All');
  const [month, setMonth] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState('');
  const [statuses, setStatuses] = useState<{ source: string; ok: boolean; count: number }[]>([]);
  const load = async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      const response = await apiFetch('/api/current-affairs', { signal });
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Restart the app server to load the Current Affairs desk.');
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not load stories.');
      setStories(body.stories); setCheckedAt(body.checkedAt || ''); setStatuses(body.statuses || []);
    } catch (failure) { if (!signal?.aborted) setError(failure instanceof Error ? failure.message : 'Stories could not be loaded.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  };
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, []);
  const learn = async (story: AffairStory) => {
    setSelected(story.id); if (story.lesson) return;
    setBusy(true); setError('');
    try {
      const response = await apiFetch(`/api/current-affairs/${story.id}/learn`, { method: 'POST', signal: AbortSignal.timeout(60000) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'This story could not be prepared.');
      setStories(previous => previous.map(item => item.id === story.id ? body.story : item));
      const current = latest.current;
      if (current.progress.saved.includes(story.id)) current.onChange(enrollAffair(current.progress, body.story));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'The explanation could not be prepared.'); }
    finally { setBusy(false); }
  };
  const save = (story: AffairStory) => {
    if (progress.saved.includes(story.id)) onChange({ ...progress, saved: progress.saved.filter(id => id !== story.id), cards: progress.missed.includes(story.id) ? progress.cards : progress.cards.filter(card => !card.id.startsWith(`affair:${story.id}:`)) });
    else onChange(story.lesson ? enrollAffair(progress, story) : { ...progress, saved: [...progress.saved, story.id] });
  };
  const filtered = stories.filter(story => (topic === 'All' || story.topic === topic) && (month === 'All' || story.publishedAt.startsWith(month)) && (tab !== 'Revision' || progress.saved.includes(story.id) || progress.missed.includes(story.id)));
  const shown = tab === 'Today' ? filtered.slice(0, 5) : filtered;
  const story = stories.find(item => item.id === selected);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return <div className="space-y-6"><header><p className="eyebrow">Read a little. Remember what matters.</p><h1 className="page-title mt-2">Current Affairs</h1><p className="page-description">Official releases, simple explanations and source-grounded recall for CAPF.</p><p className="mt-3 text-xs leading-6 text-[#777E70] dark:text-slate-400">Starting with PIB and RBI. Topic tags suggest syllabus relevance; they do not predict exam questions. OpenAI explanations are study aids—check the linked source.</p></header>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2" role="group" aria-label="Current affairs views">{['Today', 'Topics', 'Revision'].map(item => <button key={item} aria-pressed={tab === item} onClick={() => setTab(item)} className={tab === item ? 'primary-button' : 'secondary-button'}>{item}</button>)}</div><button className="secondary-button" disabled={loading || busy} onClick={() => void load()}><RefreshCw size={14} className="mr-2" />Check feeds</button></div>
    <div className="flex flex-wrap gap-4"><label className="text-xs">Topic<select className="study-input ml-2" value={topic} onChange={event => setTopic(event.target.value)}>{['All', ...AFFAIR_TOPICS].map(item => <option key={item}>{item}</option>)}</select></label><label className="text-xs">Month<select className="study-input ml-2" value={month} onChange={event => setMonth(event.target.value)}>{['All', ...new Set(stories.map(item => item.publishedAt.slice(0, 7)))].map(item => <option key={item}>{item}</option>)}</select></label><Link className="quiet-link text-xs" to="/daily-review">Daily Recall <ArrowRight size={14} /></Link></div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</p>}{storageError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">Your reading progress could not be saved on this device.</p>}
    <div className="flex flex-wrap gap-3 text-xs text-[#777E70] dark:text-slate-400">{checkedAt && <span>Last feed check: {new Date(checkedAt).toLocaleString('en-IN')}</span>}{statuses.map(status => <span key={status.source}>{status.source}: {status.ok ? `${status.count} recent releases` : 'feed unavailable · cached stories may remain'}</span>)}</div>
    {tab === 'Today' && <p className="text-xs text-[#777E70] dark:text-slate-400">Your five latest matching releases. Publication dates show how recent they are; some may be from earlier days.</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"><div className="space-y-3">{loading && <p role="status">Checking official feeds…</p>}{!loading && !shown.length && <div className="study-panel p-6"><h2 className="section-title">{tab === 'Revision' ? 'Your revision shelf is empty' : 'No matching releases yet'}</h2><p className="mt-3 text-sm leading-6">{tab === 'Revision' ? 'Save a story or try a quiz to build your review queue.' : 'Try another filter. If feeds are unavailable, try again later; no invented headlines are shown.'}</p></div>}{shown.map(item => <article key={item.id} className={`study-panel p-5 ${selected === item.id ? 'ring-2 ring-[#52744d]' : ''}`}><div className="flex justify-between gap-3"><span className="eyebrow">{item.topic}</span><button aria-label={`Save: ${item.title}`} aria-pressed={progress.saved.includes(item.id)} onClick={() => save(item)} className="p-2 text-[#52744d]"><Bookmark size={18} fill={progress.saved.includes(item.id) ? 'currentColor' : 'none'} /></button></div><h2 className="mt-2 text-base font-semibold leading-6">{item.title}</h2><p className="mt-3 text-xs text-[#777E70] dark:text-slate-400">{item.source} · {formatDate(item.publishedAt)}{progress.read.includes(item.id) ? ' · Read' : ''}</p><div className="mt-4 flex flex-wrap gap-4"><button className="quiet-link text-xs" disabled={busy} onClick={() => void learn(item)}>{item.lesson ? 'Read & practise' : 'Explain with OpenAI'}<ArrowRight size={14} /></button><a className="quiet-link text-xs" href={item.url} target="_blank" rel="noreferrer">Source<ExternalLink size={12} /></a></div></article>)}{tab === 'Today' && filtered.length > 5 && <button className="secondary-button" onClick={() => setTab('Topics')}>Browse all {filtered.length} matching releases</button>}</div>
      <div className="study-panel p-5 sm:p-6 lg:sticky lg:top-24">{!story ? <div className="py-8"><h2 className="section-title">Choose one story to begin</h2><p className="mt-3 text-sm leading-6 text-[#777E70] dark:text-slate-400">Read an explanation, connect it to the syllabus, then answer two short questions. Save useful stories for revision.</p></div> : <><p className="eyebrow">{story.source} · {formatDate(story.publishedAt)}</p><h2 className="mt-3 text-xl font-semibold leading-8">{story.title}</h2><a className="quiet-link mt-3 text-xs" href={story.url} target="_blank" rel="noreferrer">Read official release <ExternalLink size={13} /></a>{busy && <p role="status" className="mt-5 text-sm">Reading the official article and preparing your lesson…</p>}{!busy && !story.lesson && <button className="primary-button mt-5" onClick={() => void learn(story)}>Prepare explanation & quiz</button>}{story.lesson && <div className="mt-6 space-y-5"><div><h3 className="section-title">What happened</h3><p className="mt-2 text-sm leading-7">{story.lesson.summary}</p></div><div><h3 className="section-title">Why study it?</h3><p className="mt-2 text-sm leading-7">{story.lesson.why}</p></div><div className="rounded-xl bg-[#EEF1E9] p-4 dark:bg-[#273C2E]"><h3 className="section-title">Keep these facts</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{story.lesson.facts.map(fact => <li key={fact}>{fact}</li>)}</ul></div><details><summary className="cursor-pointer text-sm font-medium">Paper II discussion angle</summary><p className="mt-3 text-sm leading-7">{story.lesson.paper2}</p><Link className="quiet-link mt-3 text-xs" to="/paper-2">Open writing practice <ArrowRight size={14} /></Link></details><StoryQuiz key={story.id} story={story} onMiss={() => onChange(enrollAffair(progress, story, true))} /><div className="flex flex-wrap gap-3 border-t border-[#DDE1D7] pt-5 dark:border-slate-700"><button className="secondary-button" onClick={() => save(story)}>{progress.saved.includes(story.id) ? 'Remove bookmark' : 'Save for recall'}</button><button className="primary-button" onClick={() => onChange({ ...progress, read: progress.read.includes(story.id) ? progress.read.filter(id => id !== story.id) : [...progress.read, story.id] })}>{progress.read.includes(story.id) ? 'Mark unread' : 'Mark as read'}</button></div><p className="text-xs leading-6 text-[#777E70] dark:text-slate-400">Explanations are cached in the server’s local database. Reading progress and saved recall cards stay in this browser.</p></div>}</>}</div></div>
  </div>;
}
