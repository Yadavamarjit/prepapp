import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Lightbulb, 
  Zap, 
  ShieldAlert, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Sliders, 
  Gauge, 
  Activity, 
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { SYLLABUS_MODULES } from '../data/syllabusData';
import { Question, MistakeRecord, MistakeReason, AdaptiveAssessment, AdaptiveComplexityLevel, QuestionComplexityTier } from '../types';
import { calculateTopicProficiency, determineAdaptiveAssessment } from '../utils/adaptiveEngine';

interface AiTopicBreakdownProps {
  initialTopic?: string;
  initialSubject?: string;
  initialRef?: string;
  mistakes: MistakeRecord[];
  solvedQuestionIds: string[];
  allQuestions: Question[];
  onSaveMistake: (questionId: string, selected: 'A' | 'B' | 'C' | 'D', reason: MistakeReason, timeSpent: number) => void;
  onAddQuestionsToBank: (newQuestions: Question[]) => void;
}

interface BreakdownData {
  topic: string;
  eli5Summary: string[];
  upscAnalyticalDepth: string;
  cpoSpeedShortcut: string;
  memoryHook: string;
  examinerTrap: string;
  recommendedChapters?: string;
}

export const AiTopicBreakdown: React.FC<AiTopicBreakdownProps> = ({
  initialTopic,
  initialSubject,
  initialRef,
  mistakes,
  solvedQuestionIds,
  allQuestions,
  onSaveMistake,
  onAddQuestionsToBank,
}) => {
  const [selectedTopic, setSelectedTopic] = useState(initialTopic || 'Emergency Provisions (Art 352, 356, 360)');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || 'Polity & Constitution');
  const [standardRef, setStandardRef] = useState(initialRef || 'M. Laxmikanth Ch. 16');
  const [customGap, setCustomGap] = useState('');
  const [examTrackChoice, setExamTrackChoice] = useState<'UPSC_CAPF' | 'SSC_CPO' | 'BOTH'>('BOTH');

  // Question Statement Depth & Calibration Settings Panel state
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(true);
  const [complexityTier, setComplexityTier] = useState<QuestionComplexityTier>('Complex/UPSC');
  const [manualDepth, setManualDepth] = useState<1 | 2 | 3 | 4>(3);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleToggleComplexityTier = (tier: QuestionComplexityTier) => {
    setComplexityTier(tier);
    setIsManualOverride(true);
    if (tier === 'Simple') {
      setManualDepth(1);
    } else if (tier === 'Moderate') {
      setManualDepth(2);
    } else {
      setManualDepth(manualDepth >= 3 ? manualDepth : 3);
    }
  };

  // Breakdown status
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [breakdownData, setBreakdownData] = useState<BreakdownData | null>(null);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  // Dynamic Questions status
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [userDrillAnswers, setUserDrillAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [showDrillSolutions, setShowDrillSolutions] = useState<Record<string, boolean>>({});
  const [loggedMistakes, setLoggedMistakes] = useState<Record<string, MistakeReason>>({});

  // Real-time adaptive proficiency calculation
  const currentProficiency = calculateTopicProficiency(
    selectedTopic,
    mistakes,
    solvedQuestionIds,
    allQuestions
  );

  const autoAssessment = determineAdaptiveAssessment(currentProficiency);

  // Effective assessment factoring in manual override if toggled
  const effectiveAssessment: AdaptiveAssessment = isManualOverride
    ? {
        ...autoAssessment,
        statementDepth: manualDepth,
        complexityTier,
        level:
          complexityTier === 'Simple' || manualDepth === 1
            ? 'Factual Recall'
            : complexityTier === 'Moderate' || manualDepth === 2
            ? 'Foundational'
            : manualDepth === 4
            ? 'Advanced'
            : 'Standard',
        rationale: `Manual calibration active (${complexityTier} tier • ${manualDepth} statement${manualDepth === 1 ? '' : 's'} specified by candidate).`,
      }
    : {
        ...autoAssessment,
        complexityTier: autoAssessment.statementDepth === 1 ? 'Simple' : autoAssessment.statementDepth === 2 ? 'Moderate' : 'Complex/UPSC',
      };

  // Trigger AI breakdown
  const handleFetchBreakdown = async () => {
    if (!selectedTopic) return;
    setIsLoadingBreakdown(true);
    setBreakdownError(null);

    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          subject: selectedSubject,
          standardRef: standardRef,
          examFocus: examTrackChoice === 'BOTH' ? ['CAPF', 'CPO'] : [examTrackChoice === 'UPSC_CAPF' ? 'CAPF' : 'CPO'],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to break down topic');
      }

      setBreakdownData(data.data);
    } catch (err: any) {
      setBreakdownError(err.message || 'Error communicating with AI tutor.');
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  // Trigger Dynamic Practice Question Generation based on Learning Gap & Adaptive Depth
  const handleGenerateQuestions = async () => {
    if (!selectedTopic) return;
    setIsGeneratingQuestions(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          subject: selectedSubject,
          examTrack: examTrackChoice === 'BOTH' ? 'UPSC_CAPF' : examTrackChoice,
          specificGap: customGap || effectiveAssessment.identifiedGap,
          count: questionCount,
          complexityTier: complexityTier,
          statementDepth: manualDepth,
          adaptiveAssessment: effectiveAssessment,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate practice questions');
      }

      setGeneratedQuestions(data.questions);
      onAddQuestionsToBank(data.questions);
      setUserDrillAnswers({});
      setShowDrillSolutions({});
    } catch (err: any) {
      setGenerationError(err.message || 'Question generation failed');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleSelectDrillOption = (qId: string, key: 'A' | 'B' | 'C' | 'D') => {
    setUserDrillAnswers((prev) => ({ ...prev, [qId]: key }));
  };

  const handleVerifyDrillQuestion = (q: Question) => {
    setShowDrillSolutions((prev) => ({ ...prev, [q.id]: true }));
    const chosen = userDrillAnswers[q.id];
    const isCorrect = chosen === q.correctAnswer;
    
    // Automatically record to profile
    if (!isCorrect && chosen) {
      onSaveMistake(q.id, chosen, 'Conceptual Gap', 55);
    }
  };

  const handleLogDrillMistake = (q: Question, reason: MistakeReason) => {
    const selected = userDrillAnswers[q.id];
    if (!selected) return;
    onSaveMistake(q.id, selected, reason, 50);
    setLoggedMistakes((prev) => ({ ...prev, [q.id]: reason }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-6 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#36624B] text-white flex items-center justify-center font-bold shadow-sm shadow-[#36624B]/30">
            <Sparkles className="w-6 h-6 text-[#E3EFE8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-[#1E252B] dark:text-white font-sans">
                Personal AI Syllabus Tutor
              </h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#E3EFE8] text-[#36624B] dark:bg-[#1A2E24] dark:text-[#88D4A8]">
                Adaptive Question Engine
              </span>
            </div>
            <p className="text-xs text-[#5C646B] dark:text-slate-400 mt-0.5">
              Continuously monitors your accuracy and error taxonomy to dynamically calibrate question complexity and statement depth.
            </p>
          </div>
        </div>

        {/* Real-time Adaptive Status Pill */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800 text-xs">
          <Activity className="w-4 h-4 text-[#36624B]" />
          <div>
            <span className="text-[#5C646B] text-[10px] block uppercase font-bold tracking-wider">
              Adaptive Calibration
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-[#1E252B] dark:text-white">
              <span className={`w-2 h-2 rounded-full ${
                effectiveAssessment.level === 'Advanced'
                  ? 'bg-[#8C7837]'
                  : effectiveAssessment.level === 'Foundational'
                  ? 'bg-[#C25345]'
                  : 'bg-[#2F7C7E]'
              }`} />
              <span>{effectiveAssessment.level} ({effectiveAssessment.statementDepth} Statements)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Adaptive Algorithm HUD: Performance Monitoring & Depth Controller */}
      <div className="bg-gradient-to-br from-[#FFFFFF] to-[#F2F4F0] dark:from-[#1A2420] dark:to-[#121816] rounded-xl p-5 border border-[#36624B]/25 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E6DD] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#36624B]" />
            <h3 className="font-bold text-sm text-[#1E252B] dark:text-white">
              Adaptive Learning Gap & Statement Depth Monitor
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#5C646B]">Mode:</span>
            <button
              onClick={() => setIsManualOverride(!isManualOverride)}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-all flex items-center gap-1.5 ${
                !isManualOverride
                  ? 'bg-[#36624B] text-white border-[#36624B]'
                  : 'bg-[#FFFFFF] dark:bg-[#121816] text-[#5C646B] border-[#E2E6DD]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{!isManualOverride ? 'Auto-Adaptive (AI Tuned)' : 'Manual Override'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Diagnostics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Tile 1: Accuracy & Recent Trend */}
          <div className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-[#5C646B] tracking-wider block">
              Topic Mastery Trend
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-bold font-mono ${
                currentProficiency.accuracyRate >= 70
                  ? 'text-[#2E7D5B]'
                  : currentProficiency.accuracyRate >= 50
                  ? 'text-[#8C7837]'
                  : 'text-[#C25345]'
              }`}>
                {currentProficiency.accuracyRate}%
              </span>
              <span className="text-[11px] text-[#5C646B]">
                ({currentProficiency.correctCount}/{currentProficiency.totalAttempts} correct)
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#5C646B]">
              {currentProficiency.consecutiveCorrect > 0 && (
                <span className="text-[#2E7D5B] font-semibold">
                  🔥 {currentProficiency.consecutiveCorrect} streak correct
                </span>
              )}
              {currentProficiency.consecutiveIncorrect > 0 && (
                <span className="text-[#C25345] font-semibold">
                  ⚠️ {currentProficiency.consecutiveIncorrect} repeat mistakes
                </span>
              )}
              {currentProficiency.consecutiveCorrect === 0 && currentProficiency.consecutiveIncorrect === 0 && (
                <span>Baseline evaluation</span>
              )}
            </div>
          </div>

          {/* Tile 2: Statement Depth Tuning */}
          <div className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#5C646B] tracking-wider">
                Statement Depth
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isManualOverride 
                  ? 'bg-[#36624B] text-white' 
                  : 'bg-[#E3EFE8] text-[#36624B]'
              }`}>
                {complexityTier} ({manualDepth} Stmt{manualDepth > 1 ? 's' : ''})
              </span>
            </div>
            
            {/* Visual statement depth bar - 4 depth options */}
            <div className="mt-2 grid grid-cols-4 gap-1 text-center">
              {([1, 2, 3, 4] as const).map((depth) => {
                const isActive = manualDepth === depth;
                return (
                  <button
                    key={depth}
                    type="button"
                    onClick={() => {
                      setIsManualOverride(true);
                      setManualDepth(depth);
                      if (depth === 1) setComplexityTier('Simple');
                      else if (depth === 2) setComplexityTier('Moderate');
                      else setComplexityTier('Complex/UPSC');
                    }}
                    title={
                      depth === 1
                        ? 'Simple: 1-Statement direct factual recall'
                        : depth === 2
                        ? 'Moderate: 2-Statement binary contrast'
                        : depth === 3
                        ? 'Complex/UPSC: 3-Statement standard elimination'
                        : 'Complex/UPSC: 4-Statement advanced analysis'
                    }
                    className={`py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#36624B] text-white border-[#36624B] shadow-xs'
                        : 'bg-[#F7F8F5] dark:bg-slate-900 text-[#5C646B] border-[#EEF0EA] hover:border-[#36624B]'
                    }`}
                  >
                    {depth} Stmt{depth > 1 ? 's' : ''}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 text-[10px] text-[#5C646B] truncate">
              {manualDepth === 1 && 'Simple: Direct factual CBT recall'}
              {manualDepth === 2 && 'Moderate: Binary contrast (1 & 2)'}
              {manualDepth === 3 && 'Complex/UPSC: Elimination (1, 2, 3)'}
              {manualDepth === 4 && 'Complex/UPSC: Analysis (1, 2, 3, 4)'}
            </div>
          </div>

          {/* Tile 3: Diagnosed Learning Gap */}
          <div className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-[#5C646B] tracking-wider block">
              Diagnosed Learning Gap
            </span>
            <div className="mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FBEAE8] text-[#C25345] inline-block truncate max-w-full">
                {currentProficiency.dominantGap !== 'None' ? currentProficiency.dominantGap : 'Balanced Recall'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#5C646B] leading-tight line-clamp-2">
              {effectiveAssessment.identifiedGap}
            </p>
          </div>

          {/* Tile 4: Targeted Trap Strategy */}
          <div className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-[#5C646B] tracking-wider block">
              Targeted Trap Directive
            </span>
            <div className="mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#E3EFE8] text-[#36624B] inline-block">
                {effectiveAssessment.trapTypeToInject}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-[#5C646B] leading-tight">
              {effectiveAssessment.trapTypeToInject === 'Subtle Qualifier' && 'Tests precision against "only", "all", "exclusive" tricks.'}
              {effectiveAssessment.trapTypeToInject === 'Conceptual Contrast' && 'Sharp contrast between easily conflated articles/provisions.'}
              {effectiveAssessment.trapTypeToInject === 'Pacing & Elimination' && 'Multi-statement elimination requiring 2-stage deductive reduction.'}
              {effectiveAssessment.trapTypeToInject === 'None' && 'Standard conceptual verification.'}
            </p>
          </div>
        </div>

        {/* Algorithm Rationale Banner */}
        <div className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#121816] border border-[#36624B]/20 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#36624B] flex-shrink-0 mt-0.5" />
          <div className="text-[#1E252B] dark:text-slate-200">
            <strong className="text-[#36624B] dark:text-[#88D4A8]">Adaptive Engine Rationale: </strong>
            {effectiveAssessment.rationale}
          </div>
        </div>
      </div>

      {/* Settings Panel: Question Statement Depth & Calibration */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl border border-[#36624B]/30 shadow-xs overflow-hidden transition-all">
        {/* Settings Panel Header Bar */}
        <div 
          onClick={() => setShowSettingsPanel(!showSettingsPanel)}
          className="p-4 bg-[#FAFBF9] dark:bg-[#151D1A] border-b border-[#E2E6DD] dark:border-slate-800 flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#36624B]/10 text-[#36624B] dark:text-[#88D4A8] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#1E252B] dark:text-white">
                  Question Generation Settings Panel
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#E3EFE8] text-[#36624B] dark:bg-[#1A2E24] dark:text-[#88D4A8] border border-[#36624B]/20">
                  {complexityTier} ({manualDepth} Stmts)
                </span>
              </div>
              <p className="text-[11px] text-[#5C646B] dark:text-slate-400">
                Toggle Question Statement Depth (Simple, Moderate, Complex/UPSC) to calibrate AI prompt complexity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#36624B] dark:text-[#88D4A8] group-hover:underline">
            <span>{showSettingsPanel ? 'Hide Settings' : 'Configure Settings'}</span>
            {showSettingsPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Expanded Settings Controls */}
        {showSettingsPanel && (
          <div className="p-5 space-y-5">
            {/* 1. Primary Statement Depth Toggle: Simple / Moderate / Complex/UPSC */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1E252B] dark:text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#36624B]" />
                  <span>Question Statement Depth:</span>
                </label>
                <span className="text-[11px] text-[#5C646B] dark:text-slate-400">
                  Calibrates prompt structure for Gemini question generator
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Simple */}
                <div
                  onClick={() => handleToggleComplexityTier('Simple')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    complexityTier === 'Simple'
                      ? 'bg-[#E3EFE8]/50 dark:bg-[#162A1F] border-[#36624B] shadow-xs ring-1 ring-[#36624B]'
                      : 'bg-white dark:bg-[#121816] border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#1E252B] dark:text-white flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${complexityTier === 'Simple' ? 'bg-[#36624B]' : 'bg-slate-300'}`} />
                      Simple
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F7F8F5] dark:bg-slate-800 text-[#5C646B] dark:text-slate-300">
                      1 Statement
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#36624B] dark:text-[#88D4A8] mb-1">
                    Direct Factual Recall & CBT Speed
                  </div>
                  <p className="text-[11px] text-[#5C646B] dark:text-slate-400 leading-relaxed">
                    Single direct objective question without numbered statements. Tests exact constitutional articles, numbers, years, and speed formulas (&lt;30s).
                  </p>
                </div>

                {/* Moderate */}
                <div
                  onClick={() => handleToggleComplexityTier('Moderate')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    complexityTier === 'Moderate'
                      ? 'bg-[#E3EFE8]/50 dark:bg-[#162A1F] border-[#36624B] shadow-xs ring-1 ring-[#36624B]'
                      : 'bg-white dark:bg-[#121816] border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#1E252B] dark:text-white flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${complexityTier === 'Moderate' ? 'bg-[#2F7C7E]' : 'bg-slate-300'}`} />
                      Moderate
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F7F8F5] dark:bg-slate-800 text-[#5C646B] dark:text-slate-300">
                      2 Statements
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#2F7C7E] dark:text-[#88D4A8] mb-1">
                    Binary Contrast & Core Concepts
                  </div>
                  <p className="text-[11px] text-[#5C646B] dark:text-slate-400 leading-relaxed">
                    Two contrasting numbered statements (1 and 2) with "1 only", "2 only", "Both 1 and 2", and "Neither". Eliminates binary confusion between related concepts.
                  </p>
                </div>

                {/* Complex/UPSC */}
                <div
                  onClick={() => handleToggleComplexityTier('Complex/UPSC')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    complexityTier === 'Complex/UPSC'
                      ? 'bg-[#E3EFE8]/50 dark:bg-[#162A1F] border-[#36624B] shadow-xs ring-1 ring-[#36624B]'
                      : 'bg-white dark:bg-[#121816] border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#1E252B] dark:text-white flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${complexityTier === 'Complex/UPSC' ? 'bg-[#D97746]' : 'bg-slate-300'}`} />
                      Complex/UPSC
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F7F8F5] dark:bg-slate-800 text-[#5C646B] dark:text-slate-300">
                      3–4 Statements
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#D97746] mb-1">
                    Multi-Layered Analytical Elimination
                  </div>
                  <p className="text-[11px] text-[#5C646B] dark:text-slate-400 leading-relaxed">
                    Canonical UPSC CAPF Paper 1 multi-statement question with subtle qualifiers ("only", "exclusive"), constitutional exceptions, and deductive elimination options.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Sub-Parameters (Exact Statement Count & Question Count) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-[#E2E6DD] dark:border-slate-800">
              {/* Exact Statement Count */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 block mb-1.5">
                  Exact Statement Count:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {([1, 2, 3, 4] as const).map((d) => {
                    const isSelected = manualDepth === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setManualDepth(d);
                          setIsManualOverride(true);
                          if (d === 1) setComplexityTier('Simple');
                          else if (d === 2) setComplexityTier('Moderate');
                          else setComplexityTier('Complex/UPSC');
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#36624B] text-white border-[#36624B] shadow-2xs'
                            : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#5C646B] border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]'
                        }`}
                      >
                        {d} Stmt{d > 1 ? 's' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 block mb-1.5">
                  Practice Questions to Generate:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-[#36624B] text-white border-[#36624B] shadow-2xs'
                          : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#5C646B] border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]'
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Parameter Monospace Preview */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 block mb-1.5">
                  Dispatched AI Prompt Directive:
                </label>
                <div className="p-2.5 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#E2E6DD] dark:border-slate-800 font-mono text-[10px] text-[#36624B] dark:text-[#88D4A8] space-y-0.5 leading-snug">
                  <div>complexityTier: "{complexityTier}"</div>
                  <div>statementDepth: {manualDepth} statements</div>
                  <div>count: {questionCount} | mode: {examTrackChoice}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Topic Selector & Gap Configuration */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-6 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Pick Module from Syllabus */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 block mb-1.5">
              Subject Category:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                const sub = e.target.value;
                setSelectedSubject(sub);
                const foundModule = SYLLABUS_MODULES.find((m) => m.subject === sub);
                if (foundModule && foundModule.subtopics.length > 0) {
                  setSelectedTopic(foundModule.subtopics[0].title);
                  setStandardRef(foundModule.subtopics[0].standardRef);
                }
              }}
              className="w-full text-xs font-medium p-2.5 rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#36624B]"
            >
              {SYLLABUS_MODULES.map((m) => (
                <option key={m.id} value={m.subject}>
                  {m.subject} {m.isSharedCore ? '(Shared Core)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Pick Subtopic */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 block mb-1.5">
              Syllabus Sub-Topic:
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTopic(val);
                const currentModule = SYLLABUS_MODULES.find((m) => m.subject === selectedSubject);
                const foundSub = currentModule?.subtopics.find((s) => s.title === val);
                if (foundSub) {
                  setStandardRef(foundSub.standardRef);
                }
              }}
              className="w-full text-xs font-medium p-2.5 rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#36624B]"
            >
              {SYLLABUS_MODULES.find((m) => m.subject === selectedSubject)?.subtopics.map((s) => (
                <option key={s.id} value={s.title}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Target Exam Focus */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 block mb-1.5">
              Dual Target Strategy:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['BOTH', 'UPSC_CAPF', 'SSC_CPO'] as const).map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => setExamTrackChoice(track)}
                  className={`text-xs py-2 rounded-lg font-semibold border transition-all ${
                    examTrackChoice === track
                      ? 'bg-[#36624B] text-white border-[#36624B]'
                      : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#5C646B] border-[#E2E6DD] hover:bg-[#EEF0EA]'
                  }`}
                >
                  {track === 'BOTH' ? 'Dual Mode' : track === 'UPSC_CAPF' ? 'CAPF P1/P2' : 'CPO Speed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Learning Gap Input */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 block mb-1.5">
            Personal Learning Gap / Specific Doubts (Auto-populated from monitor):
          </label>
          <input
            type="text"
            value={customGap}
            onChange={(e) => setCustomGap(e.target.value)}
            placeholder={`Auto-target: "${effectiveAssessment.identifiedGap}"`}
            className="w-full text-xs p-2.5 rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#36624B]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-[#5C646B] dark:text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#2F7C7E]" />
            Reference: <strong>{standardRef}</strong>
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFetchBreakdown}
              disabled={isLoadingBreakdown}
              className="px-5 py-2.5 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#E3EFE8]" />
              <span>{isLoadingBreakdown ? 'Analyzing Topic...' : 'Teach Me This Topic (Easy Mode)'}</span>
            </button>
          </div>
        </div>

        {breakdownError && (
          <div className="p-3 rounded-lg bg-[#FBEAE8] text-[#C25345] text-xs">
            {breakdownError}
          </div>
        )}
      </div>

      {/* AI Breakdown Presentation Card */}
      {breakdownData && (
        <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl border border-[#36624B]/30 p-6 shadow-sm space-y-6 animate-fade-in">
          
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#EEF0EA] dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#36624B] bg-[#E3EFE8] px-2 py-0.5 rounded">
                Conceptual Master Breakdown
              </span>
              <h3 className="font-bold text-lg text-[#1E252B] dark:text-white mt-1">
                {breakdownData.topic}
              </h3>
            </div>
            {breakdownData.recommendedChapters && (
              <span className="text-xs font-mono text-[#2F7C7E] bg-[#2F7C7E]/10 px-2.5 py-1 rounded-full">
                {breakdownData.recommendedChapters}
              </span>
            )}
          </div>

          {/* 1. Core Concept in 3 Bullets (ELI5 / High Intuition) */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#36624B] flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#36624B]" />
              1. Core Intuition in 3 Clear Bullets:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {breakdownData.eli5Summary.map((bullet, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800 text-xs text-[#1E252B] dark:text-slate-200 leading-relaxed font-sans">
                  <span className="font-bold text-[#36624B] mr-1.5">#{idx + 1}</span>
                  {bullet}
                </div>
              ))}
            </div>
          </div>

          {/* 2. UPSC Analytical Depth & 3. CPO Speed Shortcut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* UPSC Depth */}
            <div className="p-4 rounded-xl bg-[#F7F8F5] dark:bg-[#121816] border border-[#2F7C7E]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2F7C7E]">
                <Layers className="w-4 h-4" />
                <span>UPSC CAPF Analytical Angle (Paper 1 & 2):</span>
              </div>
              <p className="text-xs text-[#1E252B] dark:text-slate-200 leading-relaxed font-sans">
                {breakdownData.upscAnalyticalDepth}
              </p>
            </div>

            {/* CPO Speed Shortcut */}
            <div className="p-4 rounded-xl bg-[#F7F8F5] dark:bg-[#121816] border border-[#D97746]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D97746]">
                <Zap className="w-4 h-4" />
                <span>SSC CPO Speed Formula / Mental Shortcut:</span>
              </div>
              <p className="text-xs text-[#1E252B] dark:text-slate-200 leading-relaxed font-sans">
                {breakdownData.cpoSpeedShortcut}
              </p>
            </div>
          </div>

          {/* 4. Memory Hook & 5. Examiner Trap Alert */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Memory Mnemonic */}
            <div className="p-4 rounded-xl bg-[#E6F4EA]/60 dark:bg-[#1A2E24] border border-[#2E7D5B]/30 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B] flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                <span>High-Yield Memory Hook / Mnemonic:</span>
              </div>
              <p className="text-xs text-[#1E252B] dark:text-slate-200 font-semibold leading-relaxed">
                {breakdownData.memoryHook}
              </p>
            </div>

            {/* Examiner Trap Alert */}
            <div className="p-4 rounded-xl bg-[#FBEAE8]/60 dark:bg-[#2E1815] border border-[#C25345]/30 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C25345] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Classic Examiner Negative-Marking Trap:</span>
              </div>
              <p className="text-xs text-[#1E252B] dark:text-slate-200 leading-relaxed">
                {breakdownData.examinerTrap}
              </p>
            </div>
          </div>

          {/* Adaptive Question Generation Trigger Box */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-[#E3EFE8]/50 to-[#F2F4F0] dark:from-[#1A2E24] dark:to-[#121816] border border-[#36624B]/30 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#36624B]/15">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[#1E252B] dark:text-white">
                    Generate Practice Questions (Calibrated to Current Gap)
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isManualOverride ? 'bg-[#36624B] text-white' : 'bg-[#E3EFE8] text-[#36624B]'
                  }`}>
                    {complexityTier} ({manualDepth} Statement{manualDepth > 1 ? 's' : ''})
                  </span>
                </div>
                <p className="text-xs text-[#5C646B] dark:text-slate-300 mt-1">
                  Engine will generate questions specifically addressing: <span className="font-semibold text-[#1E252B] dark:text-white">"{effectiveAssessment.identifiedGap}"</span>
                </p>
              </div>

              <button
                onClick={handleGenerateQuestions}
                disabled={isGeneratingQuestions}
                className="px-5 py-2.5 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold shadow-sm flex items-center gap-2 whitespace-nowrap transition-all disabled:opacity-50 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-[#D97746]" />
                <span>
                  {isGeneratingQuestions
                    ? 'Calibrating Questions...'
                    : `Generate ${complexityTier} (${manualDepth}-Stmt) Drill`}
                </span>
              </button>
            </div>

            {generationError && (
              <div className="p-3 rounded-lg bg-[#FBEAE8] text-[#C25345] text-xs flex items-center justify-between">
                <span>{generationError}</span>
                <button onClick={() => setGenerationError(null)} className="text-[10px] underline cursor-pointer">
                  Dismiss
                </button>
              </div>
            )}

            {/* Statement Depth Configuration UI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400">
                  Select Question Statement Depth:
                </span>
                <span className="text-[10px] text-[#5C646B] dark:text-slate-400">
                  {manualDepth === 1 && 'Simple: Single-statement direct factual recall (CBT objective format)'}
                  {manualDepth === 2 && 'Moderate: 2-statement binary contrast & core concept reinforcement'}
                  {manualDepth === 3 && 'Complex/UPSC: 3-statement canonical UPSC CAPF elimination'}
                  {manualDepth === 4 && 'Complex/UPSC: 4-statement complex multi-layered constitutional analysis'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { depth: 1, tier: 'Simple' as QuestionComplexityTier, label: 'Simple (1 Stmt)', desc: 'Direct CBT Recall' },
                  { depth: 2, tier: 'Moderate' as QuestionComplexityTier, label: 'Moderate (2 Stmts)', desc: 'Binary Contrast' },
                  { depth: 3, tier: 'Complex/UPSC' as QuestionComplexityTier, label: 'Complex/UPSC (3 Stmts)', desc: 'Standard Elimination' },
                  { depth: 4, tier: 'Complex/UPSC' as QuestionComplexityTier, label: 'Complex/UPSC (4 Stmts)', desc: 'Deep Multi-Layer' },
                ].map(({ depth, tier, label, desc }) => {
                  const isActive = manualDepth === depth;
                  return (
                    <button
                      key={depth}
                      type="button"
                      onClick={() => {
                        setIsManualOverride(true);
                        setManualDepth(depth as 1 | 2 | 3 | 4);
                        setComplexityTier(tier);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#36624B] text-white border-[#36624B] shadow-sm'
                          : 'bg-[#FFFFFF] dark:bg-[#121816] text-[#1E252B] dark:text-slate-200 border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{label}</div>
                      <div className={`text-[10px] mt-0.5 ${isActive ? 'text-[#E3EFE8]' : 'text-[#5C646B] dark:text-slate-400'}`}>
                        {desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Practice Questions Interactive Drill */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D97746]" />
              <h3 className="font-bold text-base text-[#1E252B] dark:text-white">
                Adaptively Calibrated Drill ({effectiveAssessment.statementDepth === 1 ? '1 Statement (Factual Recall)' : `${effectiveAssessment.statementDepth} Statements`} &bull; Level: {effectiveAssessment.level})
              </h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#E3EFE8] text-[#36624B] font-semibold">
              Tuned to: {effectiveAssessment.identifiedGap.slice(0, 45)}...
            </span>
          </div>

          {generatedQuestions.map((q, qIndex) => {
            const userChoice = userDrillAnswers[q.id];
            const isVerified = showDrillSolutions[q.id];
            const isCorrect = isVerified && userChoice === q.correctAnswer;
            const isIncorrect = isVerified && userChoice && !isCorrect;

            return (
              <div 
                key={q.id}
                className="bg-[#FFFFFF] dark:bg-[#1A2420] p-6 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between text-xs pb-3 border-b border-[#EEF0EA] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#36624B] bg-[#E3EFE8] px-2 py-0.5 rounded">
                      Adaptive Q{qIndex + 1}
                    </span>
                    <span className="font-semibold text-[#1E252B] dark:text-white">{q.subject}</span>
                    <span className="text-[#5C646B]">
                      &bull; {q.statements && q.statements.length > 0 ? `${q.statements.length} Statements` : '1 Statement (Factual Recall)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EEF0EA] text-[#5C646B]">
                    {q.yearRef || `Complexity: ${effectiveAssessment.level}`}
                  </span>
                </div>

                {/* Question Text */}
                <p className="text-sm font-medium font-serif leading-relaxed text-[#1E252B] dark:text-white">
                  {q.questionText}
                </p>

                {/* Statements for UPSC */}
                {q.statements && q.statements.length > 0 && (
                  <div className="space-y-1.5 pl-4 border-l-2 border-[#36624B]/30 my-3 bg-[#F7F8F5] dark:bg-[#121816] p-3 rounded-r-lg">
                    {q.statements.map((s, idx) => (
                      <div key={idx} className="text-xs text-[#1E252B] dark:text-slate-200">
                        <strong className="text-[#36624B] mr-2">{idx + 1}.</strong>
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt) => {
                    const isSelected = userChoice === opt.key;
                    const optIsCorrect = isVerified && q.correctAnswer === opt.key;
                    const optIsIncorrect = isVerified && isSelected && !optIsCorrect;

                    let cls = 'border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/40 bg-[#FFFFFF] dark:bg-[#121816]';
                    if (isSelected && !isVerified) {
                      cls = 'border-[#36624B] bg-[#E3EFE8]/40 ring-1 ring-[#36624B]';
                    } else if (optIsCorrect) {
                      cls = 'border-[#2E7D5B] bg-[#E6F4EA] text-[#2E7D5B] font-semibold';
                    } else if (optIsIncorrect) {
                      cls = 'border-[#C25345] bg-[#FBEAE8] text-[#C25345] font-semibold';
                    }

                    return (
                      <div
                        key={opt.key}
                        onClick={() => !isVerified && handleSelectDrillOption(q.id, opt.key)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${cls}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold w-5 h-5 rounded flex items-center justify-center bg-[#EEF0EA] dark:bg-slate-800">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {optIsCorrect && <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />}
                        {optIsIncorrect && <XCircle className="w-4 h-4 text-[#C25345]" />}
                      </div>
                    );
                  })}
                </div>

                {/* Verification Trigger */}
                <div className="flex items-center justify-between pt-2">
                  {!isVerified ? (
                    <button
                      onClick={() => handleVerifyDrillQuestion(q)}
                      disabled={!userChoice}
                      className="px-4 py-1.5 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold disabled:opacity-40 transition-all"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <div className="text-xs font-bold">
                      {isCorrect ? (
                        <span className="text-[#2E7D5B] flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Correct! Adaptive engine advancing proficiency metrics.
                        </span>
                      ) : (
                        <span className="text-[#C25345] flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Incorrect. Logged to Mistake Vault for adaptive recalibration.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {isVerified && (
                  <div className="p-4 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] space-y-2 text-xs">
                    <p>
                      <strong className="text-[#36624B]">Explanation: </strong>
                      {q.explanation.coreConcept}
                    </p>
                    {q.explanation.shortcutOrTrick && (
                      <p className="text-[#2F7C7E]">
                        <strong>Elimination Strategy: </strong>
                        {q.explanation.shortcutOrTrick}
                      </p>
                    )}
                    {q.explanation.trapAlert && (
                      <p className="text-[#C25345]">
                        <strong>Targeted Trap Breakdown: </strong>
                        {q.explanation.trapAlert}
                      </p>
                    )}

                    {/* Log to Mistake Vault if wrong */}
                    {!isCorrect && userChoice && (
                      <div className="pt-2 border-t border-[#EEF0EA] dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-[#5C646B] block mb-1.5">
                          Specify reason to tune future adaptive generation:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(['Conceptual Gap', 'Misread Question', 'Calculation/Time Panic'] as MistakeReason[]).map((r) => {
                            const isSaved = loggedMistakes[q.id] === r;
                            return (
                              <button
                                key={r}
                                onClick={() => handleLogDrillMistake(q, r)}
                                className={`text-[11px] px-2.5 py-1 rounded border transition-all ${
                                  isSaved
                                    ? 'bg-[#36624B] text-white border-[#36624B]'
                                    : 'bg-white text-[#5C646B] border-[#E2E6DD]'
                                }`}
                              >
                                {isSaved ? `Recorded: ${r}` : r}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
