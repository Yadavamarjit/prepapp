import React, { useState } from 'react';
import { 
  CheckSquare, 
  Trash2, 
  BookMarked, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { Question, MistakeReason } from '../types';
import { deduceEliminableOptions, checkSingleRemainingOption } from '../utils/elimination';

interface CapfEliminationModeProps {
  questions: Question[];
  onQuestionAttempted?: (questionId: string) => void;
  onSaveMistake: (questionId: string, selected: 'A' | 'B' | 'C' | 'D', reason: MistakeReason, timeSpent: number) => void;
  onSelectTopicForAi?: (topicTitle: string, subject: string, standardRef: string) => void;
}

export const CapfEliminationMode: React.FC<CapfEliminationModeProps> = ({
  questions,
  onSaveMistake,
  onQuestionAttempted,
  onSelectTopicForAi,
}) => {
  // Focus on UPSC CAPF multi-statement or analytical questions
  const capfQuestions = questions.filter(
    (q) => q.targetExam.includes('UPSC_CAPF') || q.type === 'STATEMENT_BASED'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  
  // Scratchpad state per question
  // Statement indices eliminated (e.g. 1, 2, 3)
  const [eliminatedStatements, setEliminatedStatements] = useState<Record<string, number[]>>({});
  // Option keys eliminated manually (e.g. ['A', 'C'])
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, string[]>>({});
  
  const [isRevealed, setIsRevealed] = useState<Record<string, boolean>>({});
  const [loggedMistakes, setLoggedMistakes] = useState<Record<string, MistakeReason>>({});

  const currentQ = capfQuestions[currentIndex];
  const qId = currentQ?.id || '';

  const activeEliminatedStatements = eliminatedStatements[qId] || [];
  const activeEliminatedOptions = eliminatedOptions[qId] || [];
  const userSelected = selectedAnswers[qId];
  const hasRevealed = isRevealed[qId] || false;

  // Auto-deduce eliminable options based on eliminated statements
  const suggestedEliminableOptions = currentQ?.statements
    ? deduceEliminableOptions(activeEliminatedStatements, currentQ.options, true)
    : [];

  const allEliminatedOptionKeys = Array.from(
    new Set([...activeEliminatedOptions, ...suggestedEliminableOptions])
  );

  const singleRemainingOption = checkSingleRemainingOption(
    currentQ ? currentQ.options.map((o) => o.key) : [],
    allEliminatedOptionKeys
  );

  const toggleStatementElimination = (stmtIndex: number) => {
    if (hasRevealed) return;
    setEliminatedStatements((prev) => {
      const existing = prev[qId] || [];
      const updated = existing.includes(stmtIndex)
        ? existing.filter((idx) => idx !== stmtIndex)
        : [...existing, stmtIndex];
      return { ...prev, [qId]: updated };
    });
  };

  const toggleOptionElimination = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasRevealed) return;
    setEliminatedOptions((prev) => {
      const existing = prev[qId] || [];
      const updated = existing.includes(key)
        ? existing.filter((k) => k !== key)
        : [...existing, key];
      return { ...prev, [qId]: updated };
    });
  };

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (hasRevealed) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: key }));
  };

  const handleRevealAnswer = () => {
    if (userSelected) onQuestionAttempted?.(qId);
    setIsRevealed((prev) => ({ ...prev, [qId]: true }));
  };

  const handleClearScratchpad = () => {
    setEliminatedStatements((prev) => ({ ...prev, [qId]: [] }));
    setEliminatedOptions((prev) => ({ ...prev, [qId]: [] }));
  };

  const handleLogReason = (reason: MistakeReason) => {
    if (!userSelected) return;
    onSaveMistake(qId, userSelected, reason, 60);
    setLoggedMistakes((prev) => ({ ...prev, [qId]: reason }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-5 rounded-xl border border-[#E2E6DD] dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E3EFE8] text-[#36624B] dark:bg-[#1A2E24] dark:text-[#88D4A8] flex items-center justify-center font-bold">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-[#1E252B] dark:text-white font-sans">
                CAPF practice
              </h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#36624B] text-white">
                Multi-Statement Scratchpad
              </span>
            </div>
            <p className="text-xs text-[#5C646B] dark:text-slate-400">
              Interactive elimination drill. Click statements to strike them out and auto-filter options.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearScratchpad}
            className="px-3 py-1.5 rounded-lg border border-[#E2E6DD] dark:border-slate-700 text-xs font-semibold text-[#5C646B] dark:text-slate-300 hover:bg-[#F2F4F0] flex items-center gap-1.5"
            title="Clear strikethroughs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Scratchpad</span>
          </button>
        </div>
      </div>

      {/* Question Card */}
      {currentQ ? (
        <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl p-6 sm:p-8 border border-[#E2E6DD] dark:border-slate-800 shadow-sm space-y-6">
          
          {/* Metadata & Book Citation */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#EEF0EA] dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#36624B] dark:text-[#88D4A8] bg-[#E3EFE8] dark:bg-[#1A2E24] px-2.5 py-1 rounded">
                Question {currentIndex + 1} of {capfQuestions.length}
              </span>
              <span className="text-xs font-semibold text-[#1E252B] dark:text-white">
                {currentQ.subject}
              </span>
              <span className="text-xs text-[#5C646B] dark:text-slate-400">
                &bull; {currentQ.microTopic}
              </span>
              {currentQ.statements && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E3EFE8] text-[#36624B] dark:bg-[#1A2E24] dark:text-[#88D4A8]">
                  {currentQ.statements.length} Statements
                </span>
              )}
            </div>

            {currentQ.explanation.standardBookRef && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#2F7C7E] bg-[#2F7C7E]/10 px-2.5 py-1 rounded-full border border-[#2F7C7E]/20">
                <BookMarked className="w-3.5 h-3.5" />
                <span>{currentQ.explanation.standardBookRef}</span>
              </div>
            )}
          </div>

          {/* Question Text */}
          <p className="text-base text-[#1E252B] dark:text-white font-medium font-serif leading-relaxed">
            {currentQ.questionText}
          </p>

          {/* Multi-Statement Scratchpad (1, 2, 3 statements) */}
          {currentQ.statements && currentQ.statements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#36624B]" />
                  Elimination Scratchpad (Click statement to cross out as FALSE):
                </span>
                {activeEliminatedStatements.length > 0 && (
                  <span className="text-xs text-[#C25345] font-semibold">
                    {activeEliminatedStatements.length} statement(s) eliminated
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {currentQ.statements.map((stmt, idx) => {
                  const stmtNumber = idx + 1;
                  const isEliminated = activeEliminatedStatements.includes(stmtNumber);

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStatementElimination(stmtNumber)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isEliminated
                          ? 'bg-[#FBEAE8] dark:bg-[#2E1815] border-[#C25345]/40 opacity-70'
                          : 'bg-[#F7F8F5] dark:bg-[#121816] border-[#EEF0EA] dark:border-slate-800 hover:border-[#36624B]/40'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isEliminated
                          ? 'bg-[#C25345] text-white line-through'
                          : 'bg-[#36624B] text-white'
                      }`}>
                        {stmtNumber}
                      </span>
                      <div className={`text-sm flex-grow ${isEliminated ? 'line-through text-[#C25345] dark:text-red-300' : 'text-[#1E252B] dark:text-slate-200'}`}>
                        {stmt}
                      </div>
                      <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded text-xs flex-shrink-0 border border-current">
                        {isEliminated ? 'Eliminated ✕' : 'Click to strike'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* UPSC Deduction Clue / Breakthrough alert */}
          {singleRemainingOption && (
            <div className="p-3.5 rounded-xl bg-[#E6F4EA] dark:bg-[#1A2E24] border border-[#2E7D5B]/30 flex items-center gap-3 animate-fade-in">
              <Sparkles className="w-5 h-5 text-[#2E7D5B] flex-shrink-0" />
              <div className="text-xs text-[#1E252B] dark:text-white">
                <strong className="text-[#2E7D5B]">UPSC Elimination Breakthrough: </strong>
                By eliminating statement(s) [{activeEliminatedStatements.join(', ')}], only <strong>Option {singleRemainingOption}</strong> remains mathematically viable!
              </div>
            </div>
          )}

          {/* Question Options */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400">
              Select Answer Option:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt) => {
                const isSelected = userSelected === opt.key;
                const isEliminated = allEliminatedOptionKeys.includes(opt.key);
                const isCorrect = hasRevealed && currentQ.correctAnswer === opt.key;
                const isIncorrect = hasRevealed && isSelected && !isCorrect;

                let borderClass = 'border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B]/40';
                let bgClass = 'bg-[#FFFFFF] dark:bg-[#121816]';

                if (isSelected && !hasRevealed) {
                  borderClass = 'border-[#36624B] ring-1 ring-[#36624B]';
                  bgClass = 'bg-[#E3EFE8]/50 dark:bg-[#1A2E24]';
                } else if (isCorrect) {
                  borderClass = 'border-[#2E7D5B] bg-[#E6F4EA] text-[#2E7D5B] font-bold';
                  bgClass = 'bg-[#E6F4EA] dark:bg-[#1A2E24]';
                } else if (isIncorrect) {
                  borderClass = 'border-[#C25345] bg-[#FBEAE8] text-[#C25345] font-bold';
                  bgClass = 'bg-[#FBEAE8] dark:bg-[#2E1815]';
                } else if (isEliminated && !hasRevealed) {
                  bgClass = 'bg-[#F2F4F0] opacity-50';
                }

                return (
                  <div
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`p-3.5 rounded-lg border cursor-pointer flex items-center justify-between gap-3 transition-all ${borderClass} ${bgClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                        isSelected && !hasRevealed
                          ? 'bg-[#36624B] text-white'
                          : isCorrect
                          ? 'bg-[#2E7D5B] text-white'
                          : isIncorrect
                          ? 'bg-[#C25345] text-white'
                          : 'bg-[#EEF0EA] dark:bg-slate-800 text-[#5C646B]'
                      }`}>
                        {opt.key}
                      </span>
                      <span className={`text-sm ${isEliminated && !hasRevealed ? 'line-through text-[#8B949E]' : 'text-[#1E252B] dark:text-white'}`}>
                        {opt.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!hasRevealed && (
                        <button
                          type="button"
                          onClick={(e) => toggleOptionElimination(opt.key, e)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isEliminated
                              ? 'bg-[#C25345] text-white border-[#C25345]'
                              : 'text-[#8B949E] border-[#E2E6DD] hover:bg-[#EEF0EA]'
                          }`}
                          title="Strike out option"
                        >
                          {isEliminated ? '✕ Eliminated' : '✕ Strike'}
                        </button>
                      )}
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-[#2E7D5B]" />}
                      {isIncorrect && <XCircle className="w-5 h-5 text-[#C25345]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row: Check Answer or Next */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#EEF0EA] dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
                }}
                disabled={currentIndex === 0}
                className="px-3.5 py-1.5 rounded-lg border border-[#E2E6DD] text-xs font-semibold text-[#5C646B] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Question</span>
              </button>
              <button
                onClick={() => {
                  if (currentIndex < capfQuestions.length - 1) setCurrentIndex((prev) => prev + 1);
                }}
                disabled={currentIndex === capfQuestions.length - 1}
                className="px-3.5 py-1.5 rounded-lg border border-[#E2E6DD] text-xs font-semibold text-[#5C646B] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!hasRevealed ? (
              <button
                onClick={handleRevealAnswer}
                disabled={!userSelected}
                className="px-5 py-2 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Verify & Reveal Elimination Clues
              </button>
            ) : (
              <span className="text-xs font-bold text-[#2E7D5B] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Solution Active</span>
              </span>
            )}
          </div>

          {/* Revealed Deep Analytical Solution */}
          {hasRevealed && (
            <div className="mt-6 p-5 rounded-xl bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#EEF0EA] dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-[#36624B] dark:text-[#88D4A8]">
                  Answer & explanation
                </span>
                <span className="text-xs font-mono font-semibold text-[#1E252B] dark:text-white">
                  Correct Answer: Option {currentQ.correctAnswer}
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#1E252B] dark:text-slate-300 leading-relaxed font-sans">
                <p>
                  <strong className="text-[#36624B] dark:text-[#88D4A8]">Core Concept: </strong>
                  {currentQ.explanation.coreConcept}
                </p>

                {currentQ.explanation.shortcutOrTrick && (
                  <div className="p-3 rounded-lg bg-[#E3EFE8]/70 dark:bg-[#1A2E24] border border-[#36624B]/20">
                    <strong className="text-[#36624B] dark:text-[#88D4A8]">Elimination Strategy: </strong>
                    {currentQ.explanation.shortcutOrTrick}
                  </div>
                )}

                {currentQ.explanation.trapAlert && (
                  <div className="p-3 rounded-lg bg-[#FBEAE8] dark:bg-[#2E1815] border border-[#C25345]/20 text-[#C25345] dark:text-red-300">
                    <strong>Examiner Distractor Trap: </strong>
                    {currentQ.explanation.trapAlert}
                  </div>
                )}
              </div>

              {/* Log Mistake Reason */}
              {userSelected !== currentQ.correctAnswer && (
                <div className="pt-3 border-t border-[#EEF0EA] dark:border-slate-800">
                  <div className="text-xs font-semibold text-[#1E252B] dark:text-white mb-2">
                    What went wrong? Save it for revision:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['Conceptual Gap', 'Misread Question', 'Calculation/Time Panic'] as MistakeReason[]).map((r) => {
                      const isLogged = loggedMistakes[qId] === r;
                      return (
                        <button
                          key={r}
                          onClick={() => handleLogReason(r)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            isLogged
                              ? 'bg-[#36624B] text-white border-[#36624B] font-semibold'
                              : 'bg-[#FFFFFF] dark:bg-[#1A2420] text-[#5C646B] border-[#E2E6DD] hover:bg-[#EEF0EA]'
                          }`}
                        >
                          {isLogged ? `Saved: ${r}` : r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Deep Breakdown Trigger */}
              {onSelectTopicForAi && (
                <button
                  onClick={() => onSelectTopicForAi(currentQ.microTopic, currentQ.subject, currentQ.explanation.standardBookRef || '')}
                  className="text-xs font-semibold text-[#36624B] dark:text-[#88D4A8] hover:underline flex items-center gap-1.5 pt-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Tutor: Break down "{currentQ.microTopic}" in easy mode</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-xl border">No UPSC questions loaded.</div>
      )}
    </div>
  );
};
