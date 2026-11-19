import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowRight, ArrowLeft, Bookmark, Check, LockKeyhole, Play, Pause, BookOpen, FlaskConical, Landmark } from 'lucide-react';
import { REEL_COURSES, type ReelChapter, type ReelLesson } from '../data/learningReels';
import { answerReel, chapterComplete, chapterUnlocked, reelFeed, type ReelsProgress } from '../utils/learningReels';

interface Props {
  progress: ReelsProgress;
  onChange: (progress: ReelsProgress) => void;
  storageError: boolean;
}

function LessonVisual({ lesson, step, history }: { lesson: ReelLesson; step: number; history: boolean }) {
  const cell = lesson.id === 'cell-membrane';
  return <div className={`reel-visual ${history ? 'reel-visual-history' : ''}`} aria-label={lesson.labels.join(' → ')} role="img">
    {lesson.id === 'cell-nucleus' ? <svg viewBox="0 0 360 125" aria-hidden="true" className="reel-cell">
      <rect x="18" y="22" width="125" height="64" rx="32" fill="#d7e5cd" stroke="#52744d" strokeWidth="2" />
      <path d="M52 45 Q102 25 103 56 Q83 86 51 64 Q40 54 65 49" stroke="#385535" fill="none" strokeWidth="3" />
      <ellipse cx="263" cy="54" rx="68" ry="43" fill="#d7e5cd" stroke="#52744d" strokeWidth="2" />
      <ellipse cx="263" cy="54" rx="26" ry="21" fill="#b2ca9d" stroke="#52744d" strokeWidth="3" />
      <path d="M250 46 Q276 51 251 64 M272 45 Q248 55 273 63" stroke="#385535" fill="none" strokeWidth="2" />
      <text x="80" y="109" textAnchor="middle" fontSize="11" fill="#385535">Bacterium: DNA, no nucleus</text>
      <text x="264" y="109" textAnchor="middle" fontSize="11" fill="#385535">DNA inside nucleus</text>
    </svg> : lesson.id === 'cell-osmosis' ? <svg viewBox="0 0 360 125" aria-hidden="true" className="reel-cell">
      <rect x="35" y="12" width="290" height="85" rx="10" fill="#dcece7" stroke="#9bbcac" />
      <path d="M180 12 V97" stroke="#52744d" strokeWidth="4" strokeDasharray="8 4" />
      {[65, 114, 212, 240, 270, 297].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 73 : 36} r="6" fill="#8a633e" />)}
      <path d="M100 55 H255 M245 48 L255 55 L245 62" fill="none" stroke="#385535" strokeWidth="3" />
      <text x="180" y="117" textAnchor="middle" fontSize="11" fill="#385535">Arrow: net water flow · Dots: blocked solute</text>
    </svg> : cell ? <svg viewBox="0 0 360 125" aria-hidden="true" className="reel-cell">
      <ellipse cx="180" cy="62" rx="87" ry="49" fill="#d7e5cd" stroke="#52744d" strokeWidth={step === 1 ? 5 : 2} />
      <ellipse cx="181" cy="62" rx="29" ry="23" fill="#b2ca9d" stroke="#52744d" strokeWidth={step === 2 ? 4 : 2} />
      <path d="M168 52 Q193 56 172 70 M190 52 Q167 63 190 72" stroke="#385535" fill="none" strokeWidth="2" />
      <path d="M44 61 H91 M268 61 H317" stroke="#52744d" strokeWidth="2" strokeDasharray="4 5" />
      <text x="180" y="122" textAnchor="middle" fontSize="11" fill="#385535">Simplified eukaryotic cell · not to scale</text>
    </svg> : <div className="reel-path" aria-hidden="true">{lesson.labels.map((_, index) => <React.Fragment key={index}>{index > 0 && <span className="reel-path-line" />}<span className={index === step ? 'reel-node is-current' : 'reel-node'}>{history ? ['I', 'II', 'III'][index] : index + 1}</span></React.Fragment>)}</div>}
    <div className="reel-visual-labels" aria-hidden="true">{lesson.labels.map((label, index) => <span key={label} className={step === index ? 'is-current' : ''}>{label}</span>)}</div>
  </div>;
}

function LessonSlide({ lesson, number, active, history, saved, onSave, chapter }: {
  lesson: ReelLesson; number: number; active: boolean; history: boolean; saved: boolean; onSave: () => void; chapter: ReelChapter;
}) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    if (!active) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(preference.matches);
    const visibility = () => setVisible(!document.hidden);
    update(); visibility();
    preference.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => { preference.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, [active]);
  useEffect(() => {
    if (!active || paused || expanded || reduceMotion || !visible || step === 2) return;
    const timer = window.setTimeout(() => setStep(previous => Math.min(2, previous + 1)), 9000);
    return () => window.clearTimeout(timer);
  }, [active, paused, expanded, reduceMotion, visible, step]);
  return <div className="reel-lesson">
    <div className="flex items-center justify-between gap-3"><p className="eyebrow">Reel {number} of {chapter.lessons.length} · Read at your pace</p><button className="reel-icon-button" onClick={onSave} aria-pressed={saved} aria-label={saved ? 'Remove from saved reels' : 'Save reel for daily recall'}><Bookmark size={19} fill={saved ? 'currentColor' : 'none'} /></button></div>
    <h2 className="reel-title">{lesson.title}</h2>
    <LessonVisual lesson={lesson} step={step} history={history} />
    <div className="flex items-center gap-3"><div className="reel-caption-tabs">{lesson.steps.map((_, index) => <button key={index} aria-label={`Read part ${index + 1} of 3`} aria-pressed={step === index} className={index === step ? 'is-current' : ''} onClick={() => { setStep(index); setPaused(true); }} />)}</div>{!reduceMotion && <button className="reel-icon-button" aria-label={paused ? 'Play captions' : 'Pause captions'} onClick={() => { if (step === 2 && paused) setStep(0); setPaused(!paused); }}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>}</div>
    <p className="reel-caption" aria-live={active && paused ? 'polite' : 'off'}>{lesson.steps[step]}</p>
    <div className="flex items-center justify-between text-xs"><button className="reel-text-button" disabled={step === 0} onClick={() => { setStep(step - 1); setPaused(true); }}>Previous part</button><span className="text-[#777E70]">{step + 1} / 3</span><button className="reel-text-button" disabled={step === 2} onClick={() => { setStep(step + 1); setPaused(true); }}>Next part</button></div>
    <div className="reel-takeaway"><span>Remember this</span><p>{lesson.takeaway}</p></div>
    <details className="reel-details" onToggle={event => setExpanded(event.currentTarget.open)}><summary>Explain a little more</summary><p>{lesson.detail}</p><a href={chapter.source} target="_blank" rel="noreferrer">NCERT source chapter ↗</a></details>
    {saved && <p className="text-xs text-[#52744d]">Saved to your Daily Recall cards.</p>}
  </div>;
}

function RecallCheck({ lessons, progress, chapter, onChange, onNext }: {
  lessons: ReelLesson[]; progress: ReelsProgress; chapter: ReelChapter; onChange: Props['onChange']; onNext: () => void;
}) {
  const question = lessons.find(lesson => !progress.passed.includes(lesson.id));
  const [selection, setSelection] = useState<{ id: string; option: number } | null>(null);
  if (!question) return <div className="reel-check"><span className="reel-check-icon"><Check size={30} /></span><p className="eyebrow">Recall check complete</p><h2 className="reel-title">Keep going, one idea at a time.</h2><p>You answered this set. Saved concepts and missed answers are waiting in Daily Recall.</p><button className="primary-button" onClick={onNext}>Continue <ArrowDown size={16} /></button></div>;
  const chosen = selection?.id === question.id ? selection.option : undefined;
  const correct = chosen === question.answer;
  const answer = (option: number) => {
    setSelection({ id: question.id, option });
    if (option !== question.answer) onChange(answerReel(progress, chapter, question.id, option));
  };
  return <div className="reel-check">
    <p className="eyebrow">Pause & recall · {lessons.filter(lesson => progress.passed.includes(lesson.id)).length + 1} / {lessons.length}</p>
    <h2 className="reel-title">What stayed with you?</h2><p className="text-sm text-[#777E70]">Think of your answer before choosing. These questions cover only the reels you just reached.</p>
    <fieldset><legend className="mb-5 text-lg font-semibold">{question.question}</legend><div className="space-y-3">{question.options.map((option, index) => <button key={option} className={`reel-answer ${chosen === index ? 'is-selected' : ''}`} disabled={chosen !== undefined} onClick={() => answer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></fieldset>
    {chosen !== undefined && <div className="reel-feedback" role="status"><p className="font-semibold">{correct ? 'Yes, that’s it.' : 'Let’s work through it.'}</p><p className="mt-2 text-sm leading-6">{question.explanation}</p>{!correct && <p className="mt-2 text-xs">Added to Daily Recall for another look later.</p>}<button className="primary-button mt-4" onClick={() => { if (correct) onChange(answerReel(progress, chapter, question.id, chosen)); setSelection(null); }}>{correct ? 'Continue' : 'Try again'}</button></div>}
  </div>;
}

function ReelPlayer({ chapter, courseId, progress, onChange, storageError }: Props & { chapter: ReelChapter; courseId: string }) {
  const navigate = useNavigate();
  const course = REEL_COURSES.find(item => item.id === courseId)!;
  const feed = reelFeed(chapter, progress);
  const [active, setActive] = useState(progress.positions[chapter.id] || feed[0].id);
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const latest = useRef({ progress, onChange });
  latest.current = { progress, onChange };
  const feedIds = feed.map(item => item.id).join('|');
  const activeIndex = Math.max(0, feed.findIndex(item => item.id === active));
  const goTo = (index: number) => {
    const target = scroller.current?.children[index] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: 'auto', block: 'start' });
  };
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    const index = feed.findIndex(item => item.id === latest.current.progress.positions[chapter.id]);
    if (index > 0) goTo(index);
    // Restore once on chapter entry; later progress changes must not reset scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id]);
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.isIntersecting && item.intersectionRatio > 0.6);
      const id = (entry?.target as HTMLElement | undefined)?.dataset.reel;
      if (!id) return;
      setActive(id);
      const { progress: current, onChange: update } = latest.current;
      if (current.positions[chapter.id] !== id) update({ ...current, positions: { ...current.positions, [chapter.id]: id } });
    }, { root, threshold: 0.65 });
    Array.from(root.children).forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [chapter.id, feedIds]);
  const nextChapter = course.chapters.find(item => item.number === chapter.number + 1);
  return <dialog className="reel-player" ref={dialog} aria-labelledby="reel-player-title" onCancel={event => { event.preventDefault(); navigate('/reels'); }}>
    <header className="reel-player-header"><button autoFocus className="reel-icon-button" aria-label="Close reels and return to courses" onClick={() => navigate('/reels')}><ArrowLeft size={21} /></button><div className="min-w-0 flex-1"><p className="eyebrow">{course.subject} · Chapter {chapter.number}</p><h1 id="reel-player-title" className="truncate text-sm font-semibold mt-1">{chapter.title}</h1></div>{chapter.readPath.startsWith('/') ? <Link className="reel-icon-button" to={chapter.readPath} aria-label="Read full chapter"><BookOpen size={21} /></Link> : <a className="reel-icon-button" href={chapter.readPath} target="_blank" rel="noreferrer" aria-label="Read full chapter in a new tab"><BookOpen size={21} /></a>}</header>
    {storageError && <p className="reel-storage-error" role="alert">Progress could not be saved on this device. Keep this tab open and free browser storage before leaving.</p>}
    <div ref={scroller} className="reel-scroll" tabIndex={0} aria-label="Chapter reels. Scroll up or down, or use arrow keys." onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); goTo(activeIndex + (event.key === 'ArrowDown' ? 1 : -1)); }
    }}>
      {feed.map(item => <section className="reel-slide" key={item.id} data-reel={item.id} aria-label={item.kind === 'lesson' ? item.lesson.title : item.kind === 'check' ? 'Recall check' : 'Chapter introduction complete'}>
        {item.kind === 'lesson' ? <LessonSlide lesson={item.lesson} number={chapter.lessons.findIndex(lesson => lesson.id === item.id) + 1} active={active === item.id} history={course.subject === 'History'} chapter={chapter} saved={progress.saved.includes(item.id)} onSave={() => onChange({ ...progress, saved: progress.saved.includes(item.id) ? progress.saved.filter(id => id !== item.id) : [...progress.saved, item.id] })} />
          : item.kind === 'check' ? <RecallCheck lessons={item.lessons} progress={progress} chapter={chapter} onChange={onChange} onNext={() => goTo(feed.findIndex(entry => entry.id === item.id) + 1)} />
          : <div className="reel-check"><span className="reel-check-icon"><Check size={30} /></span><p className="eyebrow">Five ideas. One small step forward.</p><h2 className="reel-title">Chapter {chapter.number} introduction complete.</h2><p>You passed the checks for these five reels. Read the full chapter to explore the remaining material.</p>{nextChapter ? <Link className="primary-button" to={`/reels/${course.id}/${nextChapter.number}`}>Continue to Chapter {nextChapter.number}<ArrowRight size={16} /></Link> : <p className="reel-takeaway">You’ve reached the end of this starter course. More chapters haven’t been added yet.</p>}<Link className="secondary-button" to="/daily-review">Review saved & missed concepts</Link><Link className="quiet-link" to="/reels">Finish for now</Link></div>}
      </section>)}
    </div>
    <footer className="reel-player-footer"><button className="reel-icon-button" aria-label="Previous reel or check" disabled={activeIndex === 0} onClick={() => goTo(activeIndex - 1)}><ArrowUp size={20} /></button><p>{feed[activeIndex]?.kind === 'check' ? 'Answer the check to continue' : 'Swipe up for the next idea'}<span>{progress.passed.filter(id => chapter.lessons.some(lesson => lesson.id === id)).length} / {chapter.lessons.length} checks passed</span></p><button className="reel-icon-button" aria-label="Next reel or check" disabled={activeIndex === feed.length - 1} onClick={() => goTo(activeIndex + 1)}><ArrowDown size={20} /></button></footer>
  </dialog>;
}

export function LearnReels(props: Props) {
  const { courseId, chapterNumber } = useParams();
  const course = REEL_COURSES.find(item => item.id === courseId);
  const chapter = course?.chapters.find(item => String(item.number) === chapterNumber);
  const canOpen = chapter && chapterUnlocked(chapter.id, props.progress);
  return <div className="space-y-8">
    <header><p className="eyebrow">Small lessons, in the right order</p><h1 className="page-title mt-2">Learn Reels</h1><p className="page-description max-w-xl">Pick a subject. Follow one chapter at a time with short visual explanations and a little recall between ideas.</p></header>
    {(courseId || chapterNumber) && !canOpen && <p className="study-panel p-5" role="status">{chapter ? 'Finish the earlier chapter’s recall checks to unlock this chapter.' : 'This course or chapter is not available.'} <Link to="/reels" className="underline">Choose a course</Link></p>}
    {props.storageError && !canOpen && <p role="alert">Your latest progress could not be saved. Browser storage may be full or unavailable.</p>}
    <div className="grid gap-6 md:grid-cols-2">{REEL_COURSES.map(item => {
      const Icon = item.subject === 'Science' ? FlaskConical : Landmark;
      const completed = item.chapters.filter(entry => chapterComplete(entry, props.progress)).length;
      return <section className={`study-panel reel-course ${item.subject === 'History' ? 'reel-course-history' : ''}`} key={item.id}>
        <div className="reel-course-heading"><Icon size={28} strokeWidth={1.5} /><span className="eyebrow">10 reels · 2 chapter introductions</span></div>
        <h2 className="text-2xl font-semibold mt-6">{item.subject}</h2><p className="text-xs text-[#777E70] mt-2">{item.book}</p><p className="mt-4 text-sm leading-6">{item.description}</p>
        <div className="mt-6 space-y-3">{item.chapters.map(entry => {
          const unlocked = chapterUnlocked(entry.id, props.progress);
          const done = chapterComplete(entry, props.progress);
          const visited = !!props.progress.positions[entry.id];
          const content = <><span className="reel-chapter-number">{done ? <Check size={18} /> : unlocked ? entry.number : <LockKeyhole size={16} />}</span><span className="flex-1"><span className="block text-sm font-medium">{entry.title}</span><span className="mt-1 block text-xs text-[#777E70]">{done ? 'Review introduction' : unlocked ? visited ? 'Resume · your place is saved' : 'Start · 5 reels and recall checks' : `Finish Chapter ${entry.number - 1} to unlock`}</span></span>{unlocked && <ArrowRight size={16} />}</>;
          return unlocked ? <Link className="reel-chapter-link" key={entry.id} to={`/reels/${item.id}/${entry.number}`}>{content}</Link> : <div className="reel-chapter-link is-locked" key={entry.id}>{content}</div>;
        })}</div><p className="mt-5 text-xs text-[#777E70]">{completed} of {item.chapters.length} chapter introductions completed</p>
      </section>;
    })}</div>
    <div className="flex flex-wrap items-start justify-between gap-5 border-t border-[#E1E3D8] pt-5 dark:border-slate-800"><p className="max-w-xl text-xs leading-6 text-[#777E70]">Start with Chapters 1 and 2. These reels introduce selected concepts; use the book link for the complete chapter. Your place and saved reels stay in this browser on this device.</p><Link className="quiet-link" to="/daily-review"><Bookmark size={16} /> Review saved & missed reels</Link></div>
    {canOpen && course && <ReelPlayer key={chapter.id} {...props} chapter={chapter} courseId={course.id} />}
  </div>;
}
