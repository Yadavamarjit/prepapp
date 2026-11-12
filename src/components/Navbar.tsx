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
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'OVERVIEW' | 'LEARNING' | 'ANALYTICS' | 'CPO_SPEED' | 'CAPF_ELIMINATION' | 'PAPER_2' | 'AI_TUTOR' | 'MISTAKE_VAULT';

interface NavbarProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  vaultCount: number;
  completedQuestionsCount: number;
  streakDays: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab: propActiveTab,
  onTabChange,
  vaultCount,
  completedQuestionsCount,
  streakDays,
}) => {
  const { user, loading, signOutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive current tab from route pathname if not explicitly passed
  const getTabFromPath = (path: string): NavTab => {
    if (path.startsWith('/learning')) return 'LEARNING';
    if (path.startsWith('/analytics')) return 'ANALYTICS';
    if (path.startsWith('/cpo-speed')) return 'CPO_SPEED';
    if (path.startsWith('/capf-elimination')) return 'CAPF_ELIMINATION';
    if (path.startsWith('/paper-2')) return 'PAPER_2';
    if (path.startsWith('/ai-tutor')) return 'AI_TUTOR';
    if (path.startsWith('/mistake-vault')) return 'MISTAKE_VAULT';
    return 'OVERVIEW';
  };

  const currentTab = propActiveTab || getTabFromPath(location.pathname);

  const navItems = [
    { id: 'OVERVIEW' as NavTab, path: '/', label: 'Dual Overview', icon: Compass },
    { id: 'LEARNING' as NavTab, path: '/learning', label: 'NCERT Study Hub', icon: BookOpen, badge: 'Syllabus', highlight: true },
    { id: 'ANALYTICS' as NavTab, path: '/analytics', label: 'Analytics & Matrix', icon: TrendingUp, badge: 'Live' },
    { id: 'CPO_SPEED' as NavTab, path: '/cpo-speed', label: 'CPO Speed (15m)', icon: Zap, badge: 'CBT' },
    { id: 'CAPF_ELIMINATION' as NavTab, path: '/capf-elimination', label: 'CAPF Elimination', icon: CheckSquare, badge: 'P1' },
    { id: 'PAPER_2' as NavTab, path: '/paper-2', label: 'Paper 2 Lab', icon: PenTool, badge: 'Descriptive' },
    { id: 'AI_TUTOR' as NavTab, path: '/ai-tutor', label: 'AI Syllabus Tutor', icon: Sparkles },
    { id: 'MISTAKE_VAULT' as NavTab, path: '/mistake-vault', label: 'Mistake Vault & SRS', icon: Archive, count: vaultCount },
  ];

  const handleNavigate = (path: string, tabId: NavTab) => {
    if (onTabChange) onTabChange(tabId);
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 dark:bg-[#121816]/90 backdrop-blur-md border-b border-[#E2E6DD] dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand Identity */}
          <Link 
            to="/"
            onClick={() => onTabChange?.('OVERVIEW')}
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
                Multi-Page Dual-Target Objective & Subjective Engine
              </p>
            </div>
          </Link>

          {/* Quick Metrics Bar & User Session Section */}
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
                <button 
                  onClick={() => handleNavigate('/mistake-vault', 'MISTAKE_VAULT')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBEAE8] text-[#C25345] border border-[#C25345]/20 cursor-pointer hover:bg-[#F8DED9] transition-all"
                >
                  <span className="font-semibold">{vaultCount}</span> in Vault
                </button>
              )}
            </div>

            {/* Authenticated User Profile & Sign Out Button */}
            {loading ? (
              <div className="w-8 h-8 rounded-full border-2 border-[#36624B] border-t-transparent animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div 
                  className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F7F8F5] dark:bg-[#1A2420] border border-[#E2E6DD] dark:border-slate-800 shadow-2xs"
                  title={`Signed in as ${user.email || user.displayName}`}
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
                  {user.isGuest && (
                    <span className="text-[9px] px-1 py-0.2 bg-[#36624B]/15 text-[#36624B] dark:text-[#88D4A8] rounded font-mono uppercase">
                      Cadet
                    </span>
                  )}
                </div>

                <button
                  onClick={handleSignOut}
                  title="Sign Out (Lock Session)"
                  className="p-1.5 rounded-lg text-[#5C646B] hover:text-[#C25345] hover:bg-[#FBEAE8] dark:hover:bg-[#2E1815] transition-all cursor-pointer border border-[#E2E6DD] dark:border-slate-800 flex items-center gap-1 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lock / Exit</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#36624B] bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Cadet Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Page Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar border-t border-[#E2E6DD]/60 dark:border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path, item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
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

