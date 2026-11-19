import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, PencilLine, RotateCcw, CheckCircle2, FileText } from 'lucide-react';
import { useStudyPreferences } from '../context/StudyPreferences';
import type { ChapterProgress, MistakeRecord, Question, Paper2Submission } from '../types';
import { LEARNING_CHAPTERS } from '../data/learningLibrary';

export function SectionNavigation() {
  const { pathname } = useLocation();
  const learning = ['/books', '/learning', '/ncert', '/reels', '/capf-syllabus', '/current-affairs'].some(path => pathname === path || pathname.startsWith(path + '/'));
  const practice = ['/practice', '/calculation-coach', '/ai-tutor', '/capf-elimination', '/paper-2'].includes(pathname);
  const revision = ['/revision', '/daily-review', '/mistake-vault'].includes(pathname);
  const items = learning ? [['/books', 'Books'], ['/current-affairs', 'Current Affairs'], ['/capf-syllabus', 'CAPF syllabus'], ['/reels', 'Learn Reels'], ['/learning', 'Topic lessons'], ['/calculation-coach', 'Calculation Coach']] : practice ? [['/practice', 'Overview'], ['/calculation-coach', 'Calculation Coach'], ['/ai-tutor', 'Topic practice'], ['/capf-elimination', 'CAPF practice'], ['/paper-2', 'Writing']] : revision ? [['/revision', 'Overview'], ['/daily-review', 'Recall cards'], ['/mistake-vault', 'Mistakes']] : [];
  if (!items.length) return null;
  return <nav aria-label={learning ? 'Learning sections' : practice ? 'Practice tools' : 'Revision tools'} className="mb-7 flex flex-wrap gap-x-5 gap-y-3 border-b border-[#E1E3D8] pb-3 dark:border-slate-800">{items.map(([to, label]) => { const active = pathname === to || pathname.startsWith(to + '/'); return <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={`text-xs ${active ? 'font-semibold text-[#315840] dark:text-[#B2D7BA]' : 'text-[#818879] hover:text-[#315840]'}`}>{label}</Link>; })}</nav>;
}

export function PracticeHome() {
  const tools = [
    { to: '/practice/capf-analytica', title: 'CAPF Analytica', description: 'Take a timed Paper I sectional, see your net marks and retry the questions you missed.', detail: 'Timed practice and revision', icon: Clock },
    { to: '/calculation-coach', title: 'Calculation Coach', description: 'Build confidence with arithmetic and fractions. Learn visually, fix mistakes, and build speed at your own pace.', detail: 'Phone-friendly / No timer to start', icon: PencilLine },
    { to: '/ai-tutor', title: 'Topic practice', description: 'Choose a subject and topic. Get a short explanation and questions at your level.', detail: 'Your selected topic only', icon: BookOpen },
    { to: '/capf-elimination', title: 'CAPF practice', description: 'Work through statement questions and learn to rule out incorrect options.', detail: 'Mixed topics ? at your pace', icon: CheckCircle2 },
    { to: '/paper-2', title: 'Writing practice', description: 'Practise essays, arguments, reports, and pr?cis with feedback.', detail: 'CAPF Paper 2', icon: PencilLine },
  ];
  return <div className="space-y-7"><header><p className="eyebrow">Put it into practice</p><h1 className="page-title mt-2">Practice</h1><p className="page-description">Focus on one topic, or set aside time for an exam session.</p></header><div className="study-panel divide-y divide-[#E6E7DE] dark:divide-slate-800">{tools.map(({ to, title, description, detail, icon: Icon }) => <Link key={to} to={to} className="flex items-start gap-4 p-6 hover:bg-[#F7F8F3] dark:hover:bg-[#1E2B22]"><span className="rounded-xl bg-[#EEF1E9] p-3 text-[#57704D] dark:bg-[#273C2E]"><Icon size={20} strokeWidth={1.6} /></span><div className="flex-1"><h2 className="section-title">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#777E70] dark:text-slate-400">{description}</p><p className="mt-3 text-xs text-[#8B9183]">{detail}</p></div><ArrowRight size={17} className="mt-3 shrink-0 text-[#8B9183]" /></Link>)}</div></div>;
}

export function RevisionHome({ dueCount, mistakeCount, reviewedToday }: { dueCount: number; mistakeCount: number; reviewedToday: number }) {
  return <div className="space-y-7"><header><p className="eyebrow">Keep what you learn</p><h1 className="page-title mt-2">Revision</h1><p className="page-description">A few minutes of recall today makes tomorrow?s learning easier.</p></header><div className="grid gap-5 md:grid-cols-2">{[
    { to: '/daily-review', icon: RotateCcw, title: 'Recall cards', count: dueCount, unit: 'due now', description: 'Answer from memory, compare, and choose when to review again.', action: dueCount ? 'Start reviewing' : 'Open recall cards' },
    { to: '/mistake-vault', icon: FileText, title: 'Your mistakes', count: mistakeCount, unit: 'saved for review', description: 'Understand the answers that tripped you up and revisit the explanation.', action: 'Review mistakes' },
  ].map(({ to, icon: Icon, title, count, unit, description, action }) => <section key={to} className="study-panel p-6"><Icon size={22} className="mb-5 text-[#617557]" /><h2 className="section-title">{title}</h2><p className="mt-4 text-3xl font-semibold">{count}<span className="ml-2 text-xs font-normal text-[#818879]">{unit}</span></p><p className="mt-4 text-sm leading-6 text-[#777E70] dark:text-slate-400">{description}</p><Link to={to} className="quiet-link mt-6">{action}<ArrowRight size={15} /></Link></section>)}</div><p className="text-sm text-[#818879]">{reviewedToday ? `${reviewedToday} cards reviewed today. Nice progress ? take it at your own pace.` : 'Complete a lesson or attempt a question to build your personal revision queue.'}</p></div>;
}

export function ProgressPage({ chapterProgress, questions, mistakes, solvedQuestionIds, submissions, reviewedToday }: {
  chapterProgress: Record<string, ChapterProgress>; questions: Question[]; mistakes: MistakeRecord[]; solvedQuestionIds: string[]; submissions: Paper2Submission[]; reviewedToday: number;
}) {
  const { exam } = useStudyPreferences();
  const chapters = LEARNING_CHAPTERS.filter(chapter => exam === 'BOTH' || chapter.examRelevance.includes(exam));
  const eligible = questions.filter(question => exam === 'BOTH' || question.targetExam.includes(exam));
  const attempted = eligible.filter(question => solvedQuestionIds.includes(question.id));
  const completed = chapters.filter(chapter => chapterProgress[chapter.id]?.isCompleted).length;
  const mistakesToReview = eligible.filter(question => mistakes.some(mistake => mistake.questionId === question.id)).length;
  const subjects = [...new Set(chapters.map(chapter => chapter.subject))];
  return <div className="space-y-7"><header><p className="eyebrow">See how far you?ve come</p><h1 className="page-title mt-2">Your progress</h1><p className="page-description">Your completed lessons and recorded practice, one step at a time.</p>{exam !== 'SSC_CPO' && <Link to="/practice/capf-analytica" className="quiet-link mt-4 min-h-11">Open CAPF Analytica <ArrowRight size={16} /></Link>}</header><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[[completed, 'Chapters completed'], [attempted.length, 'Questions attempted'], [reviewedToday, 'Cards reviewed today'], [mistakesToReview, 'Mistakes to revisit']].map(([count, label]) => <div key={label} className="study-panel p-5"><p className="text-3xl font-semibold">{count}</p><p className="mt-2 text-xs text-[#818879]">{label}</p></div>)}</div><section className="study-panel p-6"><h2 className="section-title">By subject</h2><div className="mt-6 space-y-6">{subjects.map(subject => {
    const group = chapters.filter(chapter => chapter.subject === subject);
    const done = group.filter(chapter => chapterProgress[chapter.id]?.isCompleted).length;
    return <div key={subject}><div className="mb-2 flex justify-between gap-3 text-sm"><span>{subject}</span><span className="shrink-0 text-xs text-[#818879]">{done} / {group.length} chapters</span></div><progress className="study-progress" max={group.length} value={done} aria-label={`${subject} completion`} /></div>;
  })}</div></section>{exam !== 'SSC_CPO' && <p className="text-sm text-[#818879]">{submissions.length} writing submissions saved. <Link to="/paper-2" className="underline underline-offset-4">Open writing practice</Link></p>}<p className="text-xs leading-6 text-[#929889]">Chapter completion records reading progress. Use recall and practice to check what you remember.</p></div>;
}
