import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Zap,
  CheckSquare,
  PenTool,
  Clock,
  Sparkles,
  Flame,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  ChevronRight,
  RotateCcw,
  Target,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { NavTab } from './Navbar';
import { Question, MistakeRecord, Paper2Submission, SyllabusModule } from '../types';
import { SYLLABUS_MODULES } from '../data/syllabusData';
import { 
  calculateExamReadiness, 
  calculateSubjectAnalytics, 
  calculateTopicAnalytics, 
  calculateStudyAchievements,
  SubjectMetric,
  TopicMetric
} from '../utils/analyticsEngine';

interface AnalyticsPanelProps {
  questions: Question[];
  mistakes: MistakeRecord[];
  submissions: Paper2Submission[];
  solvedQuestionIds: string[];
  onNavigate: (tab: NavTab) => void;
  onSelectTopicForAi: (topicTitle: string, subject: string, standardRef: string) => void;
  streakDays?: number;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  questions,
  mistakes,
  submissions,
  solvedQuestionIds,
  onNavigate,
  onSelectTopicForAi,
  streakDays = 4,
}) => {
  // Filters & State
  const [selectedSection, setSelectedSection] = useState<'ALL' | 'SHARED' | 'CPO' | 'CAPF'>('ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicDetail, setSelectedTopicDetail] = useState<TopicMetric | null>(null);

  // Compute analytics
  const readiness = useMemo(
    () => calculateExamReadiness(questions, mistakes, submissions, solvedQuestionIds),
    [questions, mistakes, submissions, solvedQuestionIds]
  );

  const subjectMetrics = useMemo(
    () => calculateSubjectAnalytics(SYLLABUS_MODULES, questions, mistakes, solvedQuestionIds),
    [questions, mistakes, solvedQuestionIds]
  );

  const topicMetrics = useMemo(
    () => calculateTopicAnalytics(SYLLABUS_MODULES, questions, mistakes, solvedQuestionIds),
    [questions, mistakes, solvedQuestionIds]
  );

  const achievements = useMemo(
    () => calculateStudyAchievements(solvedQuestionIds.length, mistakes, submissions, streakDays),
    [solvedQuestionIds.length, mistakes, submissions, streakDays]
  );

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return topicMetrics.filter(topic => {
      // Section filter
      if (selectedSection === 'SHARED' && !topic.isShared) return false;
      if (selectedSection === 'CPO' && !topic.examFocus.includes('CPO')) return false;
      if (selectedSection === 'CAPF' && !topic.examFocus.includes('CAPF')) return false;

      // Subject filter
      if (selectedSubjectFilter !== 'ALL' && topic.subject !== selectedSubjectFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = topic.title.toLowerCase().includes(query);
        const matchesSubject = topic.subject.toLowerCase().includes(query);
        const matchesRef = topic.standardRef.toLowerCase().includes(query);
        const matchesConcept = topic.keyConcepts.some(c => c.toLowerCase().includes(query));
        if (!matchesTitle && !matchesSubject && !matchesRef && !matchesConcept) return false;
      }

      return true;
    });
  }, [topicMetrics, selectedSection, selectedSubjectFilter, searchQuery]);

  // Overall counts
  const totalMasteredTopics = topicMetrics.filter(t => t.status === 'Mastered').length;
  const totalProficientTopics = topicMetrics.filter(t => t.status === 'Proficient').length;
  const totalTopics = topicMetrics.length;

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. Motivational Hero Mission Control & Dual Readiness */}
      <section className="bg-gradient-to-br from-[#FFFFFF] via-[#F7F8F5] to-[#E3EFE8]/40 dark:from-[#1A2420] dark:via-[#151D1A] dark:to-[#121816] rounded-2xl p-6 sm:p-8 border border-[#36624B]/20 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#36624B]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-[#D97746]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3EFE8] dark:bg-[#1A2E24] text-[#36624B] dark:text-[#88D4A8] text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-[#36624B]" />
              <span>Aspirant Command Center &bull; Live Readiness Matrix</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E252B] dark:text-white font-sans">
              "Victory Belongs to the Relentless."
            </h1>

            <p className="text-sm text-[#5C646B] dark:text-slate-300 leading-relaxed font-sans">
              Every solved MCQ reinforces your elimination muscle. Every timed Paper 2 essay forges administrative conviction. Track your dual-exam trajectory across <strong className="text-[#36624B] dark:text-[#88D4A8]">6 Core Subjects</strong> and <strong className="text-[#D97746]">{totalTopics} High-Yield Subtopics</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#1E252B] dark:text-slate-200">
                <Flame className="w-4 h-4 text-[#D97746]" />
                <span>{streakDays}-Day Discipline Streak</span>
              </div>
              <span className="text-[#A0A6AB]">&bull;</span>
              <div className="flex items-center gap-1.5 font-semibold text-[#1E252B] dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                <span>{totalMasteredTopics + totalProficientTopics}/{totalTopics} Topics Active</span>
              </div>
              <span className="text-[#A0A6AB]">&bull;</span>
              <div className="flex items-center gap-1.5 font-semibold text-[#1E252B] dark:text-slate-200">
                <Clock className="w-4 h-4 text-[#2F7C7E]" />
                <span>~{readiness.studyHoursEstimated} hrs Dedicated Practice</span>
              </div>
            </div>
          </div>

          {/* Dual Readiness Gauge Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[320px] lg:min-w-[360px]">
            {/* CAPF Gauge */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121816] border border-[#36624B]/30 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#36624B] dark:text-[#88D4A8] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  UPSC CAPF AC
                </span>
                <span className="font-mono font-bold text-sm text-[#36624B] dark:text-[#88D4A8]">
                  {readiness.capfScore}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EEF0EA] dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-[#36624B] transition-all duration-500 rounded-full"
                  style={{ width: `${readiness.capfScore}%` }}
                />
              </div>
              <div className="text-[11px] font-semibold text-[#1E252B] dark:text-white truncate">
                {readiness.capfLabel}
              </div>
              <div className="text-[10px] text-[#5C646B] dark:text-slate-400">
                P1 Elimination + P2 Argument Scaffolding
              </div>
            </div>

            {/* CPO Gauge */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121816] border border-[#D97746]/30 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#D97746] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  SSC CPO (CBT)
                </span>
                <span className="font-mono font-bold text-sm text-[#D97746]">
                  {readiness.cpoScore}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EEF0EA] dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-[#D97746] transition-all duration-500 rounded-full"
                  style={{ width: `${readiness.cpoScore}%` }}
                />
              </div>
              <div className="text-[11px] font-semibold text-[#1E252B] dark:text-white truncate">
                {readiness.cpoLabel}
              </div>
              <div className="text-[10px] text-[#5C646B] dark:text-slate-400">
                15m Sectional Gates &bull; &lt;45s Speed Threshold
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Motivational Study Drivers: "Next Best Study Move" & Weekly Study Target */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Best Action Card */}
        <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl p-6 border border-[#36624B]/30 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#36624B] text-white flex items-center justify-center font-bold">
                  <Target className="w-4 h-4 text-[#E3EFE8]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#36624B] dark:text-[#88D4A8]">
                    AI Study Recommendation
                  </span>
                  <h3 className="font-bold text-base text-[#1E252B] dark:text-white">
                    Next High-Yield Study Move
                  </h3>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E3EFE8] text-[#36624B] dark:bg-[#1A2E24] dark:text-[#88D4A8] border border-[#36624B]/20">
                {readiness.recommendedAction.impactLabel}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800 mt-2 space-y-1">
              <h4 className="font-bold text-sm text-[#1E252B] dark:text-white flex items-center gap-2">
                <span>{readiness.recommendedAction.title}</span>
              </h4>
              <p className="text-xs text-[#5C646B] dark:text-slate-300 leading-relaxed font-sans">
                {readiness.recommendedAction.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EEF0EA] dark:border-slate-800">
            <span className="text-xs text-[#5C646B] dark:text-slate-400">
              Estimated boost: Closes diagnosed gaps & advances exam benchmark
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('LEARNING')}
                className="px-3.5 py-2 rounded-lg border border-[#36624B]/30 hover:bg-[#E3EFE8]/50 dark:hover:bg-[#1A2E24] text-[#36624B] dark:text-[#88D4A8] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Read NCERT Chapters</span>
              </button>
              <button
                onClick={() => {
                  if (readiness.recommendedAction.topic && readiness.recommendedAction.subject && readiness.recommendedAction.standardRef) {
                    onSelectTopicForAi(
                      readiness.recommendedAction.topic,
                      readiness.recommendedAction.subject,
                      readiness.recommendedAction.standardRef
                    );
                  }
                  onNavigate(readiness.recommendedAction.targetTab);
                }}
                className="px-5 py-2 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer group"
              >
                <span>Execute Study Action</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Study Routine & Consistency Tracker */}
        <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl p-6 border border-[#E2E6DD] dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-[#1E252B] dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2F7C7E]" />
                Weekly Study Milestone
              </h3>
              <span className="text-xs font-mono font-bold text-[#2E7D5B]">
                {readiness.weeklyActualSolved}/{readiness.weeklyTargetSolved} Qs
              </span>
            </div>

            <p className="text-xs text-[#5C646B] dark:text-slate-400 leading-relaxed mb-4">
              Solving 30 high-yield questions weekly builds subconscious elimination instincts.
            </p>

            {/* Target Progress Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs text-[#5C646B] dark:text-slate-400">
                <span>Progress to Goal</span>
                <span className="font-bold text-[#1E252B] dark:text-white">{readiness.targetProgressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#EEF0EA] dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#2F7C7E] to-[#2E7D5B] rounded-full transition-all duration-500"
                  style={{ width: `${readiness.targetProgressPercent}%` }}
                />
              </div>
            </div>

            {/* 14-Day Consistency Mini-Heatmap */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 block mb-2">
                Recent 14-Day Consistency:
              </span>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 14 }).map((_, idx) => {
                  const isActive = idx >= 10; // Recent streak days active
                  return (
                    <div
                      key={idx}
                      title={`Day ${idx + 1}: ${isActive ? 'Active Study Session Logged' : 'Rest Day'}`}
                      className={`h-5 rounded text-[9px] font-mono flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-[#36624B] text-white font-bold'
                          : 'bg-[#EEF0EA] dark:bg-slate-800 text-[#5C646B]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EEF0EA] dark:border-slate-800 flex justify-between items-center text-[11px] text-[#5C646B]">
            <span>Routine: Active</span>
            <span className="text-[#D97746] font-semibold">Keep Flame Burning 🔥</span>
          </div>
        </div>
      </section>

      {/* 3. Subject-Level Performance Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E6DD] dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-[#1E252B] dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#36624B]" />
              Subject Performance & Error Taxonomy
            </h2>
            <p className="text-xs text-[#5C646B] dark:text-slate-400">
              Granular breakdown across all 6 core subjects of the dual CAPF/CPO syllabus.
            </p>
          </div>

          <div className="text-xs text-[#5C646B] dark:text-slate-400 flex items-center gap-2">
            <span>Filter Topic List Below:</span>
            {selectedSubjectFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedSubjectFilter('ALL')}
                className="text-[#36624B] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Reset ({selectedSubjectFilter})</span>
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectMetrics.map(sub => {
            const isFilterActive = selectedSubjectFilter === sub.subjectName;
            return (
              <div
                key={sub.subjectId}
                onClick={() => setSelectedSubjectFilter(isFilterActive ? 'ALL' : sub.subjectName)}
                className={`p-5 rounded-xl border transition-all cursor-pointer bg-white dark:bg-[#1A2420] flex flex-col justify-between ${
                  isFilterActive
                    ? 'border-[#36624B] ring-2 ring-[#36624B]/30 shadow-md'
                    : 'border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/50 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      sub.isSharedCore
                        ? 'bg-[#E3EFE8] text-[#36624B] dark:bg-[#1A2E24] dark:text-[#88D4A8]'
                        : 'bg-[#F2F4F0] text-[#5C646B] dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {sub.isSharedCore ? 'Shared Core' : 'Exam Focus'}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      sub.status === 'Mastered'
                        ? 'bg-[#E6F4EA] text-[#2E7D5B]'
                        : sub.status === 'On Track'
                        ? 'bg-[#E3EFE8] text-[#36624B]'
                        : sub.status === 'Needs Attention'
                        ? 'bg-[#FBEAE8] text-[#C25345]'
                        : 'bg-[#F7F8F5] text-[#5C646B]'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#1E252B] dark:text-white">
                    {sub.subjectName}
                  </h3>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#5C646B] dark:text-slate-400">Mastery Index:</span>
                      <span className="font-bold text-[#1E252B] dark:text-white font-mono">{sub.masteryScore}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EEF0EA] dark:bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.masteryScore >= 75 ? 'bg-[#2E7D5B]' : sub.masteryScore >= 45 ? 'bg-[#36624B]' : 'bg-[#D97746]'
                        }`}
                        style={{ width: `${sub.masteryScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800">
                      <span className="text-[10px] text-[#5C646B] block">Solved / Bank:</span>
                      <span className="font-bold text-[#1E252B] dark:text-white font-mono">
                        {sub.solvedCount} / {sub.totalQuestions}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800">
                      <span className="text-[10px] text-[#5C646B] block">Accuracy:</span>
                      <span className="font-bold text-[#2E7D5B] font-mono">
                        {sub.accuracyRate}%
                      </span>
                    </div>
                  </div>

                  {/* Error Breakdown Badges */}
                  {(sub.conceptualGaps > 0 || sub.misreadCount > 0 || sub.panicCount > 0) && (
                    <div className="mt-3 pt-2 border-t border-[#EEF0EA] dark:border-slate-800 flex flex-wrap gap-1.5 text-[10px]">
                      {sub.conceptualGaps > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-[#FBEAE8] text-[#C25345] font-semibold">
                          {sub.conceptualGaps} Conceptual Gap
                        </span>
                      )}
                      {sub.misreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-[#FEF3D6] text-[#8C7837] font-semibold">
                          {sub.misreadCount} Misread
                        </span>
                      )}
                      {sub.panicCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-[#FBEAE8] text-[#D97746] font-semibold">
                          {sub.panicCount} Time Panic
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#EEF0EA] dark:border-slate-800 flex items-center justify-between text-xs text-[#36624B] font-semibold">
                  <span>{sub.subtopicCount} Subtopics &bull; Click to Filter</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isFilterActive ? 'rotate-90' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Hierarchical Topic Matrix & Subtopic Drill-Down */}
      <section className="bg-white dark:bg-[#1A2420] rounded-xl p-6 border border-[#E2E6DD] dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EEF0EA] dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-[#1E252B] dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#2F7C7E]" />
              Syllabus Subtopic Matrix ({filteredTopics.length} Topics)
            </h2>
            <p className="text-xs text-[#5C646B] dark:text-slate-400">
              Inspect progress, standard book references, weightage, and launch targeted study sessions.
            </p>
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Sections' },
              { id: 'SHARED', label: 'Shared Core' },
              { id: 'CAPF', label: 'UPSC CAPF Track' },
              { id: 'CPO', label: 'SSC CPO Track' },
            ].map(sec => (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id as any)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                  selectedSection === sec.id
                    ? 'bg-[#36624B] text-white border-[#36624B]'
                    : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#5C646B] border-[#E2E6DD] dark:border-slate-800 hover:bg-[#EEF0EA]'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar & Active Subject Indicator */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#5C646B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topic, chapter, concept..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#36624B]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5C646B] w-full sm:w-auto justify-end">
            <span>Showing {filteredTopics.length} of {topicMetrics.length} topics</span>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTopics.map(topic => {
            return (
              <div
                key={topic.id}
                className="p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/40 bg-[#FFFFFF] dark:bg-[#121816] transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#5C646B] dark:text-slate-400">
                      {topic.subject}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        topic.weightage === 'High' ? 'bg-[#FBEAE8] text-[#C25345]' : 'bg-[#EEF0EA] text-[#5C646B]'
                      }`}>
                        {topic.weightage} Weightage
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        topic.status === 'Mastered'
                          ? 'bg-[#E6F4EA] text-[#2E7D5B]'
                          : topic.status === 'Proficient'
                          ? 'bg-[#E3EFE8] text-[#36624B]'
                          : topic.status === 'Developing'
                          ? 'bg-[#FEF3D6] text-[#8C7837]'
                          : 'bg-[#F7F8F5] text-[#5C646B]'
                      }`}>
                        {topic.status}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-[#1E252B] dark:text-white mt-1 leading-snug">
                    {topic.title}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-[#5C646B] dark:text-slate-400 mt-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#2F7C7E] flex-shrink-0" />
                    <span className="truncate">{topic.standardRef}</span>
                  </div>

                  {/* Key Concepts Preview */}
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {topic.keyConcepts.slice(0, 2).map((kc, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#F7F8F5] dark:bg-slate-800 text-[#5C646B] dark:text-slate-300">
                        &bull; {kc}
                      </span>
                    ))}
                    {topic.keyConcepts.length > 2 && (
                      <span className="text-[10px] px-1 text-[#5C646B]">
                        +{topic.keyConcepts.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Bar for Topic */}
                <div className="pt-3 border-t border-[#EEF0EA] dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-medium text-[#5C646B]">
                    {topic.solvedCount > 0 ? (
                      <span className="text-[#2E7D5B] font-semibold">{topic.accuracyRate}% Accuracy ({topic.solvedCount} Qs)</span>
                    ) : (
                      <span>Unattempted</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectTopicForAi(topic.title, topic.subject, topic.standardRef);
                        onNavigate('AI_TUTOR');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#E3EFE8] hover:bg-[#36624B] text-[#36624B] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Study with AI</span>
                    </button>

                    {topic.examFocus.includes('CAPF') ? (
                      <button
                        onClick={() => onNavigate('CAPF_ELIMINATION')}
                        className="px-3 py-1.5 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#1E252B] dark:text-slate-200 text-xs font-semibold border border-[#E2E6DD] transition-all cursor-pointer"
                      >
                        Elimination
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('CPO_SPEED')}
                        className="px-3 py-1.5 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#1E252B] dark:text-slate-200 text-xs font-semibold border border-[#E2E6DD] transition-all cursor-pointer"
                      >
                        Speed Drill
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Gamified Aspirant Achievements & Milestone Badges */}
      <section className="bg-gradient-to-br from-[#FFFFFF] to-[#F7F8F5] dark:from-[#1A2420] dark:to-[#121816] rounded-xl p-6 border border-[#E2E6DD] dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EEF0EA] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#8C7837]" />
            <div>
              <h3 className="font-bold text-base text-[#1E252B] dark:text-white">
                Aspirant Milestones & Service Badges
              </h3>
              <p className="text-xs text-[#5C646B] dark:text-slate-400">
                Celebrate study consistency and tactical mastery on the road to selection.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#FEF3D6] text-[#8C7837] border border-[#8C7837]/20">
            {achievements.filter(a => a.unlocked).length}/{achievements.length} Badges Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {achievements.map(ach => {
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border transition-all ${
                  ach.unlocked
                    ? 'bg-white dark:bg-[#121816] border-[#2E7D5B]/40 shadow-xs'
                    : 'bg-[#F7F8F5]/60 dark:bg-slate-900/40 border-[#E2E6DD] dark:border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    ach.unlocked ? 'bg-[#E6F4EA] text-[#2E7D5B]' : 'bg-[#EEF0EA] text-[#5C646B]'
                  }`}>
                    {ach.unlocked ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ach.unlocked ? 'bg-[#E6F4EA] text-[#2E7D5B]' : 'bg-[#EEF0EA] text-[#5C646B]'
                  }`}>
                    {ach.unlocked ? 'Unlocked' : ach.thresholdText}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-[#1E252B] dark:text-white">
                  {ach.title}
                </h4>
                <p className="text-[11px] text-[#5C646B] dark:text-slate-400 mt-1 leading-snug">
                  {ach.description}
                </p>

                {/* Progress bar */}
                <div className="mt-3 w-full h-1.5 rounded-full bg-[#EEF0EA] dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      ach.unlocked ? 'bg-[#2E7D5B]' : 'bg-[#36624B]'
                    }`}
                    style={{ width: `${ach.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
