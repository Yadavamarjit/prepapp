import { useEffect, useState } from 'react';
import { Clock, Crosshair } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { paper, report, startAttempt, validAttempt, type Attempt, type Response } from '../utils/capfAttempt';

const panel = 'study-panel space-y-4 p-5 sm:p-7';
const button = 'min-h-11 rounded-xl border border-current/30 px-4 py-2 font-medium';
const primary = 'min-h-12 rounded-xl bg-[#315840] px-5 py-3 font-semibold text-white hover:bg-[#254532]';
type RecordBook = { current: Attempt | null; scores: number[] };

function load(key: string): RecordBook {
  try {
    const data = JSON.parse(localStorage.getItem(key) || 'null');
    if (data && (data.current === null || validAttempt(data.current)) &&
      Array.isArray(data.scores) && data.scores.every(Number.isFinite)) return data;
  } catch { /* Start a new record if this browser has no readable history. */ }
  return { current: null, scores: [] };
}

export function CapfAnalytica() {
  const { user } = useAuth();
  return user && <Workspace key={user.uid} storageKey={'capf-analytica-v1:' + user.uid} />;
}

function Workspace({ storageKey }: { storageKey: string }) {
  const [book, setBook] = useState(() => load(storageKey));
  const [saveError, setSaveError] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [confirm, setConfirm] = useState(false);
  const a = book.current;
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(book)); setSaveError(false); }
    catch { setSaveError(true); }
  }, [book, storageKey]);

  function finish() {
    setBook(previous => {
      const active = previous.current;
      if (!active || active.finished) return previous;
      return { current: { ...active, finished: true }, scores: active.drill ? previous.scores : [...previous.scores, report(active).net] };
    });
    setConfirm(false);
  }
  useEffect(() => {
    if (!a || a.finished) return;
    function tick() {
      const time = Date.now();
      setNow(time);
      if (time >= a!.deadline) finish();
    }
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [a?.deadline, a?.finished]);

  function start(ids = paper.map(q => q.id), drill = false) {
    setConfirm(false);
    setNow(Date.now());
    setBook(prev => ({ ...prev, current: startAttempt(ids, drill) }));
    window.scrollTo(0, 0);
  }
  function update(changes: Partial<Attempt>) {
    if (!a || a.finished) return;
    if (Date.now() >= a.deadline) { finish(); return; }
    setBook({ ...book, current: { ...a, ...changes } });
  }
  const q = a && paper.find(item => item.id === a.ids[a.index]);
  const response = (q && a?.answers[q.id]) || {};
  function answer(change: Partial<Response>) {
    if (a && q) update({ answers: { ...a.answers, [q.id]: { ...response, ...change } } });
  }
  const result = a?.finished ? report(a) : null;
  const seconds = a ? Math.max(0, Math.ceil((a.deadline - now) / 1000)) : 0;
  const answered = a ? Object.values(a.answers).filter(r => r.choice).length : 0;
  return <div className="mx-auto max-w-2xl space-y-5">
    <header><p className="eyebrow">UPSC CAPF · Paper I</p><h1 className="page-title mt-2">CAPF Analytica</h1></header>
    {saveError && <p role="alert">Browser storage is unavailable. Keep this page open to finish your attempt.</p>}
    {!a && <section className={panel}>
      <Crosshair aria-hidden="true" className="text-[#688461]" size={30} />
      <h2 className="text-2xl font-semibold">Take your baseline</h2>
      <p>Attempt a timed sectional from the DutyDeck practice bank. Your report shows marks earned, guessing penalties and questions to revisit.</p>
      <p className="text-sm">{paper.length} questions · {paper.length} minutes · {paper.length * 2} marks</p>
      <p className="text-sm">Correct +2 · Wrong −⅔ · Skipped 0</p>
      <button className={primary} onClick={() => start()}>Start timed practice</button>
    </section>}
    {a && !a.finished && q && <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
        <span>{a.drill ? 'Revision' : 'Paper I practice'} · {a.index + 1} of {a.ids.length}</span>
        <span className="flex items-center gap-2 tabular-nums"><Clock size={16} />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
      </div>
      <progress className="study-progress w-full" value={answered} max={a.ids.length} aria-label="Questions answered" />
      <h2 className="text-lg font-semibold">{q.questionText}</h2>
      {q.statements && <ol className="list-decimal space-y-2 pl-6">{q.statements.map(s => <li key={s}>{s}</li>)}</ol>}
      <p className="text-sm">Choose an answer. Use × to rule out an option.</p>
      <div className="space-y-2">{q.options.map(o => {
        const crossed = response.crossed?.includes(o.key);
        return <div key={o.key} className="flex gap-2">
          <button disabled={crossed} aria-pressed={response.choice === o.key} onClick={() => answer({ choice: o.key })}
            className={button + ' flex-1 text-left disabled:line-through disabled:opacity-55 aria-pressed:bg-[#315840] aria-pressed:text-white'}>{o.key}. {o.text}</button>
          <button aria-label={(crossed ? 'Restore ' : 'Rule out ') + o.key} aria-pressed={!!crossed} className={button}
            onClick={() => answer({ crossed: crossed ? response.crossed?.filter(k => k !== o.key) : [...response.crossed || [], o.key], choice: response.choice === o.key ? undefined : response.choice })}>{crossed ? '↺' : '×'}</button>
        </div>;
      })}</div>
      <div className="flex flex-wrap gap-2">
        <button className={button} disabled={!a.index} onClick={() => update({ index: a.index - 1 })}>Back</button>
        {response.choice && <button className={button} onClick={() => answer({ choice: undefined })}>Clear answer</button>}
        {a.index + 1 < a.ids.length && <button className={primary} onClick={() => update({ index: a.index + 1 })}>{response.choice ? 'Next' : 'Skip'}</button>}
      </div>
      {confirm ? <div className="space-y-2" role="group" aria-label="Confirm submission"><p>{answered} of {a.ids.length} answered. Submit for scoring?</p>
        <div className="flex flex-wrap gap-2"><button className={primary} onClick={finish}>Submit attempt</button><button className={button} onClick={() => setConfirm(false)}>Keep working</button></div></div>
        : <button className={button} onClick={() => setConfirm(true)}>Finish attempt</button>}
    </section>}
    {result && a && <>
      <section className={panel}><h2 className="section-title">{a.drill ? 'Revision report' : 'Sectional report'}</h2>
        <p className="text-4xl font-semibold tabular-nums">{result.net.toFixed(2)} <small className="text-base">/ {a.ids.length * 2} marks</small></p>
        <p>{result.correct} correct · {result.wrong} wrong · {result.skipped} skipped</p>
        <p>{result.correct * 2} marks earned · {result.penalty.toFixed(2)} deducted</p>
        <p>{result.eliminated ? `You ruled out the correct answer on ${result.crossedKey} of ${result.eliminated} questions where you used elimination.` : 'No options were ruled out on this attempt.'}</p>
        <div className="flex flex-wrap gap-2">{result.missed.length > 0 && <button className={primary} onClick={() => start(result.missed.map(item => item.id), true)}>Retry {result.missed.length} missed or skipped</button>}
          <button className={button} onClick={() => start()}>Retake sectional</button></div>
      </section>
      {result.missed.length > 0 && <section className={panel}><h2 className="section-title">Questions to revisit</h2>{result.missed.map(item => <details className="border-t border-current/15" key={item.id}><summary className="cursor-pointer py-4 font-medium">{item.microTopic} · {a.answers[item.id]?.choice ? 'Wrong' : 'Skipped'}</summary>
        <p>{item.questionText}</p>{item.statements && <ol className="my-2 list-decimal pl-6">{item.statements.map(s => <li key={s}>{s}</li>)}</ol>}
        <p className="my-2 font-semibold">Correct answer · {item.correctAnswer}. {item.options.find(o => o.key === item.correctAnswer)?.text}</p><p>{item.explanation.coreConcept}</p></details>)}</section>}
      <section className={panel}><h2 className="section-title">Sectional history</h2><ol className="space-y-2">{book.scores.map((score, i) => <li className="flex justify-between" key={i}><span>{i ? 'Retake ' + i : 'First attempt'}</span><strong>{score.toFixed(2)} / {paper.length * 2}</strong></li>)}</ol></section>
    </>}
    <p className="text-xs opacity-75">Attempts are saved in this browser.</p>
  </div>;
}
