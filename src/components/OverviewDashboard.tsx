import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, BookOpen, PenLine, CalendarDays, RotateCcw } from 'lucide-react';
import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { DailyPlan } from './DailyPlan';
import { useAuth } from '../context/AuthContext';
import { attemptKey, loadAttemptBook, paper, report } from '../utils/capfAttempt';
import type { ChapterProgress, MistakeRecord, Question } from '../types';

interface Props {
  chapterProgress: Record<string, ChapterProgress>;
  dueCount: number;
  reviewedToday: number;
  questions: Question[];
  mistakes: MistakeRecord[];
  solvedQuestionIds: string[];
}

export function OverviewDashboard({ chapterProgress, dueCount, reviewedToday, questions, mistakes }: Props) {
  const { user } = useAuth();
  const key = attemptKey(user?.uid || '');
  const [book, setBook] = useState(() => loadAttemptBook(key));
  const a = book.current;
  useEffect(() => {
    const refresh = () => setBook(loadAttemptBook(key));
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    const timer = a && !a.finished ? window.setTimeout(refresh, Math.max(0, a.deadline - Date.now()) + 1) : undefined;
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.clearTimeout(timer);
    };
  }, [key, a?.deadline, a?.finished]);

  let lastId: string | null = null;
  try { lastId = localStorage.getItem('dutydeck_last_chapter'); } catch {}
  const chapters = LEARNING_CHAPTERS.filter(c => c.examRelevance.includes('UPSC_CAPF'));
  const chapter = chapters.find(c => c.id === lastId && !chapterProgress[c.id]?.isCompleted) || chapters.find(c => !chapterProgress[c.id]?.isCompleted);
  const score = a?.finished ? report(a) : null;
  const count = a?.ids.length || paper.length;
  const practicePath = '/practice/capf-analytica';
  const missed = score?.missed.length || 0;
  const action = !a ? 'Start sectional' : !a.finished ? `Resume at question ${a.index + 1} of ${count}` : missed ? `Retry ${missed} missed ${missed === 1 ? 'question' : 'questions'}` : 'View your report';
  const rows = [
    { to: '/paper-2', icon: PenLine, title: 'Paper II writing', detail: 'Essays, arguments and précis' },
    { to: chapter ? '/learning/' + chapter.id : '/learning', icon: BookOpen, title: chapter?.id === lastId ? 'Continue your lesson' : 'Study a lesson', detail: chapter?.chapterTitle || 'Browse completed lessons' },
    { to: '/daily-review', icon: RotateCcw, title: dueCount ? `Review ${dueCount} recall cards` : 'Revision', detail: reviewedToday ? `${reviewedToday} reviewed today` : dueCount ? 'Due today' : 'Cards appear as you study' }
  ];
  return <div className="mx-auto max-w-5xl">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-current/20 pb-4">
      <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Today’s practice</h1>
      <time className="text-sm opacity-75">{new Date().toLocaleDateString(undefined,{ weekday:'short', month:'short', day:'numeric' })}</time>
    </header>
    <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr]">
      <section className="workbook-cover self-start">
        <p className="workbook-label">CAPF Analytica · Paper I</p>
        <h2 className="my-3 font-serif text-4xl leading-tight sm:text-5xl">{a?.drill ? 'Revision drill' : 'Paper I baseline'}</h2>
        {score ? <div className="workbook-result"><p className="font-serif text-3xl">{score.net.toFixed(2)} / {count * 2} marks</p><p className="mt-1 text-sm">{score.correct} correct · {score.wrong} wrong · {score.skipped} skipped</p></div>
          : <><p className="text-sm font-medium">{count} questions · {count} minutes</p><p className="mt-4 text-sm leading-6">{a ? 'Your answers are saved. The timer continues while you are away.' : 'See what you earn for correct answers and lose to negative marking.'}</p></>}
        <Link className="workbook-button mt-6" to={practicePath} state={{action: !a ? 'start' : missed ? 'retry' : undefined, deadline:a?.deadline}}>{action}<ArrowRight size={18}/></Link>
        {missed > 0 && <Link className="mt-2 inline-flex min-h-11 items-center text-sm underline" to={practicePath}>View full report</Link>}
      </section>
      <div>{rows.map(({to,icon:Icon,title,detail}) => <Link key={to} to={to} className="flex items-center gap-4 border-b border-current/15 py-4 hover:underline">
        <Icon size={20} strokeWidth={1.6} aria-hidden="true"/><span className="flex-1"><strong className="block font-semibold">{title}</strong><span className="mt-1 block text-sm opacity-75">{detail}</span></span><ChevronRight size={16}/>
      </Link>)}</div>
    </div>
    <details className="my-6 border-y border-current/20"><summary className="cursor-pointer py-4 font-semibold"><CalendarDays className="mr-2 inline" size={18}/>Plan my day</summary>
      <div className="pb-4"><DailyPlan chapterProgress={chapterProgress} questions={questions} mistakes={mistakes} dueCount={dueCount}/></div></details>
    <nav aria-label="Study resources" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">{[['/current-affairs','Current affairs'],['/capf-syllabus','CAPF syllabus'],['/analytics','Your progress']].map(([to,label]) => <Link key={to} to={to} className="inline-flex min-h-11 items-center gap-1 hover:underline">{label}<ChevronRight size={14}/></Link>)}</nav>
  </div>;
}
