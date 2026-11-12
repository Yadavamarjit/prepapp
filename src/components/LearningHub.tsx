import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Search,
  Sparkles,
  Zap,
  CheckSquare,
  BookmarkCheck,
  ChevronRight,
  Award,
  AlertTriangle,
  Lightbulb,
  Maximize2,
  Minimize2,
  Filter,
  ArrowRight,
  FileText,
  RotateCcw
} from 'lucide-react';
import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { LearningChapter, ChapterProgress, Subject } from '../types';
import {
  calculateLearningProgress,
  filterLearningChapters,
  getRecommendedChapter,
} from '../utils/learningProgress';

interface LearningHubProps {
  progressMap: Record<string, ChapterProgress>;
  onToggleChapterCompleted: (chapterId: string) => void;
  onNavigateToDrill: (track: 'CPO_SPEED' | 'CAPF_ELIMINATION') => void;
  onSelectTopicForAi: (title: string, subject: string, standardRef: string) => void;
  selectedChapterId?: string;
}

export const LearningHub: React.FC<LearningHubProps> = ({
  progressMap,
  onToggleChapterCompleted,
  onNavigateToDrill,
  onSelectTopicForAi,
  selectedChapterId: initialSelectedId,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [examFilter, setExamFilter] = useState<'ALL' | 'UPSC_CAPF' | 'SSC_CPO'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // Active chapter being read
  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
    return initialSelectedId || LEARNING_CHAPTERS[0]?.id || '';
  });

  // Track checked key concepts in the reading view
  const [checkedConcepts, setCheckedConcepts] = useState<Record<string, boolean>>({});

  // Mini quiz state per question inside current chapter: { questionIndex: selectedOptionIndex }
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});

  // Filtered chapters list
  const filteredChapters = useMemo(() => {
    return filterLearningChapters(LEARNING_CHAPTERS, {
      subject: selectedSubject,
      examTrack: examFilter,
      searchQuery,
    });
  }, [selectedSubject, examFilter, searchQuery]);

  // Overall progress summary
  const progressSummary = useMemo(() => {
    return calculateLearningProgress(LEARNING_CHAPTERS, progressMap);
  }, [progressMap]);

  // Current active chapter
  const currentChapter = useMemo(() => {
    return LEARNING_CHAPTERS.find((c) => c.id === activeChapterId) || filteredChapters[0] || LEARNING_CHAPTERS[0];
  }, [activeChapterId, filteredChapters]);

  // Next recommended chapter
  const recommendedChapter = useMemo(() => {
    return getRecommendedChapter(LEARNING_CHAPTERS, progressMap);
  }, [progressMap]);

  const subjectsList: (Subject | 'ALL')[] = [
    'ALL',
    'Polity & Constitution',
    'Modern History',
    'Geography & Environment',
    'Quantitative Aptitude',
    'Reasoning & Intelligence',
    'Paper 2 (Subjective)',
  ];

  const handleConceptToggle = (conceptText: string) => {
    setCheckedConcepts((prev) => ({
      ...prev,
      [conceptText]: !prev[conceptText],
    }));
  };

  const handleSelectQuizOption = (qIdx: number, optionIdx: number) => {
    if (quizSubmitted[qIdx]) return;
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }));
    setQuizSubmitted((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleResetQuiz = (qIdx: number) => {
    setQuizSubmitted((prev) => ({ ...prev, [qIdx]: false }));
    setQuizAnswers((prev) => {
      const next = { ...prev };
      delete next[qIdx];
      return next;
    });
  };

  const isCurrentCompleted = !!progressMap[currentChapter?.id]?.isCompleted;

  // Next chapter index helper
  const nextChapter = useMemo(() => {
    if (!currentChapter) return null;
    const currentIndex = LEARNING_CHAPTERS.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex >= 0 && currentIndex < LEARNING_CHAPTERS.length - 1) {
      return LEARNING_CHAPTERS[currentIndex + 1];
    }
    return null;
  }, [currentChapter]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner & High-Yield NCERT Progress */}
      {!focusMode && (
        <div className="rounded-2xl bg-gradient-to-r from-[#1A3326] via-[#2A4D3B] to-[#1E252B] text-white p-6 sm:p-8 shadow-md border border-[#36624B]/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#36624B]/30 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3EFE8]/20 border border-[#E3EFE8]/30 text-xs font-semibold text-[#88D4A8]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Foundational Academy &bull; Complete Self-Reliant Curriculum</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
                NCERT & Standard Textbook Academy
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Comprehensive subject-wise lessons bridging foundational NCERTs (Class 11 & 12) with standard reference texts (M. Laxmikanth, Spectrum, D.D. Basu). Master theory, analytical angles, speed shortcuts, and examiner traps before taking timed drills.
              </p>
            </div>

            {/* Quick Metrics Badge Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex flex-col sm:flex-row items-center gap-6 min-w-[280px]">
              <div className="text-center sm:text-left">
                <div className="text-xs text-slate-300 font-medium">Syllabus Mastered</div>
                <div className="text-2xl font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                  <span>{progressSummary.completedChapters}</span>
                  <span className="text-xs text-slate-400 font-normal">/ {progressSummary.totalChapters} Ch.</span>
                </div>
                <div className="text-[11px] text-[#88D4A8] font-mono mt-0.5">
                  {progressSummary.overallPercentage}% Completed
                </div>
              </div>

              <div className="w-full sm:w-36 space-y-1.5">
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#88D4A8] to-[#2E7D5B] rounded-full transition-all duration-500"
                    style={{ width: `${progressSummary.overallPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>{progressSummary.completedReadingMinutes} min read</span>
                  <span>{progressSummary.totalReadingMinutes} min total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Subject Tabs */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {subjectsList.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-[#E3EFE8] text-[#1A3326] shadow-xs'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {subj === 'ALL' ? 'All Subjects' : subj}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Filter & Search Controls Bar */}
      {!focusMode && (
        <div className="bg-white dark:bg-[#1A2420] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C646B] dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NCERT chapters, topics, Laxmikanth, traps..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#36624B]/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5C646B] hover:text-[#1E252B]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Exam Filter Chips */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-[#5C646B] dark:text-slate-400 font-medium hidden sm:inline">
              Exam Focus:
            </span>
            <button
              onClick={() => setExamFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                examFilter === 'ALL'
                  ? 'bg-[#36624B] text-white'
                  : 'bg-[#F2F4F0] dark:bg-[#121816] text-[#5C646B] dark:text-slate-300 hover:text-[#1E252B]'
              }`}
            >
              Dual (Both)
            </button>
            <button
              onClick={() => setExamFilter('UPSC_CAPF')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                examFilter === 'UPSC_CAPF'
                  ? 'bg-[#36624B] text-white'
                  : 'bg-[#F2F4F0] dark:bg-[#121816] text-[#5C646B] dark:text-slate-300 hover:text-[#1E252B]'
              }`}
            >
              UPSC CAPF
            </button>
            <button
              onClick={() => setExamFilter('SSC_CPO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                examFilter === 'SSC_CPO'
                  ? 'bg-[#36624B] text-white'
                  : 'bg-[#F2F4F0] dark:bg-[#121816] text-[#5C646B] dark:text-slate-300 hover:text-[#1E252B]'
              }`}
            >
              SSC CPO
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Workspace: Two-Column Split (Catalog & Reading Desk) */}
      <div className={`grid grid-cols-1 ${focusMode ? 'lg:grid-cols-1 max-w-4xl mx-auto' : 'lg:grid-cols-12'} gap-6 items-start`}>
        
        {/* Left Column: Chapter Syllabus Catalog (Hidden in Focus Mode) */}
        {!focusMode && (
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1E252B] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#36624B]" />
                <span>Chapter Syllabus ({filteredChapters.length})</span>
              </h2>
              {recommendedChapter && (
                <button
                  onClick={() => setActiveChapterId(recommendedChapter.id)}
                  className="text-[11px] text-[#36624B] dark:text-[#88D4A8] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Next Recommended</span>
                </button>
              )}
            </div>

            {/* Chapters Scrollable List */}
            <div className="space-y-2.5 max-h-[820px] overflow-y-auto pr-1">
              {filteredChapters.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#1A2420] rounded-xl border border-[#E2E6DD] dark:border-slate-800 text-xs text-[#5C646B]">
                  No chapters matched your search filters. Try clearing your query.
                </div>
              ) : (
                filteredChapters.map((chapter) => {
                  const isSelected = chapter.id === currentChapter?.id;
                  const isDone = !!progressMap[chapter.id]?.isCompleted;

                  return (
                    <div
                      key={chapter.id}
                      onClick={() => setActiveChapterId(chapter.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#E3EFE8]/40 dark:bg-[#1E3328] border-[#36624B] shadow-sm'
                          : 'bg-white dark:bg-[#1A2420] border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/40 hover:bg-[#F7F8F5] dark:hover:bg-[#141E1A]'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#EEF0EA] dark:bg-slate-800 text-[#5C646B] dark:text-slate-300 truncate max-w-[200px]">
                          {chapter.ncertBook.split('(')[0]}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isDone ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#2E7D5B] bg-[#E3EFE8] dark:bg-[#162A1F] px-1.5 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              <span>Mastered</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#5C646B] dark:text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {chapter.readTimeMinutes}m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className={`text-xs font-bold leading-snug ${
                        isSelected ? 'text-[#1A3326] dark:text-[#88D4A8]' : 'text-[#1E252B] dark:text-white'
                      }`}>
                        Ch. {chapter.chapterNumber}: {chapter.chapterTitle}
                      </h3>

                      {/* Footer tags */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2E6DD]/60 dark:border-slate-800/60">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          chapter.weightage === 'Very High'
                            ? 'bg-[#FBEAE8] text-[#C25345]'
                            : 'bg-[#F7F8F5] dark:bg-slate-800 text-[#5C646B]'
                        }`}>
                          {chapter.weightage} Weightage
                        </span>
                        <span className="text-[10px] text-[#5C646B] dark:text-slate-400 font-medium">
                          {chapter.subject.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Column: The Deep Reading Chamber */}
        <div className={`${focusMode ? 'w-full' : 'lg:col-span-8'} space-y-6`}>
          {currentChapter ? (
            <div className="bg-white dark:bg-[#1A2420] rounded-2xl border border-[#E2E6DD] dark:border-slate-800 shadow-sm overflow-hidden">
              
              {/* Reading Header Bar */}
              <div className="p-5 sm:p-6 border-b border-[#E2E6DD] dark:border-slate-800 bg-[#FAFBF9] dark:bg-[#151D1A]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#36624B] dark:text-[#88D4A8] bg-[#E3EFE8] dark:bg-[#162A1F] px-2.5 py-1 rounded-md border border-[#36624B]/20">
                      {currentChapter.ncertBook}
                    </span>
                    <span className="text-xs text-[#5C646B] dark:text-slate-400 font-mono">
                      &bull; {currentChapter.readTimeMinutes} min read
                    </span>
                  </div>

                  {/* Reading Settings & Actions */}
                  <div className="flex items-center gap-2">
                    {/* Font Size Selector */}
                    <div className="flex items-center bg-[#EEF0EA] dark:bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
                      <button
                        onClick={() => setFontSize('sm')}
                        className={`px-2 py-1 rounded ${fontSize === 'sm' ? 'bg-white dark:bg-[#1E252B] shadow-2xs text-[#1E252B] dark:text-white' : 'text-[#5C646B]'}`}
                        title="Small font"
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setFontSize('base')}
                        className={`px-2 py-1 rounded ${fontSize === 'base' ? 'bg-white dark:bg-[#1E252B] shadow-2xs text-[#1E252B] dark:text-white' : 'text-[#5C646B]'}`}
                        title="Default font"
                      >
                        A
                      </button>
                      <button
                        onClick={() => setFontSize('lg')}
                        className={`px-2 py-1 rounded ${fontSize === 'lg' ? 'bg-white dark:bg-[#1E252B] shadow-2xs text-[#1E252B] dark:text-white' : 'text-[#5C646B]'}`}
                        title="Large font"
                      >
                        A+
                      </button>
                    </div>

                    {/* Focus Mode Toggle */}
                    <button
                      onClick={() => setFocusMode(!focusMode)}
                      className="p-1.5 rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-white dark:bg-[#1E252B] text-[#5C646B] hover:text-[#1E252B] dark:hover:text-white transition-all cursor-pointer"
                      title={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
                    >
                      {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    {/* Mark as Mastered CTA */}
                    <button
                      onClick={() => onToggleChapterCompleted(currentChapter.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCurrentCompleted
                          ? 'bg-[#2E7D5B] text-white shadow-xs'
                          : 'bg-[#36624B] text-white hover:bg-[#2A4F3C]'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isCurrentCompleted ? 'Mastered ✓' : 'Mark as Mastered'}</span>
                    </button>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-[#1E252B] dark:text-white font-serif leading-tight">
                  Ch. {currentChapter.chapterNumber}: {currentChapter.chapterTitle}
                </h1>
                <p className="text-xs sm:text-sm text-[#5C646B] dark:text-slate-300 mt-2 leading-relaxed">
                  {currentChapter.summaryOverview}
                </p>
              </div>

              {/* Reading Body */}
              <div className={`p-6 sm:p-8 space-y-8 ${
                fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
              }`}>
                
                {/* 1. Core Concepts Checklist */}
                <div className="p-4 rounded-xl bg-[#F7F8F5] dark:bg-[#151D1A] border border-[#E2E6DD] dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#36624B] dark:text-[#88D4A8] flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4" />
                      <span>Key Syllabus Benchmarks To Master</span>
                    </span>
                    <span className="text-[11px] text-[#5C646B] dark:text-slate-400 font-mono">
                      Check each once internalized
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentChapter.coreConcepts.map((concept) => {
                      const isChecked = !!checkedConcepts[concept];
                      return (
                        <div
                          key={concept}
                          onClick={() => handleConceptToggle(concept)}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-[#E3EFE8]/50 dark:bg-[#162A1F] border-[#36624B]/30 text-[#1E252B] dark:text-white line-through opacity-75'
                              : 'bg-white dark:bg-[#1E252B] border-[#E2E6DD] dark:border-slate-800 text-[#1E252B] dark:text-slate-200 hover:border-[#36624B]/30'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isChecked ? 'bg-[#36624B] border-[#36624B] text-white' : 'border-slate-400'
                          }`}>
                            {isChecked && <CheckCircle className="w-3 h-3" />}
                          </div>
                          <span className="leading-snug">{concept}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Structured Textbook Sections */}
                <div className="space-y-8 text-[#2A3238] dark:text-[#D5DBD8] leading-relaxed font-sans">
                  {currentChapter.sections.map((section, sIdx) => (
                    <section key={sIdx} className="space-y-3 pt-4 border-t border-[#E2E6DD]/60 dark:border-slate-800/60 first:border-t-0 first:pt-0">
                      <h2 className="text-base sm:text-lg font-bold text-[#1E252B] dark:text-white font-serif flex items-center gap-2">
                        <span>{section.heading}</span>
                      </h2>

                      <p className="leading-relaxed whitespace-pre-line text-justify">
                        {section.content}
                      </p>

                      {/* Structured Table if present */}
                      {section.tableData && (
                        <div className="my-4 overflow-x-auto rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-2xs">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-[#EEF0EA] dark:bg-[#151D1A] border-b border-[#E2E6DD] dark:border-slate-800 text-[#1E252B] dark:text-white">
                                {section.tableData.headers.map((h, i) => (
                                  <th key={i} className="p-3 font-bold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E6DD] dark:divide-slate-800 bg-white dark:bg-[#1A2420]">
                              {section.tableData.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-[#F7F8F5] dark:hover:bg-[#141E1A] transition-colors">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className={`p-3 ${cIdx === 0 ? 'font-semibold text-[#1E252B] dark:text-white' : 'text-[#5C646B] dark:text-slate-300'}`}>
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Bullet points if present */}
                      {section.bulletPoints && section.bulletPoints.length > 0 && (
                        <ul className="space-y-1.5 my-3 pl-4 list-disc marker:text-[#36624B] dark:marker:text-[#88D4A8]">
                          {section.bulletPoints.map((pt, pIdx) => (
                            <li key={pIdx} className="leading-relaxed">
                              {pt}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Key Takeaway Callout */}
                      {section.keyTakeaway && (
                        <div className="p-3.5 rounded-xl bg-[#E3EFE8]/40 dark:bg-[#162A1F] border-l-4 border-[#36624B] text-xs font-medium text-[#1A3326] dark:text-[#A1E3BD]">
                          <span className="font-bold uppercase tracking-wider block mb-0.5 text-[#36624B] dark:text-[#88D4A8]">
                            Key Takeaway / Standard Formula:
                          </span>
                          {section.keyTakeaway}
                        </div>
                      )}
                    </section>
                  ))}
                </div>

                {/* 3. Dual-Exam Strategic Callout Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E2E6DD] dark:border-slate-800">
                  {/* UPSC CAPF Analytical Strategy */}
                  <div className="p-4 rounded-xl bg-[#F7F8F5] dark:bg-[#151D1A] border border-[#36624B]/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#36624B] dark:text-[#88D4A8]">
                      <CheckSquare className="w-4 h-4" />
                      <span>UPSC CAPF Analytical Angle</span>
                    </div>
                    <p className="text-xs text-[#2A3238] dark:text-slate-300 leading-relaxed">
                      {currentChapter.upscCapfAnalyticalAngle}
                    </p>
                  </div>

                  {/* SSC CPO Speed Strategy */}
                  <div className="p-4 rounded-xl bg-[#F7F8F5] dark:bg-[#151D1A] border border-[#D97746]/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#D97746]">
                      <Zap className="w-4 h-4" />
                      <span>SSC CPO Speed Shortcut</span>
                    </div>
                    <p className="text-xs text-[#2A3238] dark:text-slate-300 leading-relaxed">
                      {currentChapter.sscCpoSpeedShortcut}
                    </p>
                  </div>
                </div>

                {/* 4. High-Yield Examiner Traps & Memory Mnemonics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Examiner Traps */}
                  <div className="p-4 rounded-xl bg-[#FBEAE8] dark:bg-[#2A1715] border border-[#C25345]/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#C25345]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Examiner Traps to Avoid</span>
                    </div>
                    <ul className="space-y-1 text-xs text-[#6B2820] dark:text-red-200">
                      {currentChapter.examinerTraps.map((trap, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-1.5">
                          <span className="text-[#C25345] font-bold">&bull;</span>
                          <span>{trap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* High-Yield Mnemonics */}
                  <div className="p-4 rounded-xl bg-[#EEF0EA] dark:bg-[#1E2822] border border-[#36624B]/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#36624B] dark:text-[#88D4A8]">
                      <Lightbulb className="w-4 h-4" />
                      <span>High-Yield Mnemonics & Memory Triggers</span>
                    </div>
                    <ul className="space-y-1 text-xs text-[#1E252B] dark:text-slate-200">
                      {currentChapter.highYieldMnemonics.map((mnem, mIdx) => (
                        <li key={mIdx} className="flex items-start gap-1.5">
                          <span className="text-[#36624B] dark:text-[#88D4A8] font-bold">&bull;</span>
                          <span>{mnem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 5. In-Lesson Comprehension Check (Self-Assessment) */}
                {currentChapter.comprehensionQuiz && currentChapter.comprehensionQuiz.length > 0 && (
                  <div className="pt-6 border-t border-[#E2E6DD] dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1E252B] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#D97746]" />
                        <span>Instant Comprehension Check ({currentChapter.comprehensionQuiz.length} Questions)</span>
                      </h3>
                      <span className="text-xs text-[#5C646B] dark:text-slate-400">
                        Verify understanding before taking full drills
                      </span>
                    </div>

                    <div className="space-y-4">
                      {currentChapter.comprehensionQuiz.map((quiz, qIdx) => {
                        const isAnswered = !!quizSubmitted[qIdx];
                        const selectedOption = quizAnswers[qIdx];
                        const isCorrect = selectedOption === quiz.correctIndex;

                        return (
                          <div
                            key={qIdx}
                            className="p-4 rounded-xl bg-[#F7F8F5] dark:bg-[#151D1A] border border-[#E2E6DD] dark:border-slate-800 space-y-3"
                          >
                            <p className="text-xs sm:text-sm font-semibold text-[#1E252B] dark:text-white">
                              Q{qIdx + 1}. {quiz.question}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {quiz.options.map((opt, oIdx) => {
                                let btnStyle = 'bg-white dark:bg-[#1E252B] border-[#E2E6DD] dark:border-slate-800 text-[#1E252B] dark:text-slate-300 hover:border-[#36624B]';

                                if (isAnswered) {
                                  if (oIdx === quiz.correctIndex) {
                                    btnStyle = 'bg-[#E3EFE8] dark:bg-[#162A1F] border-[#2E7D5B] text-[#2E7D5B] font-bold';
                                  } else if (selectedOption === oIdx) {
                                    btnStyle = 'bg-[#FBEAE8] dark:bg-[#2A1715] border-[#C25345] text-[#C25345] font-bold';
                                  } else {
                                    btnStyle = 'opacity-50 border-[#E2E6DD] dark:border-slate-800 text-[#5C646B]';
                                  }
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleSelectQuizOption(qIdx, oIdx)}
                                    disabled={isAnswered}
                                    className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                                  >
                                    <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Feedback on answer */}
                            {isAnswered && (
                              <div className={`p-3 rounded-lg text-xs space-y-1 ${
                                isCorrect
                                  ? 'bg-[#E3EFE8]/70 dark:bg-[#162A1F] text-[#1A3326] dark:text-[#A1E3BD]'
                                  : 'bg-[#FBEAE8]/70 dark:bg-[#2A1715] text-[#6B2820] dark:text-red-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold">
                                    {isCorrect ? '✓ Correct Answer!' : '✗ Incorrect!'}
                                  </span>
                                  <button
                                    onClick={() => handleResetQuiz(qIdx)}
                                    className="text-[10px] underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    Try again
                                  </button>
                                </div>
                                <p className="leading-relaxed">{quiz.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. Footer Next Action Bar */}
                <div className="pt-6 border-t border-[#E2E6DD] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onNavigateToDrill('CAPF_ELIMINATION')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#36624B] text-white text-xs font-bold hover:bg-[#2A4F3C] transition-all cursor-pointer shadow-xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Take CAPF Elimination Drill</span>
                    </button>
                    <button
                      onClick={() => onNavigateToDrill('CPO_SPEED')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#D97746] text-white text-xs font-bold hover:bg-[#C26535] transition-all cursor-pointer shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Take CPO Speed Drill</span>
                    </button>
                  </div>

                  {/* Next Chapter CTA */}
                  {nextChapter && (
                    <button
                      onClick={() => setActiveChapterId(nextChapter.id)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#E2E6DD] dark:border-slate-700 bg-[#F7F8F5] dark:bg-[#1E252B] text-xs font-bold text-[#1E252B] dark:text-white hover:bg-[#EEF0EA] transition-all cursor-pointer"
                    >
                      <span>Next: Ch. {nextChapter.chapterNumber}</span>
                      <ChevronRight className="w-4 h-4 text-[#36624B]" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#1A2420] rounded-2xl border border-[#E2E6DD] dark:border-slate-800 text-sm text-[#5C646B]">
              Select a chapter from the syllabus catalog to begin reading.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
