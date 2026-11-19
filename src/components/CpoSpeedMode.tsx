import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  BookmarkCheck, 
  Award,
  Sparkles,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, MistakeReason } from '../types';
import { calculateCbtScore, formatTimer, isSpeedWarning } from '../utils/cbtEngine';

interface CpoSpeedModeProps {
  questions: Question[];
  onQuestionAttempted?: (questionId: string) => void;
  onSaveMistake: (questionId: string, selected: 'A' | 'B' | 'C' | 'D', reason: MistakeReason, timeSpent: number) => void;
  onSelectTopicForAi?: (topicTitle: string, subject: string, standardRef: string) => void;
}

export const CpoSpeedMode: React.FC<CpoSpeedModeProps> = ({
  questions,
  onSaveMistake,
  onQuestionAttempted,
  onSelectTopicForAi,
}) => {
  // Filter for CPO Speed relevant questions (Quant, Reasoning, English, Speed difficulty)
  const cpoQuestions = questions.filter(
    (q) => q.targetExam.includes('SSC_CPO') || q.difficulty === 'Speed'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | undefined>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  
  // Sectional Timer: 15 minutes (900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeQuestionTimer, setActiveQuestionTimer] = useState(0);
  const [loggedMistakes, setLoggedMistakes] = useState<Record<string, MistakeReason>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentQ = cpoQuestions[currentIndex];

  // 15-Minute Sectional Countdown
  useEffect(() => {
    if (isSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });

      // Track individual active question time
      setActiveQuestionTimer((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, currentIndex]);

  useEffect(() => {
    if (!isSubmitted) return;
    Object.entries(answers).forEach(([id, answer]) => {
      if (answer) onQuestionAttempted?.(id);
    });
  }, [isSubmitted, answers, onQuestionAttempted]);

  // Save time spent on question when navigating
  const recordCurrentQuestionTime = () => {
    if (!currentQ) return;
    setQuestionTimes((prev) => ({
      ...prev,
      [currentQ.id]: (prev[currentQ.id] || 0) + activeQuestionTimer,
    }));
    setActiveQuestionTimer(0);
  };

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted || !currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: prev[currentQ.id] === key ? undefined : key,
    }));
  };

  const handleNext = () => {
    recordCurrentQuestionTime();
    if (currentIndex < cpoQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    recordCurrentQuestionTime();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    recordCurrentQuestionTime();
    setCurrentIndex(index);
  };

  const handleToggleReview = () => {
    if (!currentQ) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const handleAutoSubmit = () => {
    recordCurrentQuestionTime();
    setIsSubmitted(true);
    try {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
    } catch (e) {
      // non-critical
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setQuestionTimes({});
    setMarkedForReview({});
    setTimeLeft(900);
    setIsSubmitted(false);
    setCurrentIndex(0);
    setActiveQuestionTimer(0);
    setLoggedMistakes({});
  };

  const handleLogReason = (questionId: string, reason: MistakeReason) => {
    const selected = answers[questionId];
    if (!selected) return;
    const timeSpent = questionTimes[questionId] || 30;
    onSaveMistake(questionId, selected, reason, timeSpent);
    setLoggedMistakes((prev) => ({ ...prev, [questionId]: reason }));
  };

  const scoreSummary = calculateCbtScore(cpoQuestions, answers, questionTimes, 'SSC_CPO');
  const currentTimeSpent = (questionTimes[currentQ?.id] || 0) + activeQuestionTimer;
  const isSpeedExceeded = isSpeedWarning(currentTimeSpent);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Sectional CBT Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 sticky top-[88px] z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D97746]/10 text-[#D97746] flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#1E252B] dark:text-white">
                CPO timed test
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#EEF0EA] dark:bg-slate-800 text-[#5C646B] dark:text-slate-300">
                15 minutes
              </span>
            </div>
            <div className="text-xs text-[#5C646B] dark:text-slate-400">
              Marking: +1.00 Correct | -0.25 Incorrect (Speed Alert: &gt;45s)
            </div>
          </div>
        </div>

        {/* Sectional Timer Display */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
            timeLeft < 180 
              ? 'bg-[#FBEAE8] text-[#C25345] border border-[#C25345]/30 animate-pulse' 
              : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white border border-[#E2E6DD] dark:border-slate-800'
          }`}>
            <Timer className="w-4 h-4 text-[#D97746]" />
            <span>{formatTimer(timeLeft)}</span>
            <span className="text-[10px] font-sans font-normal text-[#5C646B] dark:text-slate-400">Remaining</span>
          </div>

          {!isSubmitted ? (
            <button
              onClick={handleAutoSubmit}
              className="px-4 py-2 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold shadow-sm transition-all"
            >
              Submit Section
            </button>
          ) : (
            <button
              onClick={handleRestart}
              className="px-4 py-2 rounded-lg bg-[#F7F8F5] dark:bg-slate-800 hover:bg-[#EEF0EA] text-[#1E252B] dark:text-white text-xs font-semibold border border-[#E2E6DD] dark:border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Drill</span>
            </button>
          )}
        </div>
      </div>

      {/* Main CBT Layout: Question Area + Question Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left 3 Cols: Active Question & Answer Screen */}
        <div className="lg:col-span-3 space-y-4">
          {currentQ ? (
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl p-6 border border-[#E2E6DD] dark:border-slate-800 shadow-sm">
              
              {/* Question Header Metadata */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EEF0EA] dark:border-slate-800 mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#36624B] dark:text-[#88D4A8] bg-[#E3EFE8] dark:bg-[#1A2E24] px-2.5 py-1 rounded">
                    Q {currentIndex + 1} of {cpoQuestions.length}
                  </span>
                  <span className="text-xs font-semibold text-[#5C646B] dark:text-slate-400">
                    {currentQ.subject} &bull; {currentQ.microTopic}
                  </span>
                </div>

                {/* Question Speed Clock & Warning Indicator */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded font-mono ${
                    isSpeedExceeded 
                      ? 'bg-[#FBEAE8] text-[#C25345] font-semibold border border-[#C25345]/20' 
                      : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#5C646B] dark:text-slate-300'
                  }`}>
                    {isSpeedExceeded && <AlertTriangle className="w-3.5 h-3.5 text-[#C25345]" />}
                    <span>{currentTimeSpent}s</span>
                    {isSpeedExceeded && <span className="text-[10px]">&gt;45s Target</span>}
                  </div>

                  {!isSubmitted && (
                    <button
                      onClick={handleToggleReview}
                      className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1 transition-all ${
                        markedForReview[currentQ.id]
                          ? 'bg-[#8C7837]/15 text-[#8C7837] border-[#8C7837]/30 font-semibold'
                          : 'text-[#5C646B] dark:text-slate-400 border-[#E2E6DD] dark:border-slate-700 hover:bg-[#F2F4F0]'
                      }`}
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>{markedForReview[currentQ.id] ? 'Marked' : 'Mark for Review'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Question Stem Text */}
              <div className="space-y-4 mb-6">
                <p className="text-base font-medium text-[#1E252B] dark:text-white leading-relaxed whitespace-pre-line font-serif">
                  {currentQ.questionText}
                </p>

                {currentQ.statements && currentQ.statements.length > 0 && (
                  <div className="space-y-2 pl-4 border-l-2 border-[#36624B]/30 my-4 bg-[#F7F8F5] dark:bg-[#121816] p-3 rounded-r-lg">
                    {currentQ.statements.map((stmt, idx) => (
                      <div key={idx} className="text-sm text-[#1E252B] dark:text-slate-200">
                        <strong className="text-[#36624B] dark:text-[#88D4A8] mr-2">{idx + 1}.</strong>
                        {stmt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-3 mb-6">
                {currentQ.options.map((option) => {
                  const isSelected = answers[currentQ.id] === option.key;
                  const isCorrect = isSubmitted && currentQ.correctAnswer === option.key;
                  const isIncorrect = isSubmitted && isSelected && !isCorrect;

                  let borderClass = 'border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/40';
                  let bgClass = 'bg-[#FFFFFF] dark:bg-[#121816]';
                  let textClass = 'text-[#1E252B] dark:text-white';

                  if (isSelected && !isSubmitted) {
                    borderClass = 'border-[#36624B] ring-1 ring-[#36624B]';
                    bgClass = 'bg-[#E3EFE8]/40 dark:bg-[#1A2E24]';
                  } else if (isCorrect) {
                    borderClass = 'border-[#2E7D5B] bg-[#E6F4EA] dark:bg-[#1A2E24] text-[#2E7D5B] font-semibold';
                    bgClass = 'bg-[#E6F4EA] dark:bg-[#1A2E24]';
                  } else if (isIncorrect) {
                    borderClass = 'border-[#C25345] bg-[#FBEAE8] dark:bg-[#2E1815] text-[#C25345] font-semibold';
                    bgClass = 'bg-[#FBEAE8] dark:bg-[#2E1815]';
                  }

                  return (
                    <div
                      key={option.key}
                      onClick={() => handleSelectOption(option.key)}
                      className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${borderClass} ${bgClass}`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isSelected && !isSubmitted
                          ? 'bg-[#36624B] text-white'
                          : isCorrect
                          ? 'bg-[#2E7D5B] text-white'
                          : isIncorrect
                          ? 'bg-[#C25345] text-white'
                          : 'bg-[#EEF0EA] dark:bg-slate-800 text-[#5C646B] dark:text-slate-300'
                      }`}>
                        {option.key}
                      </div>
                      <div className={`text-sm ${textClass} flex-grow`}>
                        {option.text}
                      </div>
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-[#2E7D5B] flex-shrink-0" />}
                      {isIncorrect && <XCircle className="w-5 h-5 text-[#C25345] flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Post-Submission Formula & Shortcut Breakdown */}
              {isSubmitted && (
                <div className="mt-6 p-4 rounded-xl bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#36624B] dark:text-[#88D4A8] flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-[#D97746]" />
                      Direct Formula & Shortcut Breakdown
                    </span>
                    {currentQ.yearRef && (
                      <span className="text-[11px] font-mono text-[#5C646B] dark:text-slate-400">
                        {currentQ.yearRef}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#1E252B] dark:text-slate-300 leading-relaxed font-sans">
                    <strong>Core Concept:</strong> {currentQ.explanation.coreConcept}
                  </p>

                  {currentQ.explanation.shortcutOrTrick && (
                    <div className="p-2.5 rounded-lg bg-[#E3EFE8]/70 dark:bg-[#1A2E24] border border-[#36624B]/20 text-xs text-[#1E252B] dark:text-slate-200">
                      <strong className="text-[#36624B] dark:text-[#88D4A8]">30-Second CBT Shortcut: </strong>
                      {currentQ.explanation.shortcutOrTrick}
                    </div>
                  )}

                  {currentQ.explanation.trapAlert && (
                    <div className="p-2.5 rounded-lg bg-[#FBEAE8] dark:bg-[#2E1815] border border-[#C25345]/20 text-xs text-[#C25345] dark:text-red-300">
                      <strong>Examiner Trap Alert: </strong>
                      {currentQ.explanation.trapAlert}
                    </div>
                  )}

                  {/* Mistake Taxonomy Logger (if answered incorrectly or skipped) */}
                  {answers[currentQ.id] !== currentQ.correctAnswer && (
                    <div className="mt-4 pt-3 border-t border-[#EEF0EA] dark:border-slate-800">
                      <div className="text-xs font-semibold text-[#1E252B] dark:text-white mb-2">
                        What went wrong? Save it for revision:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['Conceptual Gap', 'Misread Question', 'Calculation/Time Panic'] as MistakeReason[]).map((r) => {
                          const isLogged = loggedMistakes[currentQ.id] === r;
                          return (
                            <button
                              key={r}
                              onClick={() => handleLogReason(currentQ.id, r)}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                isLogged
                                  ? 'bg-[#36624B] text-white border-[#36624B] font-semibold'
                                  : 'bg-[#FFFFFF] dark:bg-[#1A2420] text-[#5C646B] dark:text-slate-300 border-[#E2E6DD] dark:border-slate-700 hover:bg-[#EEF0EA]'
                              }`}
                            >
                              {isLogged ? `Saved: ${r}` : r}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 1-Click AI Teach Topic */}
                  {onSelectTopicForAi && (
                    <button
                      onClick={() => onSelectTopicForAi(currentQ.microTopic, currentQ.subject, currentQ.explanation.standardBookRef || '')}
                      className="mt-2 text-xs font-semibold text-[#36624B] dark:text-[#88D4A8] hover:underline flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask AI Tutor to break down "{currentQ.microTopic}"</span>
                    </button>
                  )}
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-5 mt-6 border-t border-[#EEF0EA] dark:border-slate-800">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E2E6DD] dark:border-slate-700 text-xs font-semibold text-[#5C646B] dark:text-slate-300 hover:bg-[#F2F4F0] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs text-[#5C646B] dark:text-slate-400">
                  Question {currentIndex + 1} of {cpoQuestions.length}
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === cpoQuestions.length - 1}
                  className="px-4 py-1.5 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border">No CPO speed questions found.</div>
          )}
        </div>

        {/* Right 1 Col: Question Grid & Live Performance Palette */}
        <div className="space-y-4">
          {/* Question Palette Matrix */}
          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C646B] dark:text-slate-400 mb-3">
              CBT Question Matrix
            </h4>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {cpoQuestions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                const isMarked = markedForReview[q.id];
                const isCorrect = isSubmitted && answers[q.id] === q.correctAnswer;
                const isIncorrect = isSubmitted && isAnswered && !isCorrect;

                let cellClass = 'bg-[#F7F8F5] dark:bg-slate-800 text-[#5C646B] dark:text-slate-300 border-[#E2E6DD] dark:border-slate-700';

                if (isCurrent) {
                  cellClass = 'ring-2 ring-[#36624B] font-bold text-[#1E252B] dark:text-white';
                }

                if (isSubmitted) {
                  if (isCorrect) cellClass = 'bg-[#2E7D5B] text-white font-bold border-[#2E7D5B]';
                  else if (isIncorrect) cellClass = 'bg-[#C25345] text-white font-bold border-[#C25345]';
                  else cellClass = 'bg-[#EEF0EA] dark:bg-slate-800 text-[#8B949E] border-[#E2E6DD]';
                } else {
                  if (isMarked) {
                    cellClass = 'bg-[#8C7837] text-white font-bold border-[#8C7837]';
                  } else if (isAnswered) {
                    cellClass = 'bg-[#36624B] text-white font-bold border-[#36624B]';
                  }
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`h-9 rounded-md border text-xs flex items-center justify-center transition-all ${cellClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-[11px] text-[#5C646B] dark:text-slate-400 pt-3 border-t border-[#EEF0EA] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#36624B]"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#8C7837]"></span>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#F7F8F5] dark:bg-slate-800 border border-[#E2E6DD]"></span>
                <span>Unattempted</span>
              </div>
            </div>
          </div>

          {/* Post-Submission Scorecard */}
          {isSubmitted && (
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-4 rounded-xl border border-[#2E7D5B]/30 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-[#2E7D5B] font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Drill Performance</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-[#F7F8F5] dark:bg-[#121816]">
                  <div className="text-xl font-bold font-mono text-[#1E252B] dark:text-white">
                    {scoreSummary.netScore}
                  </div>
                  <div className="text-[10px] text-[#5C646B] dark:text-slate-400">Net Marks (+1 / -0.25)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F7F8F5] dark:bg-[#121816]">
                  <div className="text-xl font-bold font-mono text-[#2E7D5B]">
                    {scoreSummary.accuracyPercent}%
                  </div>
                  <div className="text-[10px] text-[#5C646B] dark:text-slate-400">Accuracy</div>
                </div>
              </div>

              <div className="text-xs space-y-1 text-[#5C646B] dark:text-slate-300 pt-2 border-t border-[#EEF0EA] dark:border-slate-800">
                <div className="flex justify-between">
                  <span>Correct:</span>
                  <span className="font-semibold text-[#2E7D5B]">{scoreSummary.correct}</span>
                </div>
                <div className="flex justify-between">
                  <span>Incorrect:</span>
                  <span className="font-semibold text-[#C25345]">{scoreSummary.incorrect}</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed Overages (&gt;45s):</span>
                  <span className="font-semibold text-[#D97746]">{scoreSummary.speedAlertCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
