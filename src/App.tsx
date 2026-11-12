import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet, useNavigate, useLocation, useParams, Navigate, Link } from 'react-router-dom';
import { Navbar, NavTab } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { CpoSpeedMode } from './components/CpoSpeedMode';
import { CapfEliminationMode } from './components/CapfEliminationMode';
import { Paper2Lab } from './components/Paper2Lab';
import { AiTopicBreakdown } from './components/AiTopicBreakdown';
import { MistakeVault } from './components/MistakeVault';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { LearningHub } from './components/LearningHub';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { INITIAL_QUESTION_BANK } from './data/questionBank';
import { Question, MistakeRecord, MistakeReason, Paper2Submission, ChapterProgress } from './types';
import { calculateNextSrsDate } from './utils/srsVault';
import { ShieldAlert, Compass } from 'lucide-react';

// Wrapper for LoginPage to automatically redirect authenticated users
const LoginPageWrapper: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as any)?.from?.pathname || '/';

  if (user) {
    return <Navigate to={from} replace />;
  }

  return <LoginPage onSuccess={() => navigate(from, { replace: true })} />;
};

// 404 Route Not Found Component
const NotFoundPage: React.FC = () => {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FBEAE8] dark:bg-[#2C1816] flex items-center justify-center text-[#C25345]">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-[#1E252B] dark:text-white">
        Sector Not Found (404)
      </h2>
      <p className="text-sm text-[#5C646B] dark:text-slate-400 max-w-md mx-auto">
        The tactical deck or module you requested does not exist or has been relocated in the DutyDeck command structure.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#36624B] hover:bg-[#2A4F3C] text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <Compass className="w-4 h-4" />
          <span>Return to Dual Overview Command</span>
        </Link>
      </div>
    </div>
  );
};

// Protected Layout with Navigation Bar and Footer
const ProtectedAppLayout: React.FC<{
  vaultCount: number;
  completedQuestionsCount: number;
  streakDays: number;
}> = ({ vaultCount, completedQuestionsCount, streakDays }) => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-[#E6EAE8] flex flex-col font-sans transition-colors">
        {/* Sticky Top Navigation */}
        <Navbar
          vaultCount={vaultCount}
          completedQuestionsCount={completedQuestionsCount}
          streakDays={streakDays}
        />

        {/* Main View Area */}
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full pb-12">
          <Outlet />
        </main>

        {/* Subtle Footer */}
        <footer className="border-t border-[#E2E6DD] dark:border-slate-800 bg-[#FFFFFF] dark:bg-[#121816] py-6 text-center text-xs text-[#5C646B] dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1E252B] dark:text-white">DutyDeck</span>
              <span>&bull; Dual-Target Multi-Page Preparation Suite for UPSC CAPF AC & SSC CPO</span>
            </div>
            <div className="text-[11px] font-mono">
              Nordic Botanical Theme &bull; 15-Minute Section Gates &bull; Elimination Scratchpad
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
};

export default function App() {
  const navigate = useNavigate();

  // Mapping from NavTab to multi-page URL routes
  const tabPathMap: Record<NavTab, string> = {
    OVERVIEW: '/',
    LEARNING: '/learning',
    ANALYTICS: '/analytics',
    CPO_SPEED: '/cpo-speed',
    CAPF_ELIMINATION: '/capf-elimination',
    PAPER_2: '/paper-2',
    AI_TUTOR: '/ai-tutor',
    MISTAKE_VAULT: '/mistake-vault',
  };

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
        nextReviewDate: Date.now() - 1000,
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
    navigate('/ai-tutor');
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
    navigate(`/learning/${chapterId}`);
  };

  // Navigation redirect handler for legacy tab props
  const handleNavigateByTab = (tab: NavTab) => {
    const targetPath = tabPathMap[tab] || '/';
    navigate(targetPath);
  };

  // Route sub-component for LearningHub with path parameter support
  const LearningHubRoute: React.FC = () => {
    const { chapterId } = useParams<{ chapterId?: string }>();
    return (
      <LearningHub
        progressMap={chapterProgress}
        onToggleChapterCompleted={handleToggleChapterCompleted}
        onNavigateToDrill={(track) => navigate(track === 'CPO_SPEED' ? '/cpo-speed' : '/capf-elimination')}
        onSelectTopicForAi={handleSelectTopicForAi}
        selectedChapterId={chapterId || selectedLearningChapterId}
      />
    );
  };

  return (
    <Routes>
      {/* Public Authentication Gate (Cadet Login) */}
      <Route path="/login" element={<LoginPageWrapper />} />

      {/* Protected Multi-Page Application Layout */}
      <Route
        element={
          <ProtectedAppLayout
            vaultCount={mistakes.length}
            completedQuestionsCount={solvedQuestionIds.length}
            streakDays={4}
          />
        }
      >
        <Route
          index
          element={
            <OverviewDashboard
              onNavigate={handleNavigateByTab}
              questions={questions}
              mistakes={mistakes}
              submissions={submissions}
              solvedQuestionIds={solvedQuestionIds}
              onSelectTopicForAi={handleSelectTopicForAi}
              onOpenChapter={handleOpenChapter}
            />
          }
        />
        <Route
          path="dashboard"
          element={
            <OverviewDashboard
              onNavigate={handleNavigateByTab}
              questions={questions}
              mistakes={mistakes}
              submissions={submissions}
              solvedQuestionIds={solvedQuestionIds}
              onSelectTopicForAi={handleSelectTopicForAi}
              onOpenChapter={handleOpenChapter}
            />
          }
        />
        <Route path="learning" element={<LearningHubRoute />} />
        <Route path="learning/:chapterId" element={<LearningHubRoute />} />
        <Route
          path="cpo-speed"
          element={
            <CpoSpeedMode
              questions={questions}
              onSaveMistake={handleSaveMistake}
              onSelectTopicForAi={handleSelectTopicForAi}
            />
          }
        />
        <Route
          path="capf-elimination"
          element={
            <CapfEliminationMode
              questions={questions}
              onSaveMistake={handleSaveMistake}
              onSelectTopicForAi={handleSelectTopicForAi}
            />
          }
        />
        <Route
          path="paper-2"
          element={
            <Paper2Lab
              onSaveSubmission={handleSaveSubmission}
              submissions={submissions}
            />
          }
        />
        <Route
          path="ai-tutor"
          element={
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
          }
        />
        <Route
          path="mistake-vault"
          element={
            <MistakeVault
              mistakes={mistakes}
              questions={questions}
              onUpdateMistakeReview={handleUpdateMistakeReview}
              onClearMistake={handleClearMistake}
              onSelectTopicForAi={handleSelectTopicForAi}
            />
          }
        />
        <Route
          path="analytics"
          element={
            <AnalyticsPanel
              questions={questions}
              mistakes={mistakes}
              submissions={submissions}
              solvedQuestionIds={solvedQuestionIds}
              onNavigate={handleNavigateByTab}
              onSelectTopicForAi={handleSelectTopicForAi}
              streakDays={4}
            />
          }
        />
        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
