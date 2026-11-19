import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, Delete, RotateCcw } from 'lucide-react';
import { COACH_KEY, SKILLS, SKILL_LABELS, answerLabel, createCoachSession, gradeAnswer, isFractionAnswer, mistakeHint, mistakesForReview, parseCoachState, questionPrompt, skillStats, solutionSteps, weakestSkill, fraction } from '../utils/calculationCoach';
import type { CoachMode, CoachState, MathSkill } from '../utils/calculationCoach';

const LESSONS: Record<MathSkill, { idea: string; example: string[]; hint: string }> = {
  addition: { idea: 'Break a number into tens and ones. Add one part at a time.', example: ['47 + 26', '47 + 20 = 67', '67 + 6 = 73'], hint: 'Another useful method: 49 + 28 = 50 + 27 = 77. Moving one from 28 to 49 keeps the total the same.' },
  subtraction: { idea: 'Subtract the tens first, then the ones. Check by adding your answer back.', example: ['52 − 28', '52 − 20 = 32', '32 − 8 = 24', 'Check: 24 + 28 = 52'], hint: 'If borrowing feels confusing, count up: 28 to 30 is 2, to 50 is 20, to 52 is 2. Total difference: 24.' },
  multiplication: { idea: 'Multiplication is equal groups. Split a difficult product into two easier ones.', example: ['8 × 7', '(5 × 7) + (3 × 7)', '35 + 21 = 56'], hint: 'For larger numbers: 16 × 7 = 10 × 7 + 6 × 7 = 70 + 42 = 112. For 25 × 16, doubling 25 and halving 16 gives 50 × 8, then 100 × 4 = 400.' },
  division: { idea: 'Division asks how many equal groups fit. Multiplication helps you check.', example: ['63 ÷ 9', 'Which number multiplied by 9 makes 63?', '9 × 7 = 63, so 63 ÷ 9 = 7'], hint: 'If you cannot recall the fact, build it: 9 × 5 = 45; two more groups of 9 add 18, making 63.' },
  fractionMeaning: { idea: 'A fraction describes equal parts of a whole. The denominator is the total number of equal parts; the numerator is how many you have.', example: ['One whole split into 4 equal parts', 'Shade 3 parts', 'The shaded amount is 3/4'], hint: 'The parts must be equal. A larger denominator means smaller pieces when the whole stays the same.' },
  equivalence: { idea: 'Multiply or divide both numbers by the same amount to keep a fraction’s value unchanged.', example: ['6/8', 'Divide both numbers by 2', '6 ÷ 2 = 3 and 8 ÷ 2 = 4', '6/8 = 3/4'], hint: 'To simplify, look for a number that divides both the numerator and denominator. Keep going until only 1 divides them both.' },
  comparison: { idea: 'Compare fractions using equal-sized pieces. Then compare how many pieces there are.', example: ['Compare 1/3 and 1/4', '1/3 = 4/12 and 1/4 = 3/12', '4 pieces are more than 3 pieces', '1/3 > 1/4'], hint: 'With the same numerator, a bigger denominator gives a smaller positive fraction: one third is larger than one quarter.' },
  fractionAddition: { idea: 'Make the denominators the same before adding. Add the numerators and keep the common denominator.', example: ['1/2 + 1/3', '1/2 = 3/6 and 1/3 = 2/6', '3/6 + 2/6 = 5/6'], hint: 'Do not add the denominators. They describe the size of each piece. Try the fraction bars below to see equal amounts.' },
};

export function FractionBar({ numerator, denominator }: { numerator: number; denominator: number }) {
  return <div role="img" aria-label={`${numerator} of ${denominator} equal parts shaded`} className="flex h-12 overflow-hidden rounded-lg border border-[#69865A]">{Array.from({ length: denominator }, (_, index) => <span key={index} className={`flex-1 border-r border-[#69865A] last:border-0 ${index < numerator ? 'bg-[#69865A]' : 'bg-white dark:bg-[#202C25]'}`} />)}</div>;
}

function FractionPlayground() {
  const [parts, setParts] = useState(4);
  const [shaded, setShaded] = useState(3);
  return <section className="space-y-4 rounded-xl bg-[#F2F5EC] p-5 dark:bg-[#202E24]">
    <h3 className="text-sm font-semibold">Try it: one whole, equal parts</h3>
    <label className="flex items-center gap-3 text-sm">Divide into<select aria-label="Number of equal parts" className="rounded border border-[#B8C4AA] bg-transparent p-2" value={parts} onChange={event => { setParts(Number(event.target.value)); setShaded(0); }}>{[2,3,4,6,8,12].map(n => <option key={n} value={n}>{n} parts</option>)}</select></label>
    <p className="text-xs text-[#717B64] dark:text-slate-300">Tap a piece to shade that many parts. Tap the selected amount again to clear.</p>
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{Array.from({ length: parts }, (_, i) => <button key={i} type="button" aria-label={`Shade ${i + 1} of ${parts} parts`} aria-pressed={i < shaded} onClick={() => setShaded(shaded === i + 1 ? 0 : i + 1)} className={`min-h-12 rounded-lg border border-[#81956C] text-sm ${i < shaded ? 'bg-[#577548] text-white' : 'bg-white text-[#315840] dark:bg-[#121816] dark:text-white'}`}>{i + 1}</button>)}</div>
    <FractionBar numerator={shaded} denominator={parts} />
    <p className="text-center text-2xl font-semibold tabular-nums">{shaded}/{parts} = {fraction(shaded, parts)}</p>
    <div className="relative mx-3 mt-5 h-12 border-t-2 border-[#718761]" aria-label={`${shaded}/${parts} on the number line from zero to one`} role="img"><span className="absolute left-0 top-2 text-xs">0</span><span className="absolute right-0 top-2 text-xs">1</span><span className="absolute -top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#315840] dark:bg-[#B2D7BA]" style={{ left: `${shaded / parts * 100}%` }} /></div>
    <p className="text-xs leading-6 text-[#717B64] dark:text-slate-300">Try 1/2, then 2/4. Both fill half the bar and land in the same place on the number line.</p>
  </section>;
}

export function CalculationCoach() {
  const [state, setState] = useState<CoachState>(() => { try { return parseCoachState(localStorage.getItem(COACH_KEY)); } catch { return parseCoachState(null); } });
  const latest = useRef(state);
  const [storageError, setStorageError] = useState(false);
  const [home, setHome] = useState(true);
  const [lesson, setLesson] = useState<MathSkill | null>(null);
  const [skill, setSkill] = useState<MathSkill>(() => weakestSkill(state.attempts));
  const [field, setField] = useState<'numerator' | 'denominator'>('numerator');
  const [validation, setValidation] = useState('');
  const [now, setNow] = useState(Date.now());
  const elapsed = useRef(state.session?.seconds || 0);
  const input = useRef<HTMLInputElement>(null);
  const session = state.session;
  const q = session?.questions[session.index];
  const update = (change: (previous: CoachState) => CoachState) => {
    const next = change(latest.current);
    latest.current = next; setState(next);
    try { localStorage.setItem(COACH_KEY, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); }
  };
  const changeSession = (change: Partial<NonNullable<CoachState['session']>>) => update(previous => previous.session ? { ...previous, session: { ...previous.session, seconds: elapsed.current, ...change } } : previous);
  useEffect(() => { elapsed.current = session?.seconds || 0; setField('numerator'); setValidation(''); }, [session?.id, session?.index]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      const current = latest.current.session;
      if (!home && current && !current.feedback && !current.finished && !document.hidden) elapsed.current += 1;
      if (current?.mode === 'speed' && !current.finished && current.deadline! <= Date.now()) changeSession({ finished: true });
    }, 1000);
    const checkpoint = () => { if (latest.current.session && !home) changeSession({ seconds: elapsed.current }); };
    window.addEventListener('pagehide', checkpoint);
    document.addEventListener('visibilitychange', checkpoint);
    return () => { clearInterval(timer); window.removeEventListener('pagehide', checkpoint); document.removeEventListener('visibilitychange', checkpoint); };
  }, [home]);

  const start = (mode: CoachMode, selected = skill) => {
    if (mode === 'speed' && !skillStats(latest.current.attempts, selected).speedReady) return;
    const next = createCoachSession(mode, selected, latest.current.attempts);
    elapsed.current = 0;
    update(previous => ({ ...previous, session: next }));
    setHome(false); setLesson(null); setValidation('');
  };
  const submit = (skip = false) => {
    const current = latest.current.session;
    if (!current || current.feedback || current.finished) return;
    if (current.deadline && Date.now() >= current.deadline) { changeSession({ finished: true }); return; }
    const question = current.questions[current.index];
    const result = gradeAnswer(question, current.numerator, current.denominator);
    if (!skip && !result.valid) { setValidation(result.message); return; }
    const correct = !skip && result.correct;
    update(previous => ({ ...previous, attempts: [...previous.attempts, { question, correct, helped: current.helped, skipped: skip, seconds: elapsed.current, at: Date.now() }].slice(-500),
      session: { ...current, seconds: elapsed.current, feedback: skip ? 'skipped' : correct ? 'correct' : 'incorrect' } }));
    setValidation('');
  };
  const nextQuestion = () => {
    if (!session) return;
    if (session.index + 1 === session.questions.length) {
      update(previous => ({ ...previous, checkCompleted: previous.checkCompleted || session.mode === 'check', session: { ...session, finished: true } }));
      return;
    }
    elapsed.current = 0;
    changeSession({ index: session.index + 1, numerator: '', denominator: '', scratch: '', helped: false, feedback: null, seconds: 0 });
  };
  const editAnswer = (value: string) => { if (session?.feedback) return; changeSession({ [field]: value.slice(0, 6) }); setValidation(''); };
  const recommended = weakestSkill(state.attempts);
  const review = mistakesForReview(state.attempts);
  const stats = skillStats(state.attempts, skill);
  const storageNotice = storageError && <p role="alert" className="rounded-lg bg-[#FBEAE8] p-3 text-sm text-[#9B3E33]">Progress is only in this open tab because browser storage is unavailable. <button type="button" className="underline" onClick={() => update(previous => ({ ...previous }))}>Retry saving</button></p>;

  if (lesson) {
    const content = LESSONS[lesson];
    return <div className="mx-auto max-w-2xl space-y-6">{storageNotice}<button type="button" onClick={() => setLesson(null)} className="quiet-link text-xs"><ArrowLeft size={14} />Calculation Coach</button><header><p className="eyebrow">One small idea</p><h1 className="page-title mt-2">{SKILL_LABELS[lesson]}</h1><p className="page-description">{content.idea}</p></header><section className="study-panel space-y-4 p-6"><h2 className="section-title">A worked example</h2><ol className="space-y-4">{content.example.map((step, i) => <li key={i} className="flex gap-3 text-base leading-7"><span className="text-sm text-[#818879]">{i + 1}.</span>{step}</li>)}</ol><p className="border-t border-[#E6E7DE] pt-4 text-sm leading-7 dark:border-slate-700">{content.hint}</p></section>{['fractionMeaning','equivalence','comparison','fractionAddition'].includes(lesson) && <FractionPlayground />}<button type="button" className="primary-button w-full" onClick={() => { setSkill(lesson); start('practice', lesson); }}>Try 8 questions<ArrowRight size={16} /></button></div>;
  }

  if (home || !session) return <div className="mx-auto max-w-3xl space-y-6">{storageNotice}
    <header><p className="eyebrow">Accuracy first. Speed will follow.</p><h1 className="page-title mt-2">Calculation Coach</h1><p className="page-description">Small steps for arithmetic and fractions. No timer until you choose one.</p></header>
    {session && !session.finished ? <section className="study-panel space-y-4 p-5"><h2 className="section-title">Your session is saved</h2><p className="text-sm text-[#818879]">{session.mode === 'check' ? 'Skill check' : SKILL_LABELS[session.skill]} / Question {session.index + 1} of {session.mode === 'speed' ? 'your speed round' : session.questions.length}</p><div className="flex gap-3"><button type="button" className="primary-button" onClick={() => { elapsed.current = session.seconds; setHome(false); }}>Resume session</button><button type="button" className="secondary-button" onClick={() => update(previous => ({ ...previous, session: null }))}>End session</button></div><p className="text-xs text-[#818879]">End this session to start a different one. Your recorded answers stay saved.</p></section> : <>
      {!state.checkCompleted && <section className="study-panel space-y-4 p-5"><h2 className="section-title">Find a comfortable starting point</h2><p className="text-sm leading-6 text-[#818879]">12 short questions, no countdown. Use “I don’t know yet” whenever you need to.</p><button type="button" className="primary-button" onClick={() => start('check')}>Start a gentle skill check<ArrowRight size={15} /></button></section>}
      <section className="study-panel space-y-4 p-5"><h2 className="section-title">Your next small step</h2><p className="text-sm text-[#818879]">{state.attempts.length ? `Try ${SKILL_LABELS[recommended].toLowerCase()} based on your recent answers.` : 'Start with a visual explanation or choose a skill below.'}</p><button type="button" className="secondary-button" onClick={() => setLesson(recommended)}><BookOpen size={16} />Learn {SKILL_LABELS[recommended].toLowerCase()}</button></section>
      <section className="study-panel space-y-5 p-5"><label htmlFor="coach-skill" className="block text-sm font-semibold">What would you like to work on?</label><select id="coach-skill" className="study-input" value={skill} onChange={event => setSkill(event.target.value as MathSkill)}>{SKILLS.map(item => <option key={item} value={item}>{SKILL_LABELS[item]}</option>)}</select><div className="grid grid-cols-2 gap-3"><button type="button" className="secondary-button" onClick={() => setLesson(skill)}>Learn the method</button><button type="button" className="primary-button" onClick={() => start('practice')}>Practise 8 questions</button></div><div className="border-t border-[#E6E7DE] pt-4 dark:border-slate-700"><div className="flex flex-wrap justify-between gap-3 text-xs text-[#818879]"><span>{stats.count ? `${stats.correct}/${stats.count} recent answers correct without help` : 'No practice recorded yet'}</span><span>{stats.seconds !== null ? `${stats.seconds}s average on correct, unassisted answers` : 'Timing appears after correct answers'}</span></div><button type="button" disabled={!stats.speedReady} className="secondary-button mt-4 w-full disabled:opacity-50" onClick={() => start('speed')}><Clock size={15} />Optional 60-second speed round</button><p className="mt-2 text-xs leading-6 text-[#818879]">Unlocks when at least 9 of your last 10 answers for this skill are correct without hints. Taking longer is fine.</p></div></section>
      <button type="button" disabled={!review.length} onClick={() => start('review')} className="secondary-button w-full disabled:opacity-50"><RotateCcw size={16} />Review mistakes and helped answers ({review.length})</button>
    </>}
    <details className="study-panel p-5"><summary className="cursor-pointer text-sm font-medium">Progress by skill</summary><ul className="mt-4 divide-y divide-[#E6E7DE] dark:divide-slate-700">{SKILLS.map(item => { const s = skillStats(state.attempts, item); return <li key={item} className="flex justify-between gap-3 py-3 text-xs"><span>{SKILL_LABELS[item]}</span><span className="text-[#818879]">{s.count ? `${s.correct}/${s.count} independent answers` : 'Not started'}</span></li>; })}</ul></details>
    <p className="text-xs leading-6 text-[#818879]">Try a short daily routine: revisit mistakes, learn one idea, then practise. Exercises work without an internet connection once this page is loaded. Progress is saved in this browser.</p>
  </div>;

  if (session.finished) {
    const ids = new Set(session.questions.slice(0, session.index + 1).map(question => question.id));
    const results = [...new Map(state.attempts.filter(attempt => ids.has(attempt.question.id) && attempt.at >= session.startedAt).map(attempt => [attempt.question.id, attempt])).values()];
    const correct = results.filter(item => item.correct && !item.helped).length;
    return <section className="study-panel mx-auto max-w-xl space-y-5 p-6">{storageNotice}<Check className="text-[#69865A]" size={32} /><h1 className="page-title">A little practice, done.</h1><p className="text-sm leading-7">{correct} of {results.length} answered correctly without help. {session.mode === 'speed' ? 'The timer has ended. Unanswered questions do not count as mistakes.' : 'Every mistake gives you something specific to work on.'}</p><p className="text-sm text-[#818879]">Suggested next step: {SKILL_LABELS[recommended]}.</p><div className="flex flex-wrap gap-3"><button type="button" className="primary-button" onClick={() => { setHome(true); setLesson(recommended); }}>Learn this method</button><button type="button" className="secondary-button" onClick={() => setHome(true)}>Back to coach</button></div></section>;
  }
  if (!q) return null;
  const feedback = session.feedback;
  return <div className="mx-auto max-w-xl space-y-4 pb-4">{storageNotice}
    <div className="flex items-center justify-between gap-3"><button type="button" className="quiet-link text-xs" onClick={() => { changeSession({ seconds: elapsed.current }); setHome(true); }}>Save &amp; leave</button><span className="text-xs text-[#818879]">{session.mode === 'speed' ? `${Math.max(0, Math.ceil((session.deadline! - now) / 1000))} seconds left` : `${session.index + 1} / ${session.questions.length} · No timer`}</span></div>
    <section className="study-panel space-y-5 p-5 sm:p-6"><p className="eyebrow">{SKILL_LABELS[q.skill]}</p><h1 className="text-center text-2xl font-semibold leading-snug tabular-nums sm:text-3xl">{questionPrompt(q)}</h1>{q.skill === 'fractionMeaning' && <FractionBar numerator={q.a} denominator={q.b} />}
      <form onSubmit={event => { event.preventDefault(); submit(); }} className="space-y-4">
        {q.skill === 'comparison' ? <div className="grid grid-cols-3 gap-3">{['<','=','>'].map(symbol => <button type="button" key={symbol} disabled={!!feedback} aria-label={symbol === '<' ? 'Less than' : symbol === '>' ? 'Greater than' : 'Equal to'} aria-pressed={session.numerator === symbol} className={`min-h-14 rounded-lg border text-2xl ${session.numerator === symbol ? 'border-[#69865A] bg-[#E9EFE3] text-[#315840]' : 'border-[#CDD5C3] dark:border-slate-600'}`} onClick={() => changeSession({ numerator: symbol })}>{symbol}</button>)}</div> : <div className="mx-auto flex max-w-xs items-center justify-center gap-3">{(['numerator', ...(isFractionAnswer(q.skill) ? ['denominator'] : [])] as ('numerator' | 'denominator')[]).map((part, index) => <React.Fragment key={part}>{index > 0 && <span aria-hidden="true" className="mt-6 text-2xl">/</span>}<label className="min-w-0 flex-1 text-center text-xs text-[#818879]">{isFractionAnswer(q.skill) ? part === 'numerator' ? 'Numerator (top)' : 'Denominator (bottom)' : 'Your answer'}<input ref={part === 'numerator' ? input : undefined} aria-label={isFractionAnswer(q.skill) ? part : 'Your answer'} inputMode="numeric" pattern="[0-9]*" value={session[part]} readOnly={!!feedback} onFocus={() => setField(part)} onChange={event => { if (/^\d{0,6}$/.test(event.target.value)) { changeSession({ [part]: event.target.value }); setValidation(''); } }} className={`mt-2 min-h-14 w-full rounded-lg border bg-transparent px-3 text-center text-2xl tabular-nums ${field === part ? 'border-[#69865A] ring-1 ring-[#69865A]' : 'border-[#CDD5C3] dark:border-slate-600'}`} /></label></React.Fragment>)}</div>}
        {validation && <p role="alert" className="text-sm leading-6 text-[#92533B] dark:text-orange-200">{validation}</p>}
        {!feedback && <><button type="submit" className="primary-button min-h-12 w-full">Check answer</button><div className="flex flex-wrap justify-between gap-3"><button type="button" className="quiet-link min-h-11 text-xs" onClick={() => changeSession({ helped: true })}>Show a hint</button><button type="button" className="quiet-link min-h-11 text-xs" onClick={() => submit(true)}>I don’t know yet</button></div></>}
      </form>
      {session.helped && !feedback && <p className="rounded-lg bg-[#F2F5EC] p-4 text-sm leading-7 dark:bg-[#273C2E]">{LESSONS[q.skill].idea}</p>}
      {feedback && <div role="status" className="space-y-3 border-t border-[#E6E7DE] pt-4 dark:border-slate-700"><h2 className="font-semibold">{feedback === 'correct' ? session.helped ? 'Correct with a hint. Keep practising.' : 'Correct.' : `Let’s learn it: ${answerLabel(q)}`}</h2>{feedback !== 'correct' && <p className="text-sm leading-6 text-[#818879]">{mistakeHint(q, session.numerator, session.denominator)}</p>}<ol className="list-decimal space-y-2 pl-5 text-sm leading-7">{solutionSteps(q).map((step, i) => <li key={i}>{step}</li>)}</ol><button type="button" className="primary-button min-h-12 w-full" onClick={nextQuestion}>{session.index + 1 === session.questions.length ? 'Finish session' : 'Next question'}<ArrowRight size={16} /></button></div>}
    </section>
    {!feedback && q.skill !== 'comparison' && <section aria-label="Answer keypad" className="grid grid-cols-3 gap-2">{['1','2','3','4','5','6','7','8','9','Clear','0','Delete'].map(key => <button key={key} type="button" aria-label={key === 'Delete' ? 'Delete last digit' : key} onClick={() => editAnswer(key === 'Clear' ? '' : key === 'Delete' ? session[field].slice(0, -1) : session[field] + key)} className="study-panel flex min-h-14 touch-manipulation items-center justify-center text-lg font-medium active:bg-[#E9EFE3] dark:active:bg-[#273C2E]">{key === 'Delete' ? <Delete size={21} /> : key}</button>)}</section>}
    <details className="study-panel p-4"><summary className="cursor-pointer text-xs font-medium">Scratchpad / show your working</summary><textarea aria-label="Scratchpad" rows={3} className="study-input mt-3" value={session.scratch} onChange={event => changeSession({ scratch: event.target.value })} placeholder="Write an intermediate step here..." /><p className="mt-2 text-xs text-[#818879]">Your working stays with this question while the session is saved.</p></details>
  </div>;
}
