import { useState, type ComponentPropsWithoutRef } from 'react';
import { LoadingIndicator } from './LoadingIndicator';

const overlay = 'pointer-events-none absolute inset-0 grid place-items-center p-4 text-center text-sm';

export function TextbookPageImage(props: ComponentPropsWithoutRef<'img'>) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  return (
    <>
      <img {...props} onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />
      {status === 'loading' && <LoadingIndicator label="Loading textbook page…" className={`${overlay} text-slate-700`} />}
      {status === 'error' && <p role="status" className={`${overlay} bg-white text-slate-700`}>Could not load this textbook page.</p>}
    </>
  );
}

export function TextbookPdfFrame(props: ComponentPropsWithoutRef<'iframe'>) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative h-full">
      <iframe {...props} onLoad={() => setLoading(false)} />
      {loading && <LoadingIndicator label="Opening PDF…" className={`${overlay} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`} />}
    </div>
  );
}
