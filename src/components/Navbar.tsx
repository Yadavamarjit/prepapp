import React from 'react';
import { 
  Compass, 
  Zap, 
  CheckSquare, 
  PenTool, 
  Sparkles, 
  Archive, 
  ShieldCheck, 
  Flame,
  TrendingUp,
  LogOut,
  BookOpen,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'OVERVIEW' | 'LEARNING' | 'ANALYTICS' | 'CPO_SPEED' | 'CAPF_ELIMINATION' | 'PAPER_2' | 'AI_TUTOR' | 'MISTAKE_VAULT';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  vaultCount: number;
  completedQuestionsCount: number;
  streakDays: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  vaultCount,
  completedQuestionsCount,
  streakDays,
}) => {
  const { user, loading, signIn, signOutUser, authError } = useAuth();

  const navItems = [
    { id: 'OVERVIEW' as NavTab, label: 'Dual Overview', icon: Compass },
    { id: 'LEARNING' as NavTab, label: 'NCERT Study Hub', icon: BookOpen, badge: 'Syllabus', highlight: true },
    { id: 'ANALYTICS' as NavTab, label: 'Analytics & Matrix', icon: TrendingUp, badge: 'Live' },
    { id: 'CPO_SPEED' as NavTab, label: 'CPO Speed (15m)', icon: Zap, badge: 'CBT' },
    { id: 'CAPF_ELIMINATION' as NavTab, label: 'CAPF Elimination', icon: CheckSquare, badge: 'P1' },
    { id: 'PAPER_2' as NavTab, label: 'Paper 2 Lab', icon: PenTool, badge: 'Descriptive' },
    { id: 'AI_TUTOR' as NavTab, label: 'AI Syllabus Tutor', icon: Sparkles },
    { id: 'MISTAKE_VAULT' as NavTab, label: 'Mistake Vault & SRS', icon: Archive, count: vaultCount },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 dark:bg-[#121816]/90 backdrop-blur-md border-b border-[#E2E6DD] dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => onTabChange('OVERVIEW')}
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#36624B] flex items-center justify-center text-white shadow-sm shadow-[#36624B]/20 group-hover:bg-[#2A4F3C] transition-all">
              <ShieldCheck className="w-5 h-5 text-[#E3EFE8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-[#1E252B] dark:text-white font-sans">
                  DutyDeck
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#E3EFE8] text-[#36624B] dark:bg-[#1A2E24] dark:text-[#88D4A8] border border-[#36624B]/15 hidden sm:inline-block">
                  CAPF AC × CPO
                </span>
              </div>
              <p className="text-[11px] text-[#5C646B] dark:text-slate-400 font-medium hidden sm:block">
                Dual-Target Objective & Subjective Engine
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & Google Login */}
          <div className="flex items-center gap-3 text-xs">
            {/* Routine and Solved metrics */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F8F5] dark:bg-[#1A2420] border border-[#E2E6DD] dark:border-slate-800 text-[#5C646B] dark:text-slate-300">
                <Flame className="w-3.5 h-3.5 text-[#D97746]" />
                <span className="font-semibold text-[#1E252B] dark:text-white">{streakDays}</span> Day Routine
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F8F5] dark:bg-[#1A2420] border border-[#E2E6DD] dark:border-slate-800 text-[#5C646B] dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#2E7D5B]"></span>
                <span className="font-semibold text-[#1E252B] dark:text-white">{completedQuestionsCount}</span> Solved
              </div>
              {vaultCount > 0 && (
                <div 
                  onClick={() => onTabChange('MISTAKE_VAULT')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBEAE8] text-[#C25345] border border-[#C25345]/20 cursor-pointer hover:bg-[#F8DED9] transition-all"
                >
                  <span className="font-semibold">{vaultCount}</span> in Vault
                </div>
              )}
            </div>

            {/* Google Authentication Section */}
            {loading ? (
              <div className="w-8 h-8 rounded-full border-2 border-[#36624B] border-t-transparent animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div 
                  className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F7F8F5] dark:bg-[#1A2420] border border-[#E2E6DD] dark:border-slate-800 shadow-2xs"
                  title={`Signed in as ${user.email}`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Aspirant'}
                      className="w-5 h-5 rounded-full object-cover border border-[#36624B]/30"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#36624B] text-white flex items-center justify-center text-[10px] font-bold">
                      {(user.displayName || user.email || 'A')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-[#1E252B] dark:text-white max-w-[100px] sm:max-w-[130px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>

                <button
                  onClick={signOutUser}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-[#5C646B] hover:text-[#C25345] hover:bg-[#FBEAE8] dark:hover:bg-[#2E1815] transition-all cursor-pointer border border-[#E2E6DD] dark:border-slate-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-white dark:bg-[#1A2420] hover:bg-[#F7F8F5] dark:hover:bg-[#121816] text-[#1E252B] dark:text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer group"
              >
                {/* Official Google G Logo SVG */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="font-medium text-xs">Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Scrollable on mobile) */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar border-t border-[#E2E6DD]/60 dark:border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-[#36624B] text-white shadow-sm shadow-[#36624B]/25'
                    : item.highlight
                    ? 'text-[#36624B] dark:text-[#88D4A8] bg-[#E3EFE8]/70 dark:bg-[#1A2E24]/60 hover:bg-[#E3EFE8]'
                    : 'text-[#5C646B] dark:text-slate-300 hover:text-[#1E252B] dark:hover:text-white hover:bg-[#F2F4F0] dark:hover:bg-[#1A2420]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.highlight ? 'text-[#36624B] dark:text-[#88D4A8]' : 'text-[#5C646B] dark:text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#EEF0EA] dark:bg-slate-800 text-[#5C646B] dark:text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white text-[#36624B]' : 'bg-[#C25345] text-white'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
