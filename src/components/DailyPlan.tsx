import { LoadingIndicator } from './LoadingIndicator';
import { useSyllabus } from '../context/SyllabusContext';
import { SyllabusStatus } from './SyllabusOutline';
import { apiFetch } from '../lib/api';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock3, CalendarDays } from 'lucide-react';
import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { useStudyPreferences } from '../context/StudyPreferences';
import { useAuth } from '../context/AuthContext';
import { buildDailyPlan, carryDailyPlan, DAILY_PLAN_KEY, localPlanDate, parseDailyPlan, type DailyPlanState, type PlanBudget } from '../utils/dailyPlan';
import type { ChapterProgress, MistakeRecord, Question } from '../types';
import { applyPlanDecision, validatePlanDecision } from '../utils/aiDailyPlan';

export function DailyPlan({ chapterProgress, questions, mistakes, dueCount }: { chapterProgress: Record<string, ChapterProgress>; questions: Question[]; mistakes: MistakeRecord[]; dueCount: number }) {
  const { canUseAi } = useAuth();
  const { exam } = useStudyPreferences();
  const { chapters, status } = useSyllabus();
  const syllabusChapters = exam === 'SSC_CPO' ? undefined : chapters;
  const waitingForSyllabus = exam !== 'SSC_CPO' && status !== 'ready';
  const [saved, setSaved] = useState(() => { try { return parseDailyPlan(localStorage.getItem(DAILY_PLAN_KEY)); } catch { return null; } });
  const [budget, setBudget] = useState<PlanBudget>(saved?.budget || 20);
  const [today, setToday] = useState(localPlanDate);
  const [error, setError] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const aiRequest = useRef<AbortController | null>(null);
  const autoBuiltPlan = useRef('');
  useEffect(() => () => aiRequest.current?.abort(), []);
  useEffect(() => { aiRequest.current?.abort(); setAiBusy(false); setAiError(''); }, [exam, today]);
  useEffect(() => {
    const refresh = () => setToday(localPlanDate());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const current = saved?.date === today && saved.exam === exam ? saved : null;
  const previous = saved && saved.exam === exam && saved.date < today ? saved : null;
  const persist = (next: DailyPlanState) => {
    setSaved(next);
    try { localStorage.setItem(DAILY_PLAN_KEY, JSON.stringify(next)); setError(false); } catch { setError(true); }
  };
  const create = (carry = false) => {
    const fresh = buildDailyPlan({ budget, exam, chapters: LEARNING_CHAPTERS, syllabusChapters, progress: chapterProgress, questions, mistakes, dueCount });
    persist(carry && previous ? carryDailyPlan(previous, fresh) : fresh);
  };
  useEffect(() => {
    const planKey = `${today}:${exam}`;
    if (!waitingForSyllabus && !current && !previous && syllabusChapters?.length && autoBuiltPlan.current !== planKey) {
      autoBuiltPlan.current = planKey;
      create();
    }
  }, [today, exam, waitingForSyllabus, syllabusChapters?.length]);
  const changeBudget = (nextBudget: PlanBudget) => {
    aiRequest.current?.abort(); setAiBusy(false); setAiError('');
    setBudget(nextBudget);
    if (current) {
      const resized = buildDailyPlan({ budget: nextBudget, exam, chapters: LEARNING_CHAPTERS, syllabusChapters, progress: chapterProgress, questions, mistakes, dueCount });
      persist({ ...current, aiReason: undefined, budget: nextBudget, tasks: current.tasks.map(task => ({ ...task, minutes: resized.tasks.find(item => item.id === task.id)!.minutes })) });
    }
  };
  const updateTask = (id: string, action: 'done' | 'deferred') => {
    aiRequest.current?.abort(); setAiBusy(false);
    if (current) persist({ ...current, tasks: current.tasks.map(task => task.id === id ? { ...task, [action]: !task[action], ...(action === 'done' ? { deferred: false } : { done: false }) } : task) });
  };
  const askAi = async () => {
    if (aiRequest.current && !aiRequest.current.signal.aborted && aiBusy) return;
    const controller = new AbortController(); aiRequest.current = controller;
    setAiBusy(true); setAiError('');
    const completed = Object.keys(chapterProgress).filter(id => chapterProgress[id]?.isCompleted);
    const counts: Record<string, number> = {};
    for (const question of questions) {
      if ((exam === 'BOTH' || question.targetExam.includes(exam)) && mistakes.some(mistake => mistake.questionId === question.id)) counts[question.subject] = (counts[question.subject] || 0) + 1;
    }
    const timer = window.setTimeout(() => controller.abort(), 40_000);
    try {
      const response = await apiFetch('/api/ai/daily-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ exam, budget: current?.budget || budget, completed, mistakes: counts, dueCount, catalog: !!syllabusChapters }) });
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('The AI planner endpoint is unavailable. Restart the app server to load the update.');
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'OpenAI could not decide a plan. Try again.');
      const decision = validatePlanDecision(body.decision, exam, completed, syllabusChapters);
      if (controller.signal.aborted) return;
      const base = current || buildDailyPlan({ budget, exam, chapters: LEARNING_CHAPTERS, syllabusChapters, progress: chapterProgress, questions, mistakes, dueCount });
      persist({ ...applyPlanDecision(base, decision, completed, syllabusChapters), aiReason: decision.reason });
    } catch (failure) {
      if (aiRequest.current === controller) setAiError(failure instanceof Error && failure.name !== 'AbortError' ? failure.message : 'The AI request was cancelled or timed out. Your plan is unchanged.');
    } finally { window.clearTimeout(timer); if (aiRequest.current === controller) setAiBusy(false); }
  };
  const done = current?.tasks.filter(task => task.done).length || 0;
  return <section className="study-panel overflow-hidden" aria-labelledby="daily-plan-title">
    <div className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">A manageable next step</p><h2 id="daily-plan-title" className="mt-2 text-xl font-semibold">What should I study today?</h2><p className="mt-2 text-sm leading-6 text-[#777E70] dark:text-slate-400">UPSC CAPF · Learn, practise and recall at your pace.</p></div><fieldset><legend className="mb-2 text-xs text-[#777E70] dark:text-slate-400">Time available today</legend><div className="flex gap-2">{([20, 45, 90] as const).map(minutes => <button key={minutes} onClick={() => changeBudget(minutes)} aria-pressed={(current?.budget || budget) === minutes} className={`rounded-lg border px-3 py-2 text-xs ${(current?.budget || budget) === minutes ? 'border-[#52744d] bg-[#E9EFE9] font-semibold text-[#315840] dark:bg-[#273C2E] dark:text-[#B2D7BA]' : 'border-[#DDE1D7] dark:border-slate-700'}`}>{minutes} min</button>)}</div></fieldset></div>
      {waitingForSyllabus && <SyllabusStatus />}
      {error && <p className="mt-4 text-sm text-rose-700 dark:text-rose-300" role="alert">Your plan could not be saved on this device. Keep this tab open. <button className="underline" onClick={() => saved && persist(saved)}>Retry saving</button></p>}
      {canUseAi && <div className="mt-5 rounded-xl border border-[#DDE1D7] p-4 dark:border-slate-700"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Let AI help you decide</h3><p className="mt-1 text-xs leading-5 text-[#777E70] dark:text-slate-400">OpenAI uses the full CAPF chapter outline, your completed chapters, mistake counts and due-card count. Completed and deferred tasks stay saved.</p></div><button className="secondary-button" disabled={waitingForSyllabus || aiBusy || done === 4} onClick={() => void askAi()}>{aiBusy ? 'Thinking about your next step…' : current?.aiReason ? 'Ask OpenAI again' : 'Decide my plan with OpenAI'}</button></div>{aiBusy && <LoadingIndicator className="mt-3 text-xs" label="Choosing an eligible chapter and task order…" />}{aiError && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{aiError}</p>}{current?.aiReason && <div className="mt-3 border-t border-[#DDE1D7] pt-3 dark:border-slate-700"><p className="eyebrow">Why this plan · OpenAI suggestion</p><p className="mt-2 text-sm leading-6">{current.aiReason}</p></div>}</div>}
      {!current ? <div className="mt-5 space-y-4"><p className="text-sm leading-6">Your plan uses unfinished chapters, recorded mistakes and due revision. Maths gets a short daily slot.</p>{previous && previous.tasks.some(task => !task.done) && <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"><CalendarDays size={17} className="mb-2" />{previous.tasks.filter(task => !task.done).length} unfinished tasks from {previous.date}. You can carry these forward with today’s time allowance.<button className="mt-3 block underline underline-offset-4" disabled={waitingForSyllabus} onClick={() => create(true)}>Carry unfinished tasks into today</button></div>}<button className="primary-button" disabled={waitingForSyllabus} onClick={() => create()}>Build my {budget}-minute plan <ArrowRight size={16} /></button></div> : <div className="mt-5"><div className="flex justify-between text-xs"><span>{done} of {current.tasks.length} tasks checked off</span><span>{current.tasks.filter(task => !task.done && !task.deferred).reduce((sum, task) => sum + task.minutes, 0)} min planned remaining</span></div><progress className="study-progress mt-3" max={4} value={done} aria-label="Daily plan tasks checked off" /><p className="mt-2 text-xs leading-5 text-[#777E70] dark:text-slate-400">Time is an estimate. Check off tasks yourself; this records your session, not mastery.</p></div>}
    </div>
    {current && <div className="divide-y divide-[#E6E7DE] border-t border-[#E6E7DE] dark:divide-slate-800 dark:border-slate-800">{current.tasks.map((task, index) => <article key={task.id} className={`p-5 sm:px-6 ${task.deferred ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}><div className="flex items-start gap-3"><button className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${task.done ? 'border-[#52744d] bg-[#52744d] text-white' : 'border-[#CBD3C1]'}`} aria-label={`${task.done ? 'Mark unfinished' : 'Mark done'}: ${task.title}`} aria-pressed={task.done} onClick={() => updateTask(task.id, 'done')}>{task.done ? <Check size={16} /> : index + 1}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-semibold">{task.title}</h3><span className="flex items-center gap-1 text-xs text-[#777E70] dark:text-slate-400"><Clock3 size={13} />{task.minutes} min</span></div><p className="mt-2 text-xs leading-6 text-[#777E70] dark:text-slate-400">{task.detail}</p>{task.done ? <p className="mt-3 text-xs font-medium text-[#52744d] dark:text-[#B2D7BA]">Checked off for today</p> : <div className="mt-3 flex flex-wrap gap-4">{!task.deferred && <Link className="quiet-link text-xs" to={task.path}>Open task <ArrowRight size={14} /></Link>}<button className="text-xs underline underline-offset-4" onClick={() => updateTask(task.id, 'deferred')}>{task.deferred ? 'Bring back to today' : 'Move to next day'}</button></div>}{task.deferred && <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">Set aside. Use “Carry unfinished tasks” when you return tomorrow.</p>}</div></div></article>)}<div className="p-5 text-xs leading-6 text-[#777E70] dark:text-slate-400">{done === 4 ? 'Today’s plan is checked off. You can stop here, or revisit anything you want to understand better.' : 'A partial session counts. Unfinished tasks can be carried forward tomorrow.'} Your plan stays in this browser on this device.</div></div>}
  </section>;
}
