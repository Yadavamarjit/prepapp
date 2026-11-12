import React from 'react';
import { 
  Zap, 
  CheckSquare, 
  PenTool, 
  Sparkles, 
  Archive, 
  Clock, 
  Target, 
  Layers, 
  TrendingUp, 
  ArrowRight,
  BookMarked,
  BookOpen
} from 'lucide-react';
import { NavTab } from './Navbar';
import { Question, MistakeRecord, Paper2Submission } from '../types';

interface OverviewDashboardProps {
  onNavigate: (tab: NavTab) => void;
  questions: Question[];
  mistakes: MistakeRecord[];
  submissions: Paper2Submission[];
  solvedQuestionIds: string[];
  onSelectTopicForAi: (topicTitle: string, subject: string, standardRef: string) => void;
  onOpenChapter?: (chapterId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate,
  questions,
  mistakes,
  submissions,
  solvedQuestionIds,
  onSelectTopicForAi,
  onOpenChapter,
}) => {
  const totalQuestions = questions.length;
  const solvedCount = solvedQuestionIds.length;
  const accuracy = solvedCount > 0 ? Math.round(((solvedCount - mistakes.length) / solvedCount) * 100) : 0;
  const safeAccuracy = Math.max(0, Math.min(100, accuracy));

  // Overlap vs Specific calculation
  const sharedQuestions = questions.filter(q => q.targetExam.includes('UPSC_CAPF') && q.targetExam.includes('SSC_CPO')).length;
  const capfOnlyQuestions = questions.filter(q => q.targetExam.includes('UPSC_CAPF') && !q.targetExam.includes('SSC_CPO')).length;
  const cpoOnlyQuestions = questions.filter(q => q.targetExam.includes('SSC_CPO') && !q.targetExam.includes('UPSC_CAPF')).length;

  const dueSrsCount = mistakes.filter(m => m.nextReviewDate <= Date.now()).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Mission Header */}
      <section className="bg-gradient-to-br from-[#FFFFFF] to-[#F2F4F0] dark:from-[#1A2420] dark:to-[#121816] rounded-2xl p-6 sm:p-8 border border-[#E2E6DD] dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#E3EFE8] dark:bg-[#1A2E24] text-[#36624B] dark:text-[#88D4A8] text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Dual-Target Strategy Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E252B] dark:text-white font-sans">
              Master the Overlap. Conquer the Divergence.
            </h1>
            <p className="text-sm text-[#5C646B] dark:text-slate-300 leading-relaxed">
              Bridge the high-speed objective arithmetic of <strong className="text-[#D97746] font-semibold">SSC CPO (100M / 60m CBT)</strong> with the multi-statement elimination depth and argument writing of <strong className="text-[#36624B] dark:text-[#88D4A8] font-semibold">UPSC CAPF AC (Paper 1 & Paper 2)</strong>.
            </p>
          </div>

          {/* Quick Dual Exam Readiness Indicators */}
          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <div 
              onClick={() => onNavigate('ANALYTICS')}
              className="bg-[#FFFFFF] dark:bg-[#121816] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 hover:border-[#D97746]/50 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#D97746]">
                <span>SSC CPO Track</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#1E252B] dark:text-white font-mono">15m</span>
                <span className="text-xs text-[#5C646B] dark:text-slate-400">Sectional Gate</span>
              </div>
              <p className="text-[11px] text-[#5C646B] dark:text-slate-400 mt-1">
                Quant Shortcuts & Speed Flagging (&gt;45s)
              </p>
            </div>

            <div 
              onClick={() => onNavigate('ANALYTICS')}
              className="bg-[#FFFFFF] dark:bg-[#121816] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/50 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#36624B] dark:text-[#88D4A8]">
                <span>UPSC CAPF Track</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#1E252B] dark:text-white font-mono">200M</span>
                <span className="text-xs text-[#5C646B] dark:text-slate-400">P1 + P2 Lab</span>
              </div>
              <p className="text-[11px] text-[#5C646B] dark:text-slate-400 mt-1">
                Statement Elimination & Argument Scaffolding
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Foundational NCERT & Standard Textbook Academy Banner */}
      <section className="bg-gradient-to-r from-[#1A3326] via-[#2A4D3B] to-[#1E252B] rounded-2xl p-6 text-white shadow-sm border border-[#36624B]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#E3EFE8]/20 text-[#88D4A8] text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Complete Self-Reliant Curriculum</span>
          </div>
          <h2 className="text-xl font-bold font-serif tracking-tight text-white">
            NCERT & Standard Textbook Study Hub
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Learn every subject from scratch before testing: NCERT Class 11-12, M. Laxmikanth, Spectrum, and Border Security geography with deep textual lessons, comparison tables, examiner traps, and instant comprehension checks.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate('LEARNING')}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#E3EFE8] text-[#1A3326] text-xs font-bold hover:bg-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 text-[#36624B]" />
            <span>Open Study Hub</span>
          </button>
        </div>
      </section>

      {/* Bento Grid: Core Product Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: CPO Speed Sprint */}
        <div 
          onClick={() => onNavigate('CPO_SPEED')}
          className="group cursor-pointer bg-[#FFFFFF] dark:bg-[#1A2420] p-5 rounded-xl border border-[#E2E6DD] dark:border-slate-800 hover:border-[#D97746]/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#D97746]/10 text-[#D97746] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#1E252B] dark:text-white">CPO Speed Sprint</h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#D97746]/10 text-[#D97746]">
                15-Min Lock
              </span>
            </div>
            <p className="text-xs text-[#5C646B] dark:text-slate-400 mt-2 leading-relaxed">
              Auto-locking sectional timer replicating Paper 1 CBT. Automatic &gt;45s speed alerts and formula breakdowns.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#EEF0EA] dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#D97746]">
            <span>Start Speed Drill</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: CAPF Multi-Statement Elimination */}
        <div 
          onClick={() => onNavigate('CAPF_ELIMINATION')}
          className="group cursor-pointer bg-[#FFFFFF] dark:bg-[#1A2420] p-5 rounded-xl border border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#E3EFE8] text-[#36624B] dark:bg-[#1A2E24] dark:text-[#88D4A8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#1E252B] dark:text-white">Elimination Engine</h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#E3EFE8] text-[#36624B] dark:bg-[#1A2E24] dark:text-[#88D4A8]">
                UPSC Paper 1
              </span>
            </div>
            <p className="text-xs text-[#5C646B] dark:text-slate-400 mt-2 leading-relaxed">
              Multi-statement MCQs (1, 2, 3 format) with interactive scratchpad to strike through false statements and auto-deduce options.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#EEF0EA] dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#36624B] dark:text-[#88D4A8]">
            <span>Practice Elimination</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Paper 2 Argument & Structure Lab */}
        <div 
          onClick={() => onNavigate('PAPER_2')}
          className="group cursor-pointer bg-[#FFFFFF] dark:bg-[#1A2420] p-5 rounded-xl border border-[#E2E6DD] dark:border-slate-800 hover:border-[#4B5A8E]/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#4B5A8E]/10 text-[#4B5A8E] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <PenTool className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#1E252B] dark:text-white">Paper 2 Desk</h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#4B5A8E]/10 text-[#4B5A8E]">
                Gemini Rubric
              </span>
            </div>
            <p className="text-xs text-[#5C646B] dark:text-slate-400 mt-2 leading-relaxed">
              Timed markdown editor with Argument 3-part splitters, report headers, précis word meters, and AI subjective scoring out of 20M.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#EEF0EA] dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#4B5A8E]">
            <span>Open Writing Desk</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: AI Syllabus Tutor ("Break Topic Down Easy") */}
        <div 
          onClick={() => onNavigate('AI_TUTOR')}
          className="group cursor-pointer bg-gradient-to-b from-[#FFFFFF] to-[#E3EFE8]/30 dark:from-[#1A2420] dark:to-[#121816] p-5 rounded-xl border border-[#36624B]/30 hover:border-[#36624B] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#36624B] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm shadow-[#36624B]/30">
              <Sparkles className="w-5 h-5 text-[#E3EFE8]" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#1E252B] dark:text-white">AI Syllabus Tutor</h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#36624B] text-white">
                Personal AI
              </span>
            </div>
            <p className="text-xs text-[#5C646B] dark:text-slate-400 mt-2 leading-relaxed">
              Break down any tough syllabus topic simply: ELI5 concepts, UPSC analytical depth, CPO speed shortcuts, and custom question generator.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#36624B]/15 flex items-center justify-between text-xs font-semibold text-[#36624B] dark:text-[#88D4A8]">
            <span>Break Down a Topic</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* Routine Tracker & Unified Overlap Bento */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Syllabus Overlap Matrix & High-Yield Micro-Topics */}
        <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl p-6 border border-[#E2E6DD] dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1E252B] dark:text-white">
                Syllabus Overlap Matrix & High-Yield Targets
              </h2>
              <p className="text-xs text-[#5C646B] dark:text-slate-400">
                Shared foundational core vs exam-specific modules
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('ANALYTICS')}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#E3EFE8] dark:bg-[#1A2E24] text-[#36624B] dark:text-[#88D4A8] hover:bg-[#36624B] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Full Analytics & Matrix</span>
              </button>
              <button 
                onClick={() => onNavigate('AI_TUTOR')}
                className="text-xs font-semibold text-[#36624B] dark:text-[#88D4A8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Explore All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Overlap Progress Bar */}
          <div className="space-y-3 mb-6 bg-[#F7F8F5] dark:bg-[#121816] p-4 rounded-lg border border-[#EEF0EA] dark:border-slate-800">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[#2F7C7E] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2F7C7E]"></span>
                Shared Core ({sharedQuestions} Qs)
              </span>
              <span className="text-[#36624B] dark:text-[#88D4A8] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#36624B]"></span>
                CAPF Analytical ({capfOnlyQuestions} Qs)
              </span>
              <span className="text-[#D97746] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D97746]"></span>
                CPO Speed ({cpoOnlyQuestions} Qs)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#E2E6DD] dark:bg-slate-800 overflow-hidden flex">
              <div style={{ width: `${(sharedQuestions / totalQuestions) * 100}%` }} className="bg-[#2F7C7E]" title="Shared Core" />
              <div style={{ width: `${(capfOnlyQuestions / totalQuestions) * 100}%` }} className="bg-[#36624B]" title="CAPF Only" />
              <div style={{ width: `${(cpoOnlyQuestions / totalQuestions) * 100}%` }} className="bg-[#D97746]" title="CPO Only" />
            </div>
          </div>

          {/* High-Yield Micro-Topics Ready to Break Down */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 mb-2">
              Instant AI Topic Breakdowns (Click to Teach):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  title: 'Emergency Provisions (Art 352, 356, 360)',
                  subject: 'Polity & Constitution',
                  tag: 'Shared Core',
                  ref: 'M. Laxmikanth Ch. 16',
                  color: 'border-l-4 border-l-[#2F7C7E]',
                },
                {
                  title: 'Armed Forces & Fundamental Rights (Art 33-35)',
                  subject: 'Polity & Constitution',
                  tag: 'CAPF Focus',
                  ref: 'M. Laxmikanth Ch. 7',
                  color: 'border-l-4 border-l-[#36624B]',
                },
                {
                  title: 'Compound vs Simple Interest (2-Yr Difference)',
                  subject: 'Quantitative Aptitude',
                  tag: 'CPO Speed',
                  ref: 'Formula D = P(R/100)²',
                  color: 'border-l-4 border-l-[#D97746]',
                },
                {
                  title: '1919 vs 1935 Government of India Acts',
                  subject: 'Modern History',
                  tag: 'Shared Core',
                  ref: 'Spectrum Ch. 16 & 23',
                  color: 'border-l-4 border-l-[#8C7837]',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={() => {
                    onSelectTopicForAi(item.title, item.subject, item.ref);
                    onNavigate('AI_TUTOR');
                  }}
                  className={`bg-[#FFFFFF] dark:bg-[#121816] p-3 rounded-lg border border-[#E2E6DD] dark:border-slate-800 ${item.color} hover:bg-[#F2F4F0] dark:hover:bg-[#1A2420] cursor-pointer transition-all flex items-center justify-between group`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#EEF0EA] dark:bg-slate-800 text-[#5C646B] dark:text-slate-300">
                        {item.tag}
                      </span>
                      <span className="text-[11px] text-[#5C646B] dark:text-slate-400 truncate">
                        {item.ref}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-[#1E252B] dark:text-white mt-1 truncate">
                      {item.title}
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-[#36624B] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Mistake Vault & Spaced Repetition (SRS) Status */}
        <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl p-6 border border-[#E2E6DD] dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FBEAE8] text-[#C25345] flex items-center justify-center">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E252B] dark:text-white">
                    Mistake Vault & SRS
                  </h3>
                  <span className="text-[11px] text-[#5C646B] dark:text-slate-400">
                    Spaced Repetition Review
                  </span>
                </div>
              </div>
              {dueSrsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#C25345] text-white animate-pulse">
                  {dueSrsCount} Due
                </span>
              )}
            </div>

            <p className="text-xs text-[#5C646B] dark:text-slate-300 leading-relaxed mb-4">
              Every missed question is classified by error taxonomy: <em>Conceptual Gap</em>, <em>Misread Question</em>, or <em>Calculation Panic</em>. Reviews repeat at 1, 3, and 7-day intervals.
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-xs p-2 rounded bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800">
                <span className="text-[#5C646B] dark:text-slate-400">Questions in Vault:</span>
                <span className="font-bold text-[#1E252B] dark:text-white">{mistakes.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 rounded bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800">
                <span className="text-[#5C646B] dark:text-slate-400">Paper 2 Submissions:</span>
                <span className="font-bold text-[#1E252B] dark:text-white">{submissions.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 rounded bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800">
                <span className="text-[#5C646B] dark:text-slate-400">Net Drill Accuracy:</span>
                <span className="font-bold text-[#2E7D5B]">{safeAccuracy}%</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('MISTAKE_VAULT')}
            className="w-full py-2.5 px-4 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open Mistake Vault & SRS</span>
          </button>
        </div>
      </section>
    </div>
  );
};
