import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Zap, 
  CheckSquare, 
  PenTool, 
  BookOpen, 
  Archive, 
  ArrowRight,
  AlertCircle,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signIn, signInAsGuest, authError, clearAuthError, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [demoCadetName, setDemoCadetName] = useState('Cadet Officer Amarjit');
  const [showCadetInput, setShowCadetInput] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
      if (onSuccess) onSuccess();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInAsGuest(
        demoCadetName.trim() || 'Officer Cadet Amarjit',
        'cadet.amarjit@dutydeck.defense.in'
      );
      if (onSuccess) onSuccess();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] dark:bg-[#101614] text-[#1E252B] dark:text-[#E6EAE8] flex flex-col justify-between font-sans selection:bg-[#36624B]/20">
      
      {/* Top Security Banner */}
      <div className="border-b border-[#E2E6DD] dark:border-slate-800 bg-white/70 dark:bg-[#141C19]/70 backdrop-blur-sm py-2.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] font-mono tracking-wider text-[#5C646B] dark:text-slate-400 uppercase">
          <Lock className="w-3.5 h-3.5 text-[#36624B] dark:text-[#88D4A8]" />
          <span>Restricted Portal &bull; Authentication Required to Access Operational Training Decks</span>
        </div>
      </div>

      {/* Main Authentication Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14">
        
        {/* Left Column: Brand & High-Yield Curriculum Showcase */}
        <div className="flex-1 w-full max-w-xl space-y-6 text-center lg:text-left">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3EFE8] dark:bg-[#1A2E24] text-[#36624B] dark:text-[#88D4A8] border border-[#36624B]/20 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#36624B] dark:text-[#88D4A8]" />
            <span>DutyDeck Operational Command</span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E252B] dark:text-white tracking-tight leading-tight">
              Prepare for <br className="hidden sm:inline" />
              <span className="text-[#36624B] dark:text-[#88D4A8]">UPSC CAPF (AC)</span>
            </h1>
            <p className="text-sm sm:text-base text-[#5C646B] dark:text-slate-300 leading-relaxed font-normal">
              Practise Paper I questions, review your mistakes, and develop your Paper II writing.
            </p>
          </div>

          {/* Operational Module Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="p-3 rounded-xl bg-white dark:bg-[#17211D] border border-[#E2E6DD] dark:border-slate-800 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#E3EFE8] dark:bg-[#1A2E24] text-[#36624B] dark:text-[#88D4A8] flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1E252B] dark:text-white">CAPF Analytica</h4>
                <p className="text-[11px] text-[#5C646B] dark:text-slate-400 mt-0.5">Timed Paper I practice with a marks breakdown and targeted revision.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#17211D] border border-[#E2E6DD] dark:border-slate-800 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#E8F0FE] dark:bg-[#15233E] text-[#2F7C7E] dark:text-[#5E9EFF] flex-shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1E252B] dark:text-white">CAPF Elimination Deck</h4>
                <p className="text-[11px] text-[#5C646B] dark:text-slate-400 mt-0.5">Interactive scratchpad for binary distractor crossed-out deductions.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#17211D] border border-[#E2E6DD] dark:border-slate-800 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#FBEAE8] dark:bg-[#2C1816] text-[#C25345] dark:text-[#FF7D6B] flex-shrink-0">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1E252B] dark:text-white">Paper 2 Argument Lab</h4>
                <p className="text-[11px] text-[#5C646B] dark:text-slate-400 mt-0.5">Counter-argument structuring, précis rules, and official 20-mark rubric.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#17211D] border border-[#E2E6DD] dark:border-slate-800 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#FEF6E9] dark:bg-[#2B2011] text-[#D97746] dark:text-[#FFA96B] flex-shrink-0">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1E252B] dark:text-white">Spaced Repetition Vault</h4>
                <p className="text-[11px] text-[#5C646B] dark:text-slate-400 mt-0.5">Leitner-calibrated review intervals targeting your specific error patterns.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="w-full max-w-md flex-shrink-0">
          <div className="bg-white dark:bg-[#16201C] rounded-2xl border border-[#E2E6DD] dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-[#36624B]/5 relative overflow-hidden">
            
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#36624B] via-[#2F7C7E] to-[#D97746]" />

            {/* Shield Icon & Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E3EFE8] dark:bg-[#1A2E24] flex items-center justify-center text-[#36624B] dark:text-[#88D4A8] shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#1E252B] dark:text-white">
                Cadet Identification Gate
              </h2>
              <p className="text-xs text-[#5C646B] dark:text-slate-400">
                Sign in to synchronize study telemetry, syllabus mastery, and test metrics
              </p>
            </div>

            {/* Error banner if sign-in failed */}
            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-[#FBEAE8] dark:bg-[#2B1815] border border-[#C25345]/30 text-[#C25345] text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Authentication Notice</p>
                  <p className="mt-0.5">{authError}</p>
                </div>
                <button 
                  onClick={clearAuthError}
                  className="text-xs font-bold text-[#C25345] hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Primary Action: Google Authentication */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || loading}
                className="w-full py-3 px-4 rounded-xl border border-[#D5DCD2] dark:border-slate-700 bg-white dark:bg-[#1F2B26] hover:bg-[#F7F8F5] dark:hover:bg-[#1A2420] text-[#1E252B] dark:text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {/* Official Google G Logo */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                <span>{isSigningIn ? 'Opening Security Popup...' : 'Continue with Google Account'}</span>
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E2E6DD] dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                  <span className="bg-white dark:bg-[#16201C] px-3 text-[#8B949E]">
                    or instant officer pass
                  </span>
                </div>
              </div>

              {/* Instant Officer Demo Pass */}
              <div className="space-y-2">
                {!showCadetInput ? (
                  <button
                    onClick={handleDemoSignIn}
                    disabled={isSigningIn}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#36624B] hover:bg-[#2A4F3C] text-white font-medium text-xs shadow-sm shadow-[#36624B]/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <Award className="w-4 h-4 text-[#88D4A8]" />
                    <span>Enter as Officer Cadet (1-Click Evaluation)</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <div className="space-y-2 p-3 rounded-xl bg-[#F7F8F5] dark:bg-[#1B2621] border border-[#E2E6DD] dark:border-slate-800">
                    <label className="block text-[11px] font-semibold text-[#5C646B] dark:text-slate-300">
                      Cadet Call-sign / Aspirant Name
                    </label>
                    <input
                      type="text"
                      value={demoCadetName}
                      onChange={(e) => setDemoCadetName(e.target.value)}
                      placeholder="e.g. Cadet Amarjit"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#D5DCD2] dark:border-slate-700 bg-white dark:bg-[#121816] text-[#1E252B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#36624B]"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleDemoSignIn}
                        className="flex-1 py-1.5 px-3 bg-[#36624B] hover:bg-[#2A4F3C] text-white rounded-lg text-xs font-semibold"
                      >
                        Enter Decks
                      </button>
                      <button
                        onClick={() => setShowCadetInput(false)}
                        className="py-1.5 px-3 bg-transparent hover:bg-black/5 text-[#5C646B] rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-[#5C646B] dark:text-slate-400 px-1 pt-1">
                  <span>Need custom callsign?</span>
                  <button 
                    onClick={() => setShowCadetInput(!showCadetInput)}
                    className="text-[#36624B] dark:text-[#88D4A8] font-semibold hover:underline"
                  >
                    {showCadetInput ? 'Use Default' : 'Custom Callsign'}
                  </button>
                </div>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="mt-6 pt-5 border-t border-[#E2E6DD] dark:border-slate-800 text-[11px] text-[#5C646B] dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D5B]" />
                Zero-Trust Firestore Rules
              </span>
              <span>Encrypted Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E2E6DD] dark:border-slate-800 bg-white/60 dark:bg-[#121816]/60 py-4 text-center text-xs text-[#5C646B] dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1E252B] dark:text-white">DutyDeck</span>
            <span>&bull; UPSC CAPF Assistant Commandants</span>
          </div>
          <div className="text-[11px] font-mono">
            Auth Gate Active &bull; Multi-Page Routing &bull; Cloud Synchronized
          </div>
        </div>
      </footer>
    </div>
  );
};
