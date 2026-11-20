import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { pyqOptionKeys, type PyqExplanation } from '../../shared/pyqCatalog';
import { apiFetch } from '../lib/api';
import { LoadingIndicator } from './LoadingIndicator';

type PanelState =
  | { status: 'loading' | 'missing' | 'generating' }
  | { status: 'ready'; explanation: PyqExplanation; generated: boolean }
  | { status: 'error'; action: 'load' | 'generate'; message: string };

async function requestExplanation(path: string, signal: AbortSignal, generate = false) {
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(generate ? 65000 : 12000)]);
  const response = await apiFetch(path, generate ? {
    method: 'POST', signal: requestSignal, headers: { 'Content-Type': 'application/json' }, body: '{}',
  } : { signal: requestSignal });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== 'object' || !('explanation' in data)) {
    throw new Error(data?.error || 'The explanation is unavailable. Try again.');
  }
  return data.explanation as PyqExplanation | null;
}

export function PyqExplanationPanel({ subjectId, questionId }: { subjectId: string; questionId: string }) {
  const path = `/pyq/${encodeURIComponent(subjectId)}/${encodeURIComponent(questionId)}/explanation`;
  const [state, setState] = useState<PanelState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const generation = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void requestExplanation(`/api${path}`, controller.signal).then(explanation => {
      if (controller.signal.aborted) return;
      setState(explanation ? { status: 'ready', explanation, generated: false } : { status: 'missing' });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ status: 'error', action: 'load', message: error.message });
    });
    return () => {
      controller.abort();
      generation.current?.abort();
    };
  }, [path, attempt]);

  async function generate() {
    if (generation.current) return;
    const controller = new AbortController();
    generation.current = controller;
    setState({ status: 'generating' });
    try {
      const explanation = await requestExplanation(`/api/ai${path}`, controller.signal, true);
      if (!explanation) throw new Error('An explanation was not returned. Try again.');
      if (!controller.signal.aborted) setState({ status: 'ready', explanation, generated: true });
    } catch (error) {
      if (!controller.signal.aborted) setState({
        status: 'error', action: 'generate', message: error instanceof Error ? error.message : 'Could not prepare an explanation.',
      });
    } finally {
      generation.current = null;
    }
  }

  if (state.status === 'ready') return <details open={state.generated} className="group rounded-lg border border-[#DDE1D2] dark:border-slate-700">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
      <Sparkles size={16} aria-hidden="true" /> AI explanation
      <ChevronDown size={16} aria-hidden="true" className="ml-auto group-open:rotate-180" />
    </summary>
    <ExplanationContent explanation={state.explanation} />
  </details>;

  if (state.status === 'loading' || state.status === 'generating') return <LoadingIndicator className="text-sm"
    label={state.status === 'loading' ? 'Checking for a saved explanation…' : 'Preparing a detailed explanation…'} />;

  if (state.status === 'error') return <div className="space-y-2">
    <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{state.message}</p>
    <button type="button" className="secondary-button" onClick={() => {
      if (state.action === 'generate') void generate();
      else {
        setState({ status: 'loading' });
        setAttempt(value => value + 1);
      }
    }}>Try again</button>
  </div>;

  return <button type="button" className="secondary-button" onClick={() => void generate()}>
    <Sparkles size={16} aria-hidden="true" /> Explain with AI
  </button>;
}

function ExplanationContent({ explanation }: { explanation: PyqExplanation }) {
  return <div className="space-y-5 border-t border-[#DDE1D2] p-4 text-sm leading-7 dark:border-slate-700 sm:p-5">
    <section><h3 className="font-semibold">Core concept</h3><p className="whitespace-pre-line">{explanation.concept}</p></section>
    <section>
      <h3 className="font-semibold">How to reason it through</h3>
      <ol className="list-decimal space-y-2 pl-5">{explanation.reasoning.map((step, index) => <li key={index} className="whitespace-pre-line">{step}</li>)}</ol>
    </section>
    <section>
      <h3 className="font-semibold">Option analysis</h3>
      <dl className="space-y-2">{pyqOptionKeys.map(key => <div key={key} className="flex gap-2">
        <dt className="font-semibold">{key.toUpperCase()}.</dt><dd className="whitespace-pre-line">{explanation.options[key]}</dd>
      </div>)}</dl>
    </section>
    <section><h3 className="font-semibold">How to approach similar questions</h3><p className="whitespace-pre-line">{explanation.examStrategy}</p></section>
    <section className="rounded-lg bg-[#F0F3E9] p-4 dark:bg-[#25352A]">
      <h3 className="font-semibold">Apply what you learned</h3>
      <p className="whitespace-pre-line">{explanation.practiceQuestion}</p>
      <details className="mt-2"><summary className="cursor-pointer font-medium">Show worked answer</summary>
        <p className="mt-2 whitespace-pre-line">{explanation.practiceAnswer}</p></details>
    </section>
  </div>;
}
