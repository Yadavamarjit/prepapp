import { LoadingIndicator } from './components/LoadingIndicator';
import { SyllabusProvider, useSyllabus } from './context/SyllabusContext';
import { StudyPreferencesProvider } from './context/StudyPreferences';
import React, { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Outlet, useNavigate, useLocation, useSearchParams, Navigate, Link, matchPath } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { CapfEliminationMode } from './components/CapfEliminationMode';
import { CapfAnalytica } from './components/CapfAnalytica';
import { Paper2Lab } from './components/Paper2Lab';
import { AiTopicBreakdown } from './components/AiTopicBreakdown';
import { MistakeVault } from './components/MistakeVault';
import { PracticeHome, RevisionHome, ProgressPage, SectionNavigation } from './components/StudySections';
import { LearningHub } from './components/LearningHub';
import { BooksLibrary } from './components/BooksLibrary';
import { CalculationCoach } from './components/CalculationCoach';
import { CapfSyllabus } from './components/CapfSyllabus';
import { CurrentAffairs } from './components/CurrentAffairs';
import { AFFAIR_PROGRESS_KEY, parseAffairProgress, type AffairProgress } from './utils/currentAffairs';
import { LearnReels } from './components/LearnReels';
import { buildReelRecallCards, parseReelsProgress, REELS_STORAGE_KEY, type ReelsProgress } from './utils/learningReels';
import { NcertExplorer } from './components/NcertExplorer';
import { DailyReview } from './components/DailyReview';
import { LEARNING_CHAPTERS } from './data/learningLibrary';
import { buildRecallCards, parseRecallProgress, RECALL_STORAGE_KEY, scheduleRecall, getDueRecallCards } from './utils/dailyReview';
import type { RecallRating } from './utils/dailyReview';
import { useAuth } from './context/AuthContext';
import { INITIAL_QUESTION_BANK } from './data/questionBank';
import { Question, MistakeRecord, MistakeReason, Paper2Submission, ChapterProgress } from './types';
import { calculateNextSrsDate } from './utils/srsVault';
import { ShieldAlert, Compass } from 'lucide-react';

const ChapterwisePyq = lazy(() => import('./components/ChapterwisePyq'));

// 404 Route Not Found Component
const NotFoundPage: React.FC = () => {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FBEAE8] dark:bg-[#2C1816] flex items-center justify-center text-[#C25345]">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-[#1E252B] dark:text-white">
        Page not found
      </h2>
      <p className="text-sm text-[#5C646B] dark:text-slate-400 max-w-md mx-auto">
        This page may have moved. Go back to your study plan to continue.
      </p>
      <div className="pt-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#36624B] hover:bg-[#2A4F3C] text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <Compass className="w-4 h-4" />
          <span>Back to Today</span>
        </Link>
      </div>
    </div>
  );
};

function StudyLayout() {
  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#30392D] dark:bg-[#121816] dark:text-[#E6EAE8]">
      <a href="#study-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3 focus:text-black">Skip to content</a>
      <Navbar />
      <div className="lg:ml-56">
        <main id="study-content" className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-5 pb-28 pt-7 sm:px-8 lg:px-10 lg:pb-12 lg:pt-10"><SectionNavigation /><Outlet /></main>
      </div>
    </div>
  );
}

function PublicTopicPractice({ loading }: { loading: boolean }) {
  const [params] = useSearchParams();
  const { chapters, status } = useSyllabus();
  const chapterId = params.get('chapter');
  const chapter = chapters.find((item) => item.id === chapterId);

  return (
    <div className="study-panel space-y-4 p-6">
      <h1 className="page-title">{chapter?.title || 'Topic practice'}</h1>
      {loading || (chapterId && status === 'loading') ? <LoadingIndicator className="page-description" label="Opening study tools…" /> : <>
        {chapter ? <>
          <p className="page-description">Recall the main ideas from this chapter before checking your notes.</p>
          <ul className="list-disc space-y-2 pl-5 text-sm">{chapter.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
        </> : <p className="page-description">Review a topic in the lesson library or practise elimination with worked explanations.</p>}
        <div className="flex flex-wrap gap-3">
          <Link className="primary-button" to={chapter?.path || '/learning'}>{chapter ? 'Open chapter outline' : 'Browse topic lessons'}</Link>
          <Link className="secondary-button" to="/capf-elimination">Practise Paper I</Link>
        </div>
      </>}
    </div>
  );
}

export default function StudyApp() {
  return <StudyPreferencesProvider><SyllabusProvider><App /></SyllabusProvider></StudyPreferencesProvider>;
}

function App() {
  const { chapters: syllabusChapters } = useSyllabus();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname, hash } = location;
  const scrollPage = matchPath('/practice/chapterwise-pyq/*', pathname) ? '/practice/chapterwise-pyq' : pathname;
  const { canUseAi, loading } = useAuth();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [scrollPage, hash]);

  // Question Bank (seeded + dynamic AI generated questions)
  const [savedQuestions, setQuestions] = useState<Question[]>(() => {
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
  const [savedMistakes, setMistakes] = useState<MistakeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('dutydeck_mistakes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
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
  const [savedSolvedIds, setSolvedQuestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dutydeck_solved');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const questions = useMemo(() => savedQuestions.filter(q => q.targetExam?.includes('UPSC_CAPF')), [savedQuestions]);
  const capfIds = useMemo(() => new Set(questions.map(q => q.id)), [questions]);
  const mistakes = useMemo(() => savedMistakes.filter(m => capfIds.has(m.questionId)), [savedMistakes, capfIds]);
  const solvedQuestionIds = useMemo(() => savedSolvedIds.filter(id => capfIds.has(id)), [savedSolvedIds, capfIds]);

  // NCERT & Standard Textbook Academy Chapter Progress
  const [chapterProgress, setChapterProgress] = useState<Record<string, ChapterProgress>>(() => {
    try {
      const saved = localStorage.getItem('dutydeck_chapter_progress');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });
  const [recallProgress, setRecallProgress] = useState(() => {
    try { return parseRecallProgress(localStorage.getItem(RECALL_STORAGE_KEY)); }
    catch { return {}; }
  });
  const [recallStorageError, setRecallStorageError] = useState(false);
  const [reelsProgress, setReelsProgress] = useState(() => {
    try { return parseReelsProgress(localStorage.getItem(REELS_STORAGE_KEY)); }
    catch { return parseReelsProgress(null); }
  });
  const [reelsStorageError, setReelsStorageError] = useState(false);
  const [affairProgress, setAffairProgress] = useState(() => { try { return parseAffairProgress(localStorage.getItem(AFFAIR_PROGRESS_KEY)); } catch { return parseAffairProgress(null); } });
  const [affairStorageError, setAffairStorageError] = useState(false);
  const handleAffairChange = (next: AffairProgress) => {
    setAffairProgress(next);
    try { localStorage.setItem(AFFAIR_PROGRESS_KEY, JSON.stringify(next)); setAffairStorageError(false); } catch { setAffairStorageError(true); }
  };
  const handleReelsChange = (next: ReelsProgress) => {
    setReelsProgress(next);
    try {
      localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(next));
      setReelsStorageError(false);
    } catch { setReelsStorageError(true); }
  };
  const recallCards = useMemo(() => [
    ...buildRecallCards(LEARNING_CHAPTERS, chapterProgress, questions, solvedQuestionIds, mistakes),
    ...syllabusChapters.filter(chapter => chapterProgress[chapter.progressId]?.isCompleted).map(chapter => ({
      id: `syllabus:${chapter.id}`, chapterId: chapter.progressId, topic: chapter.title, subject: chapter.subject,
      prompt: `Explain the main ideas in ${chapter.title} from memory.`, statements: [], options: [],
      answer: 'Compare your recall with the chapter checklist.',
      explanation: chapter.topics.join(' ? '), source: 'CAPF syllabus', isMistake: false,
    })),
    ...buildReelRecallCards(reelsProgress),
    ...affairProgress.cards,
  ], [chapterProgress, questions, solvedQuestionIds, mistakes, reelsProgress, affairProgress, syllabusChapters]);

  const handleRecallReview = (id: string, rating: RecallRating): boolean => {
    const now = Date.now();
    if (!recallCards.some(card => card.id === id) || recallProgress[id]?.dueAt > now) return false;
    const next = { ...recallProgress, [id]: scheduleRecall(recallProgress[id], rating, now) };
    try {
      localStorage.setItem(RECALL_STORAGE_KEY, JSON.stringify(next));
      setRecallProgress(next);
      setRecallStorageError(false);
      return true;
    } catch {
      setRecallStorageError(true);
      return false;
    }
  };

  const handleQuestionAttempted = useCallback((questionId: string) => {
    setSolvedQuestionIds(previous => previous.includes(questionId) ? previous : [...previous, questionId]);
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dutydeck_questions', JSON.stringify(savedQuestions));
      localStorage.setItem('dutydeck_mistakes', JSON.stringify(savedMistakes));
      localStorage.setItem('dutydeck_solved', JSON.stringify(savedSolvedIds));
      localStorage.setItem('dutydeck_chapter_progress', JSON.stringify(chapterProgress));
    } catch (e) {}
  }, [savedQuestions, savedMistakes, savedSolvedIds, chapterProgress]);

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
    const next = [submission, ...submissions];
    try {
      localStorage.setItem('dutydeck_submissions', JSON.stringify(next));
      setSubmissions(next);
      return true;
    } catch {
      return false;
    }
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
    navigate('/ai-tutor', { state: { title, subject, standardRef } });
  };

  // Handler: Toggle Chapter Completion
  const handleToggleChapterCompleted = (chapterId: string) => {
    setChapterProgress((prev) => {
      const current = prev[chapterId];
      const isNowCompleted = !current?.isCompleted;
      return {
        ...prev,
        [chapterId]: {
          ...current,
          chapterId,
          isCompleted: isNowCompleted,
          completedAt: isNowCompleted ? Date.now() : undefined,
        },
      };
    });
  };

  const [reviewNow, setReviewNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setReviewNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const dueCount = getDueRecallCards(recallCards, recallProgress, Math.max(reviewNow, Date.now())).length;
  const reviewedToday = recallCards.filter(card => recallProgress[card.id] && new Date(recallProgress[card.id].lastReviewedAt).toDateString() === new Date().toDateString()).length;
  const saveChapterNotes = (id: string, notes: string): boolean => {
    const next = { ...chapterProgress, [id]: { ...chapterProgress[id], chapterId: id, isCompleted: chapterProgress[id]?.isCompleted || false, notes } };
    try { localStorage.setItem('dutydeck_chapter_progress', JSON.stringify(next)); }
    catch { return false; }
    setChapterProgress(next);
    return true;
  };
  const selectTopicForAi = canUseAi ? handleSelectTopicForAi : undefined;
  const learningPage = <LearningHub progressMap={chapterProgress} onToggleChapterCompleted={handleToggleChapterCompleted} onSelectTopicForAi={selectTopicForAi} onSaveNotes={saveChapterNotes} />;

  return (
    <Routes>

      <Route element={<StudyLayout />}>
        <Route
          path="dashboard"
          element={
            <OverviewDashboard chapterProgress={chapterProgress} dueCount={dueCount} reviewedToday={reviewedToday} questions={questions} mistakes={mistakes} solvedQuestionIds={solvedQuestionIds} />
          }
        />
        <Route path="practice" element={<PracticeHome />} />
        <Route path="practice/capf-analytica" element={<CapfAnalytica />} />
        <Route path="practice/chapterwise-pyq/:subjectId?/:chapterId?" element={
          <Suspense fallback={<LoadingIndicator label="Loading chapterwise questions…" />}><ChapterwisePyq /></Suspense>
        } />
        <Route path="current-affairs" element={<CurrentAffairs progress={affairProgress} onChange={handleAffairChange} storageError={affairStorageError} />} />
        <Route path="capf-syllabus" element={<CapfSyllabus questions={questions} mistakes={mistakes} solvedQuestionIds={solvedQuestionIds} progressMap={chapterProgress} />} />
        <Route path="calculation-coach" element={<CalculationCoach />} />
        <Route path="reels" element={<LearnReels progress={reelsProgress} onChange={handleReelsChange} storageError={reelsStorageError} />} />
        <Route path="reels/:courseId/:chapterNumber" element={<LearnReels progress={reelsProgress} onChange={handleReelsChange} storageError={reelsStorageError} />} />
        <Route path="books" element={<BooksLibrary />} />
        <Route path="books/:bookCode" element={<BooksLibrary />} />
        <Route path="books/:bookCode/:chapterNumber" element={<BooksLibrary />} />
        <Route path="revision" element={<RevisionHome dueCount={dueCount} mistakeCount={mistakes.length} reviewedToday={reviewedToday} />} />
        <Route path="learning" element={learningPage} />
        <Route path="daily-review" element={<DailyReview cards={recallCards} progress={recallProgress} onReview={handleRecallReview} storageError={recallStorageError} />} />
        <Route path="learning/:chapterId" element={learningPage} />
        
        {/* Dedicated Direct-Access NCERT Routes (Class / Subject / Chapter URL accessible on refresh) */}
        <Route path="ncert" element={<NcertExplorer onSelectTopicForAi={selectTopicForAi} />} />
        <Route path="ncert/:grade/:subject/:chapterNumber" element={<NcertExplorer onSelectTopicForAi={selectTopicForAi} />} />
        <Route path="ncert/:bookCode/:chapterNumber" element={<NcertExplorer onSelectTopicForAi={selectTopicForAi} />} />
        <Route path="learning/ncert/:grade/:subject/:chapterNumber" element={<NcertExplorer onSelectTopicForAi={selectTopicForAi} />} />
        <Route path="cpo-speed" element={<Navigate to="/practice" replace />} />
        <Route
          path="capf-elimination"
          element={
            <CapfEliminationMode
              questions={questions}
              onSaveMistake={handleSaveMistake}
              onQuestionAttempted={handleQuestionAttempted}
              onSelectTopicForAi={selectTopicForAi}
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
            canUseAi ? <AiTopicBreakdown
              initialTopic={location.state?.title}
              initialSubject={location.state?.subject}
              initialRef={location.state?.standardRef}
              mistakes={mistakes}
              solvedQuestionIds={solvedQuestionIds}
              allQuestions={questions}
              onSaveMistake={handleSaveMistake}
              onQuestionAttempted={handleQuestionAttempted}
              onAddQuestionsToBank={handleAddQuestionsToBank}
            /> : <PublicTopicPractice loading={loading} />
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
              onSelectTopicForAi={selectTopicForAi}
            />
          }
        />
        <Route
          path="analytics"
          element={
            <ProgressPage chapterProgress={chapterProgress} questions={questions} mistakes={mistakes} submissions={submissions} solvedQuestionIds={solvedQuestionIds} reviewedToday={reviewedToday} />
          }
        />
        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
