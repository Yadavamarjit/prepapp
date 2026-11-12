import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { CpoSpeedMode } from './components/CpoSpeedMode';
import { CapfEliminationMode } from './components/CapfEliminationMode';
import { Paper2Lab } from './components/Paper2Lab';
import { AiTopicBreakdown } from './components/AiTopicBreakdown';
import { MistakeVault } from './components/MistakeVault';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { LearningHub } from './components/LearningHub';
import { INITIAL_QUESTION_BANK } from './data/questionBank';
import { Question, MistakeRecord, MistakeReason, Paper2Submission, ChapterProgress } from './types';
import { calculateNextSrsDate } from './utils/srsVault';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('OVERVIEW');

  // Question Bank (seeded + dynamic AI generated questions)
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('dutydeck_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_QUESTION_BANK;
  });

  // Mistake Vault records
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('dutydeck_mistakes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default seed mistake for instant demonstration of the vault
    return [
      {
        id: 'seed-m1',
        questionId: 'capf-pol-01',
        selectedAnswer: 'A',
        correctAnswer: 'B',
        timeSpentSeconds: 62,
        reason: 'Misread Question',
        timestamp: Date.now() - 3600000,
        reviewCount: 0,
        nextReviewDate: Date.now() - 1000, // Due for review today
        notes: 'Confused 1-month approval with 2-month approval in Art 352',
      },
    ];
  });

  // Paper 2 Submissions history
  const [submissions, setSubmissions] = useState<Paper2Submission[]>(() => {
    try {
      const saved = localStorage.getItem('dutydeck_submissions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Solved questions tracking
  const [solvedQuestionIds, setSolvedQuestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dutydeck_solved');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['cpo-quant-01', 'capf-pol-03'];
  });

  // NCERT & Standard Textbook Academy Chapter Progress
  const [chapterProgress, setChapterProgress] = useState<Record<string, ChapterProgress>>(() => {
    try {
      const saved = localStorage.getItem('dutydeck_chapter_progress');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'pol-chap-1': {
        chapterId: 'pol-chap-1',
        isCompleted: true,
        completedAt: Date.now() - 86400000,
      },
    };
  });
  const [selectedLearningChapterId, setSelectedLearningChapterId] = useState<string | undefined>(undefined);

  // Selected topic passed directly to AI Tutor
  const [aiTutorTopic, setAiTutorTopic] = useState<{
    title: string;
    subject: string;
    standardRef: string;
  }>({
    title: 'Emergency Provisions (Art 352, 356, 360)',
    subject: 'Polity & Constitution',
    standardRef: 'M. Laxmikanth Ch. 16',
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dutydeck_questions', JSON.stringify(questions));
      localStorage.setItem('dutydeck_mistakes', JSON.stringify(mistakes));
      localStorage.setItem('dutydeck_submissions', JSON.stringify(submissions));
      localStorage.setItem('dutydeck_solved', JSON.stringify(solvedQuestionIds));
      localStorage.setItem('dutydeck_chapter_progress', JSON.stringify(chapterProgress));
    } catch (e) {}
  }, [questions, mistakes, submissions, solvedQuestionIds, chapterProgress]);

  // Handler: Log Mistake to Vault
  const handleSaveMistake = (
    questionId: string,
    selected: 'A' | 'B' | 'C' | 'D',
    reason: MistakeReason,
    timeSpent: number
  ) => {
    setMistakes((prev) => {
      const existingIndex = prev.findIndex((m) => m.questionId === questionId);
      const question = questions.find((q) => q.id === questionId);
      const correctAnswer = question ? question.correctAnswer : 'A';

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          selectedAnswer: selected,
          reason,
          timeSpentSeconds: timeSpent,
          reviewCount: updated[existingIndex].reviewCount + 1,
          nextReviewDate: calculateNextSrsDate(updated[existingIndex].reviewCount + 1),
        };
        return updated;
      }

      const newRecord: MistakeRecord = {
        id: `m-${Date.now()}`,
        questionId,
        selectedAnswer: selected,
        correctAnswer,
        timeSpentSeconds: timeSpent,
        reason,
        timestamp: Date.now(),
        reviewCount: 0,
        nextReviewDate: calculateNextSrsDate(0),
      };
      return [newRecord, ...prev];
    });

    // Mark as attempted
    if (!solvedQuestionIds.includes(questionId)) {
      setSolvedQuestionIds((prev) => [...prev, questionId]);
    }
  };

  // Handler: Re-attempt review in Mistake Vault
  const handleUpdateMistakeReview = (mistakeId: string, isCorrectNow: boolean) => {
    setMistakes((prev) =>
      prev.map((m) => {
        if (m.id !== mistakeId) return m;
        const newCount = isCorrectNow ? m.reviewCount + 1 : 0;
        return {
          ...m,
          reviewCount: newCount,
          nextReviewDate: calculateNextSrsDate(newCount),
        };
      })
    );
  };

  // Handler: Clear mistake
  const handleClearMistake = (mistakeId: string) => {
    setMistakes((prev) => prev.filter((m) => m.id !== mistakeId));
  };

  // Handler: Save Paper 2 Submission
  const handleSaveSubmission = (submission: Paper2Submission) => {
    setSubmissions((prev) => [submission, ...prev]);
  };

  // Handler: Add dynamically generated AI questions
  const handleAddQuestionsToBank = (newQuestions: Question[]) => {
    setQuestions((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const novel = newQuestions.filter((q) => !existingIds.has(q.id));
      return [...prev, ...novel];
    });
  };

  // Handler: Select topic for AI tutor from other views
  const handleSelectTopicForAi = (title: string, subject: string, standardRef: string) => {
    setAiTutorTopic({ title, subject, standardRef });
    setActiveTab('AI_TUTOR');
  };

  // Handler: Toggle Chapter Completion
  const handleToggleChapterCompleted = (chapterId: string) => {
    setChapterProgress((prev) => {
      const current = prev[chapterId];
      const isNowCompleted = !current?.isCompleted;
      return {
        ...prev,
        [chapterId]: {
          chapterId,
          isCompleted: isNowCompleted,
          completedAt: isNowCompleted ? Date.now() : undefined,
        },
      };
    });
  };

  // Handler: Open specific chapter in study hub
  const handleOpenChapter = (chapterId: string) => {
    setSelectedLearningChapterId(chapterId);
    setActiveTab('LEARNING');
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-[#E6EAE8] flex flex-col font-sans transition-colors">
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        vaultCount={mistakes.length}
        completedQuestionsCount={solvedQuestionIds.length}
        streakDays={4}
      />

      {/* Main View Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        {activeTab === 'OVERVIEW' && (
          <OverviewDashboard
            onNavigate={setActiveTab}
            questions={questions}
            mistakes={mistakes}
            submissions={submissions}
            solvedQuestionIds={solvedQuestionIds}
            onSelectTopicForAi={handleSelectTopicForAi}
            onOpenChapter={handleOpenChapter}
          />
        )}

        {activeTab === 'LEARNING' && (
          <LearningHub
            progressMap={chapterProgress}
            onToggleChapterCompleted={handleToggleChapterCompleted}
            onNavigateToDrill={(track) => setActiveTab(track)}
            onSelectTopicForAi={handleSelectTopicForAi}
            selectedChapterId={selectedLearningChapterId}
          />
        )}

        {activeTab === 'CPO_SPEED' && (
          <CpoSpeedMode
            questions={questions}
            onSaveMistake={handleSaveMistake}
            onSelectTopicForAi={handleSelectTopicForAi}
          />
        )}

        {activeTab === 'CAPF_ELIMINATION' && (
          <CapfEliminationMode
            questions={questions}
            onSaveMistake={handleSaveMistake}
            onSelectTopicForAi={handleSelectTopicForAi}
          />
        )}

        {activeTab === 'PAPER_2' && (
          <Paper2Lab
            onSaveSubmission={handleSaveSubmission}
            submissions={submissions}
          />
        )}

        {activeTab === 'AI_TUTOR' && (
          <AiTopicBreakdown
            initialTopic={aiTutorTopic.title}
            initialSubject={aiTutorTopic.subject}
            initialRef={aiTutorTopic.standardRef}
            mistakes={mistakes}
            solvedQuestionIds={solvedQuestionIds}
            allQuestions={questions}
            onSaveMistake={handleSaveMistake}
            onAddQuestionsToBank={handleAddQuestionsToBank}
          />
        )}

        {activeTab === 'MISTAKE_VAULT' && (
          <MistakeVault
            mistakes={mistakes}
            questions={questions}
            onUpdateMistakeReview={handleUpdateMistakeReview}
            onClearMistake={handleClearMistake}
            onSelectTopicForAi={handleSelectTopicForAi}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <AnalyticsPanel
            questions={questions}
            mistakes={mistakes}
            submissions={submissions}
            solvedQuestionIds={solvedQuestionIds}
            onNavigate={setActiveTab}
            onSelectTopicForAi={handleSelectTopicForAi}
            streakDays={4}
          />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-[#E2E6DD] dark:border-slate-800 bg-[#FFFFFF] dark:bg-[#121816] py-6 text-center text-xs text-[#5C646B] dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1E252B] dark:text-white">DutyDeck</span>
            <span>&bull; Dual-Target Preparation Engine for UPSC CAPF AC & SSC CPO</span>
          </div>
          <div className="text-[11px] font-mono">
            Nordic Botanical Theme &bull; 15-Minute Section Gates &bull; Elimination Scratchpad
          </div>
        </div>
      </footer>
    </div>
  );
}
