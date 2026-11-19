import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Brain, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { getDueRecallCards, scheduleRecall, topicKey } from '../utils/dailyReview';
import type { RecallCard, RecallProgressMap, RecallRating } from '../utils/dailyReview';

interface DailyReviewProps {
  cards: RecallCard[];
  progress: RecallProgressMap;
  onReview: (id: string, rating: RecallRating) => boolean;
  storageError: boolean;
}

const panel = 'study-panel p-5 sm:p-6';
const button = 'rounded-lg border border-[#E2E6DD] px-4 py-3 text-sm font-semibold hover:bg-[#E3EFE8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#36624B] dark:border-slate-600 dark:hover:bg-[#263A2E]';

function RecallExercise({ card, progress, onReview }: {
  card: RecallCard;
  progress: RecallProgressMap;
  onReview: DailyReviewProps['onReview'];
}) {
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ratings: { rating: RecallRating; label: string }[] = [
    { rating: 'again', label: 'Forgot / incorrect' },
    { rating: 'unsure', label: 'Unsure / guessed' },
    { rating: 'remembered', label: 'Remembered correctly' },
  ];

  return (
    <article className={`${panel} space-y-5`} aria-labelledby="recall-prompt">
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#36624B] dark:text-[#88D4A8]">
        <span>{card.subject}</span><span aria-hidden="true">·</span><span>{card.topic}</span>
        {card.isMistake && <span className="rounded bg-[#FBEAE8] px-2 text-[#9B3E33]">From your mistakes</span>}
      </div>
      <h2 id="recall-prompt" className="text-lg font-semibold">{card.prompt}</h2>
      {card.statements.length > 0 && <ol className="list-decimal space-y-2 pl-6 text-sm">{card.statements.map((statement, index) => <li key={index}>{statement}</li>)}</ol>}
      <p className="text-sm text-[#5C646B] dark:text-slate-300">Recall the answer in your own words. For statement questions, explain which statements are true or false. Options appear after you try.</p>
      <div>
        <label htmlFor="recall-answer" className="mb-2 block text-sm font-semibold">Your answer from memory</label>
        <textarea id="recall-answer" value={answer} onChange={event => setAnswer(event.target.value)} readOnly={revealed}
          rows={3} placeholder="What do you remember? A short answer is enough."
          className="w-full rounded-xl border border-[#E2E6DD] bg-[#F7F8F5] p-3 text-sm focus-visible:outline-2 focus-visible:outline-[#36624B] dark:border-slate-600 dark:bg-[#121816]" />
      </div>
      {!revealed ? <div className="flex flex-wrap gap-3">
        <button type="button" className={`${button} bg-[#36624B] text-white hover:bg-[#2A4F3C] disabled:opacity-50`} disabled={!answer.trim()} onClick={() => setRevealed(true)}>Reveal and compare</button>
        <button type="button" className={button} onClick={() => setRevealed(true)}>I can’t recall it</button>
      </div> : <div className="space-y-4">
        <div className="space-y-3 rounded-xl bg-[#F0F6F1] p-4 text-sm dark:bg-[#121E17]">
          <p><strong>Correct answer:</strong> {card.answer}</p>
          <p>{card.explanation}</p>
          {card.memoryHook && <p><strong>Memory hook / shortcut:</strong> {card.memoryHook}</p>}
          <details><summary className="cursor-pointer font-semibold">Original options</summary><ul className="mt-2 space-y-1">{card.options.map((option, index) => <li key={index}>{option}</li>)}</ul></details>
          <p className="text-xs text-[#5C646B] dark:text-slate-400">Source: {card.source}</p>
        </div>
        <p className="text-sm font-semibold">Compare your answer, then rate your recall. Your written answer is not automatically graded.</p>
        <div className="grid gap-2 sm:grid-cols-3">{ratings.map(({ rating, label }) => {
          const next = scheduleRecall(progress[card.id], rating);
          const delay = rating === 'again' ? '10 minutes' : `${Math.round((next.dueAt - next.lastReviewedAt) / 86_400_000)} day${next.dueAt - next.lastReviewedAt > 86_400_000 ? 's' : ''}`;
          return <button key={rating} type="button" disabled={submitting} className={`${button} disabled:opacity-50`} onClick={() => {
            if (submitting) return;
            setSubmitting(true);
            if (!onReview(card.id, rating)) setSubmitting(false);
          }}>{label}<span className="mt-1 block text-xs font-normal">Review in {delay}</span></button>;
        })}</div>
        {card.chapterId && <Link className="inline-block text-sm underline underline-offset-4" to={`/learning/${card.chapterId}`}>Revisit this lesson</Link>}
      </div>}
    </article>
  );
}

export function DailyReview({ cards, progress, onReview, storageError }: DailyReviewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTopic = searchParams.get('topic') || '';
  const setSelectedTopic = (topic: string) => setSearchParams(topic ? { topic } : {});
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    const refresh = () => setNow(Date.now());
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const topics = [...new Map(cards.map(card => [topicKey(card), `${card.subject} — ${card.topic}`])).entries()];
  const due = getDueRecallCards(cards, progress, Math.max(now, Date.now()), selectedTopic);
  const current = due[0];
  const filtered = cards.filter(card => !selectedTopic || topicKey(card) === selectedTopic);
  const today = new Date().toDateString();
  const reviewedToday = filtered.filter(card => progress[card.id] && new Date(progress[card.id].lastReviewedAt).toDateString() === today).length;
  const nextDue = filtered.reduce((next, card) => Math.min(next, progress[card.id]?.dueAt ?? Infinity), Infinity);

  return <div className="mx-auto max-w-3xl space-y-5 pb-12">
    <header className={`${panel} space-y-3`}>
      <div className="flex items-center gap-3"><Brain className="h-8 w-8 text-[#36624B] dark:text-[#88D4A8]" /><h1 className="text-2xl font-bold">Daily Recall</h1></div>
      <p className="text-sm text-[#5C646B] dark:text-slate-300">A small review before you learn something new. Try 5 minutes: recall, compare, then schedule your next review.</p>
      <p className="text-xs text-[#5C646B] dark:text-slate-400">Successful recall returns in 1, 3, 7, 14, then 30 days. Guesses return tomorrow; forgotten answers return in 10 minutes.</p>
    </header>
    {storageError && <p role="alert" className="rounded-xl bg-[#FBEAE8] p-4 text-sm text-[#9B3E33]">Your review could not be saved. Enable browser storage or free some space, then rate the card again.</p>}
    <section className={`${panel} space-y-4`} aria-label="Review queue">
      <div className="flex flex-wrap gap-5 text-sm" aria-live="polite">
        <span className="flex items-center gap-2"><CalendarCheck className="h-4 w-4" /><strong>{due.length}</strong> due now</span>
        <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><strong>{reviewedToday}</strong> cards reviewed today</span>
      </div>
      <label htmlFor="review-topic" className="block text-sm font-semibold">Review topic</label>
      <select id="review-topic" value={selectedTopic} onChange={event => setSelectedTopic(event.target.value)} className="w-full rounded-lg border border-[#E2E6DD] bg-[#F7F8F5] p-3 text-sm dark:border-slate-600 dark:bg-[#121816]">
        <option value="">All my studied topics</option>
        {selectedTopic && !topics.some(([key]) => key === selectedTopic) && <option value={selectedTopic}>Selected chapter</option>}
        {topics.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <p className="text-xs text-[#5C646B] dark:text-slate-400">Cards come only from completed Study Hub chapters and your attempted practice questions. The topic filter stays within the exact topic you choose. Progress is saved in this browser.</p>
    </section>
    {current ? <RecallExercise key={current.id} card={current} progress={progress} onReview={onReview} /> : <section className={`${panel} space-y-3 text-center`}>
      <CheckCircle2 className="mx-auto h-9 w-9 text-[#36624B] dark:text-[#88D4A8]" />
      <h2 className="text-lg font-semibold">{filtered.length ? 'You’re caught up!' : 'Build your first review cards'}</h2>
      <p className="text-sm text-[#5C646B] dark:text-slate-300">{filtered.length
        ? `Next review: ${Number.isFinite(nextDue) ? new Date(nextDue).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'after your next lesson'}. Take a break or learn one small concept.`
        : 'Complete a chapter in the Study Hub or attempt a question in the AI Tutor. Your recall cards will appear here.'}</p>
      <Link to="/learning" className="inline-block rounded-lg bg-[#36624B] px-5 py-3 text-sm font-semibold text-white">Learn one small topic</Link>
    </section>}
  </div>;
}
