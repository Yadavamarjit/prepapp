import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { House, BookOpen, PencilLine, RotateCcw, ChartNoAxesCombined, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudyPreferences } from '../context/StudyPreferences';
import { APP_NAME } from '../data/brand';

export type NavTab = 'OVERVIEW' | 'LEARNING' | 'ANALYTICS' | 'CPO_SPEED' | 'CAPF_ELIMINATION' | 'PAPER_2' | 'AI_TUTOR' | 'MISTAKE_VAULT' | 'DAILY_REVIEW';
const items = [
  { path: '/dashboard', label: 'Today', icon: House, matches: ['/dashboard'] },
  { path: '/books', label: 'Learn', icon: BookOpen, matches: ['/books', '/learning', '/ncert', '/reels', '/capf-syllabus', '/current-affairs'] },
  { path: '/practice', label: 'Practice', icon: PencilLine, matches: ['/practice', '/calculation-coach', '/capf-elimination', '/paper-2', '/ai-tutor'] },
  { path: '/revision', label: 'Revision', icon: RotateCcw, matches: ['/revision', '/daily-review', '/mistake-vault'] },
  { path: '/analytics', label: 'Progress', icon: ChartNoAxesCombined, matches: ['/analytics'] },
];
export function Navbar() {
  const { user, error, signOutUser } = useAuth();
  const { dark, setDark } = useStudyPreferences();
  const { pathname } = useLocation();
  const active = (matches: string[]) => matches.some(path => pathname === path || pathname.startsWith(path + '/'));
  const hasAccount = !!user;
  const current = items.find(item => active(item.matches))?.label || 'Study';
  const links = (mobile = false) => items.map(({ path, label, icon: Icon, matches }) => <Link key={path} to={path} aria-current={active(matches) ? 'page' : undefined}
    className={`${mobile ? 'flex-col gap-1 py-2 text-[11px]' : 'gap-3 rounded-lg px-3 py-3 text-sm'} flex items-center font-medium transition-colors ${active(matches) ? 'bg-[#E9EFE9] text-[#315840] dark:bg-[#273C2E] dark:text-[#B2D7BA]' : 'text-[#686C65] hover:bg-[#EFEFE9] dark:text-slate-400 dark:hover:bg-[#202C25]'}`}>
    <Icon size={mobile ? 19 : 18} strokeWidth={1.7} /><span>{label}</span>
  </Link>);
  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-[#E4E4DB] bg-[#FAFAF6] p-5 lg:flex dark:border-slate-800 dark:bg-[#151D18]">
      <Link to="/" aria-label={`${APP_NAME} home`} className="mb-12 flex items-center gap-2.5 px-2 pt-3 text-xl font-semibold tracking-tight"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#315840] text-white"><BookOpen size={17} aria-hidden="true" /></span>{APP_NAME}</Link>
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#898D82]">Your workspace</p>
      <nav aria-label="Main navigation" className="space-y-1">{links()}</nav>
      <div className="mt-auto space-y-5 px-2">
        <div className="border-t border-[#E4E4DB] pt-5 dark:border-slate-800"><p className="text-sm font-medium">A little, every day.</p><p className="mt-1 text-xs leading-5 text-[#777C71] dark:text-slate-400">Learn one concept. Recall it tomorrow.</p></div>
        {hasAccount && <div className="flex items-center justify-between gap-2"><p className="min-w-0 truncate text-sm font-medium">{user.displayName || user.email?.split('@')[0]}</p><button type="button" onClick={() => void signOutUser()} className="rounded-lg p-2 hover:bg-[#E9EFE9] dark:hover:bg-[#273C2E]" aria-label="Sign out"><LogOut size={16} /></button></div>}
        {!hasAccount && <p className="text-xs text-[#626B59] dark:text-slate-400">Progress is saved in this browser.</p>}
      </div>
    </aside>
    <header className="sticky top-0 z-30 border-b border-[#E4E4DB] bg-[#F7F7F2]/95 backdrop-blur-sm lg:ml-56 dark:border-slate-800 dark:bg-[#121816]/95">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3"><Link to="/" aria-label={`${APP_NAME} home`} className="text-lg font-semibold tracking-tight lg:hidden">{APP_NAME}</Link><span className="hidden text-sm text-[#777C71] lg:block">Your workspace <span className="mx-2 text-[#BBBFB4]">/</span><span className="text-[#30392D] dark:text-slate-200">{current}</span></span></div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs font-semibold">UPSC CAPF</span>
          <button type="button" className="rounded-lg p-2 text-[#777C71] hover:bg-[#E9EFE9] dark:hover:bg-[#273C2E]" onClick={() => setDark(!dark)} aria-label={dark ? 'Use light appearance' : 'Use dark appearance'}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
          {hasAccount && <button type="button" className="p-2 lg:hidden" onClick={() => void signOutUser()} aria-label="Sign out"><LogOut size={17} /></button>}
        </div>
      </div>
      {error && <p role="alert" className="mx-auto max-w-6xl px-5 pb-3 text-sm text-rose-800 dark:text-rose-300">{error}</p>}
    </header>
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#E4E4DB] bg-[#FAFAF6] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1 lg:hidden dark:border-slate-800 dark:bg-[#151D18]">{links(true)}</nav>
  </>;
}
