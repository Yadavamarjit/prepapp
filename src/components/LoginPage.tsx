import { useState } from 'react';
import { ArrowRight, BookOpen, Clock3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../data/brand';
import { paper } from '../utils/capfAttempt';

export function LoginPage() {
  const { signIn, signInAsGuest, authError, loading } = useAuth();
  const [pending, setPending] = useState<'google' | 'guest' | null>(null);
  const [error, setError] = useState('');
  async function enter(method: 'google' | 'guest') {
    setPending(method);
    setError('');
    try {
      if (method === 'google') await signIn();
      else await signInAsGuest('Guest');
    } catch {
      setError('Could not open your workspace. Please try again.');
    } finally {
      setPending(null);
    }
  }
  return <main className="min-h-dvh bg-[#f7f7f2] px-5 text-[#25382c] dark:bg-[#131b16] dark:text-[#e7eee8]">
    <div className="mx-auto max-w-5xl">
      <header className="flex h-16 items-center gap-2 border-b border-current/20 text-lg font-semibold"><BookOpen size={21} aria-hidden="true"/> {APP_NAME}</header>
      <div className="grid gap-8 py-9 sm:py-16 md:grid-cols-2 md:items-center md:gap-14 md:py-24">
        <section><h1 className="font-serif text-[clamp(2.8rem,7vw,5rem)] leading-[1.02] tracking-tight">Prepare for<br/>UPSC CAPF</h1>
          <p className="my-5 max-w-sm leading-7">Practise Paper I under time pressure, work on Paper II writing, and revisit the questions you missed.</p>
          <div className="grid max-w-sm gap-2">
            <button className="workbook-button" disabled={loading || !!pending} onClick={() => enter('google')}>{pending === 'google' ? 'Opening Google sign-in…' : 'Continue with Google'} <ArrowRight size={18}/></button>
            <button className="min-h-12 rounded-lg border border-current/35 font-semibold" disabled={loading || !!pending} onClick={() => enter('guest')}>{pending === 'guest' ? 'Opening practice…' : 'Try as guest'}</button>
          </div>
          {(error || authError) && <p role="alert" className="mt-3 text-sm">{error || authError}</p>}
        </section>
        <section className="workbook-cover"><p className="workbook-label">Paper I · General ability</p>
          <h2 className="my-4 font-serif text-4xl leading-tight">Your first sectional</h2>
          <p className="flex items-center gap-2 text-sm"><Clock3 size={16}/> {paper.length} questions · {paper.length} minutes</p>
          <div className="mt-6 border-t border-current/25 pt-4"><p className="text-sm">Scoring per question</p>
            <dl className="mt-3 grid grid-cols-3 gap-2">{[['Correct','+2'],['Wrong','−⅔'],['Skipped','0']].map(([label,value]) => <div key={label}><dt className="text-xs">{label}</dt><dd className="mt-1 font-serif text-3xl">{value}</dd></div>)}</dl>
          </div>
        </section>
      </div>
    </div>
  </main>;
}
