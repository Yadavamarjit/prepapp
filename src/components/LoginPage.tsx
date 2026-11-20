import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Layers3 } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../data/brand';

function signInMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'The sign-in window closed. Try again when you’re ready.';
  }
  if (code === 'auth/popup-blocked') return 'Allow pop-ups for CadetSlate, then try again.';
  if (code === 'auth/network-request-failed') return 'Could not reach Google. Check your connection and try again.';
  return 'Google sign-in could not be completed. Try again in a moment.';
}

export function LoginPage() {
  const { canUseAi, loading } = useAuth();
  const [params] = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const destination = params.get('for') === 'ai' ? '/ai-tutor' : '/dashboard';

  async function continueWithGoogle() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      const { signInWithGoogle } = await import('../lib/firebase');
      await signInWithGoogle();
    } catch (failure) {
      setError(signInMessage(failure));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (canUseAi) return <Navigate to={destination} replace />;

  return (
    <main className="flex min-h-dvh flex-col bg-[#f6f1e6] px-5 text-[#202b23] dark:bg-[#131b16] dark:text-[#e7eee8]">
      <header className="mx-auto flex min-h-20 w-full max-w-5xl items-center justify-between gap-4 border-b border-current/20">
        <Link to="/" className="inline-flex items-center gap-2.5 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-[#f2bf78] text-[#17281f]"><Layers3 size={20} aria-hidden="true" /></span>
          {APP_NAME}
        </Link>
        <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Home</Link>
      </header>
      <section aria-labelledby="sign-in-heading" className="mx-auto my-auto w-full max-w-md py-16">
        <h1 id="sign-in-heading" className="font-serif text-5xl leading-none tracking-tight sm:text-6xl">Sign in to CadetSlate</h1>
        <p className="mt-4 max-w-sm text-sm leading-7">Use Google to access the AI study planner, topic tutor and feedback on your Paper II writing.</p>
        <div className="mt-7 grid gap-3">
          <button type="button" className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-[#17281f] px-4 text-sm font-semibold text-white hover:bg-[#2d4635] disabled:opacity-60 dark:bg-[#f2bf78] dark:text-[#17281f]" onClick={continueWithGoogle} disabled={loading || pending}>
            {pending ? 'Opening Google sign-in…' : 'Continue with Google'} <ArrowRight size={17} aria-hidden="true" />
          </button>
          <Link to="/dashboard" className="flex min-h-12 items-center justify-center rounded-lg border border-current/30 px-4 text-sm font-semibold hover:underline">Keep studying without an account</Link>
        </div>
        {error && <p role="alert" className="mt-4 text-sm leading-6 text-[#9b382b] dark:text-[#ffd2c9]">{error}</p>}
      </section>
    </main>
  );
}
