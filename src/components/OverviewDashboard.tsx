import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, Clock, RotateCcw, PencilLine } from 'lucide-react';
import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { DailyPlan } from './DailyPlan';
import { useAuth } from '../context/AuthContext';
import { useStudyPreferences } from '../context/StudyPreferences';
import type { ChapterProgress, MistakeRecord, Question } from '../types';

interface Props {
  chapterProgress: Record<string, ChapterProgress>;
  dueCount: number;
  reviewedToday: number;
  questions: Question[];
  mistakes: MistakeRecord[];
  solvedQuestionIds: string[];
}
export function OverviewDashboard({ chapterProgress, dueCount, reviewedToday, questions, mistakes, solvedQuestionIds }: Props) {
  const { user } = useAuth();
  const { exam } = useStudyPreferences();
  const chapters = LEARNING_CHAPTERS.filter(chapter => exam === 'BOTH' || chapter.examRelevance.includes(exam));
  let lastId: string | null = null;
  try { lastId = localStorage.getItem('dutydeck_last_chapter'); } catch {}
  const chapter = chapters.find(item => item.id === lastId && !chapterProgress[item.id]?.isCompleted) || chapters.find(item => !chapterProgress[item.id]?.isCompleted) || chapters[0];
  const completed = chapters.filter(item => chapterProgress[item.id]?.isCompleted).length;
  const relevantQuestions = questions.filter(question => exam === 'BOTH' || question.targetExam.includes(exam));
  const attempted = relevantQuestions.filter(question => solvedQuestionIds.includes(question.id)).length;
  const weak = relevantQuestions.filter(question => mistakes.some(mistake => mistake.questionId === question.id)).slice(0, 2);
  const name = user?.displayName?.split(' ')[0];
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{date}</p><h1 className="page-title mt-2">Let?s make a little progress{name ? `, ${name}` : ''}.</h1><p className="page-description">One lesson, a little practice, and a quick review.</p></div><Link to="/books" className="quiet-link">Read a book <ArrowRight size={15} /></Link></header>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-7">
        <DailyPlan chapterProgress={chapterProgress} questions={questions} mistakes={mistakes} dueCount={dueCount} />
        {chapter && <section className="study-panel overflow-hidden">
          <div className="border-b border-[#E6E7DE] px-6 py-4 dark:border-slate-800"><span className="eyebrow">{lastId === chapter.id ? 'Pick up where you left off' : 'Your next lesson'}</span></div>
          <div className="space-y-5 p-6"><div className="flex items-center gap-2 text-sm text-[#687362] dark:text-slate-400"><BookOpen size={16} />{chapter.subject}</div><h2 className="max-w-lg text-2xl font-semibold leading-snug tracking-tight">{chapter.chapterTitle}</h2><p className="text-sm leading-6 text-[#71776A] dark:text-slate-400">{chapter.coreConcepts[0]}</p><div className="flex flex-wrap items-center justify-between gap-4 pt-2"><span className="flex items-center gap-1.5 text-xs text-[#71776A]"><Clock size={14} />{chapter.readTimeMinutes} min ? Lesson + quick check</span><Link to={`/learning/${chapter.id}`} className="primary-button">{lastId === chapter.id ? 'Continue lesson' : 'Start lesson'}<ArrowRight size={16} /></Link></div></div>
        </section>}
        <section><div className="mb-3 flex items-center justify-between"><h2 className="section-title">Study shortcuts</h2><span className="text-xs text-[#7E8477]">Go at your own pace</span></div>
          <div className="study-panel divide-y divide-[#E6E7DE] dark:divide-slate-800">
            {[{ to: '/daily-review', icon: RotateCcw, title: dueCount ? `Revise ${dueCount} recall cards` : reviewedToday ? 'Revision is up to date' : 'Start your revision habit', subtitle: dueCount ? 'Recall before you look at the answers' : reviewedToday ? `${reviewedToday} cards reviewed today` : 'Cards appear as you learn and practise', time: '5 min', done: dueCount === 0 && reviewedToday > 0 },
              { to: chapter ? `/learning/${chapter.id}` : '/learning', icon: BookOpen, title: 'Learn one concept', subtitle: chapter?.subject || 'Choose a subject to get started', time: '10 min', done: false },
              { to: '/ai-tutor', icon: PencilLine, title: 'Practise a selected topic', subtitle: 'Choose your topic and answer a few questions', time: '5 min', done: false }].map(({ to, icon: Icon, title, subtitle, time, done }) => <Link key={title} to={to} className="flex items-center gap-4 px-5 py-5 hover:bg-[#F7F8F3] dark:hover:bg-[#1E2B22]"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done ? 'bg-[#E9EFE9] text-[#315840]' : 'bg-[#F3F3ED] text-[#6A7562] dark:bg-[#253128]'}`}>{done ? <Check size={17} /> : <Icon size={17} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-[#7E8477] dark:text-slate-400">{subtitle}</p></div><span className="shrink-0 text-xs text-[#7E8477]">{time}</span><ArrowRight size={14} className="text-[#929887]" /></Link>)}
          </div>
        </section>
      </div>
      <aside className="space-y-6">
        <Link to="/current-affairs" className="study-panel block p-5"><p className="eyebrow">A little reading today</p><h2 className="section-title mt-2">Current Affairs</h2><p className="mt-3 text-sm leading-6 text-[#777E70] dark:text-slate-400">Explore official releases, simple explanations and a short recall quiz.</p><span className="quiet-link mt-4 text-xs">Open the desk <ArrowRight size={14} /></span></Link>
        {exam !== 'SSC_CPO' && <Link to="/capf-syllabus" className="study-panel block p-5"><p className="eyebrow">Plan your preparation</p><h2 className="section-title mt-2">CAPF syllabus & trends</h2><p className="mt-3 text-sm leading-6 text-[#777E70] dark:text-slate-400">Explore subjects, see five-year question counts and mark what needs attention.</p><span className="quiet-link mt-4 text-xs">Open syllabus <ArrowRight size={14} /></span></Link>}
        <section className="study-panel p-5"><h2 className="section-title">Your progress</h2><p className="mt-5 text-3xl font-semibold tracking-tight">{completed}<span className="ml-1 text-base font-normal text-[#858A7F]">/ {chapters.length}</span></p><p className="mt-1 text-xs text-[#777E70]">chapters completed</p><progress className="study-progress mt-4" value={completed} max={chapters.length || 1} aria-label="Chapters completed" /><div className="mt-5 flex justify-between border-t border-[#E6E7DE] pt-4 text-xs dark:border-slate-800"><span className="text-[#777E70]">Questions attempted</span><strong>{attempted}</strong></div><Link to="/analytics" className="quiet-link mt-5 text-xs">View progress <ArrowRight size={14} /></Link></section>
        <section className="px-1"><h2 className="section-title">Needs a little attention</h2>{weak.length ? <div className="mt-4 space-y-4">{weak.map(question => <Link key={question.id} to="/mistake-vault" className="block border-l-2 border-[#C5AC81] pl-3"><p className="text-sm font-medium leading-6">{question.microTopic}</p><p className="mt-1 text-xs text-[#858A7F]">Review your mistake <span aria-hidden="true">?</span></p></Link>)}</div> : <p className="mt-3 text-sm leading-6 text-[#858A7F]">Your difficult topics will appear here after practice.</p>}</section>
        <p className="border-t border-[#E1E3D8] pt-5 text-xs leading-6 text-[#8C9185] dark:border-slate-800">A short session counts. Come back tomorrow and see what you remember.</p>
      </aside>
    </div>
  </div>;
}
