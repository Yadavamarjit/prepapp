import { apiFetch } from '../lib/api';
import React, { useState } from 'react';
import { 
  Archive, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  BookMarked, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Brain,
  Trash2,
  Calendar
} from 'lucide-react';
import { Question, MistakeRecord, MistakeReason } from '../types';
import { filterMistakeRecords, getMistakeTaxonomyBreakdown, calculateNextSrsDate, MistakeVaultFilter } from '../utils/srsVault';

interface MistakeVaultProps {
  mistakes: MistakeRecord[];
  questions: Question[];
  onUpdateMistakeReview: (mistakeId: string, isCorrectNow: boolean) => void;
  onClearMistake: (mistakeId: string) => void;
  onSelectTopicForAi?: (topicTitle: string, subject: string, standardRef: string) => void;
}

interface DiagnosisResult {
  trapAnalysis: string;
  preventionRule: string;
  recommendedRevisionNote: string;
}

export const MistakeVault: React.FC<MistakeVaultProps> = ({
  mistakes,
  questions,
  onUpdateMistakeReview,
  onClearMistake,
  onSelectTopicForAi,
}) => {
  const [activeFilter, setActiveFilter] = useState<MistakeVaultFilter>('ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  
  // Re-attempt state
  const [reattemptAnswers, setReattemptAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [reattemptSubmitted, setReattemptSubmitted] = useState<Record<string, boolean>>({});

  // AI Diagnostic state
  const [diagnosingId, setDiagnosingId] = useState<string | null>(null);
  const [diagnoses, setDiagnoses] = useState<Record<string, DiagnosisResult>>({});

  const filteredByReason = filterMistakeRecords(mistakes, activeFilter);
  const taxonomy = getMistakeTaxonomyBreakdown(mistakes);

  const displayedRecords = filteredByReason.filter((m) => {
    if (selectedSubjectFilter === 'ALL') return true;
    const q = questions.find((item) => item.id === m.questionId);
    return q?.subject === selectedSubjectFilter;
  });

  const handleSelectReattempt = (recordId: string, key: 'A' | 'B' | 'C' | 'D') => {
    setReattemptAnswers((prev) => ({ ...prev, [recordId]: key }));
  };

  const handleVerifyReattempt = (record: MistakeRecord, question: Question) => {
    const chosen = reattemptAnswers[record.id];
    if (!chosen) return;
    setReattemptSubmitted((prev) => ({ ...prev, [record.id]: true }));
    const isCorrect = chosen === question.correctAnswer;
    onUpdateMistakeReview(record.id, isCorrect);
  };

  const handleDiagnoseMistake = async (record: MistakeRecord, question: Question) => {
    setDiagnosingId(record.id);

    try {
      const res = await apiFetch('/api/ai/diagnose-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          selectedAnswer: record.selectedAnswer,
          reason: record.reason || 'Conceptual Gap',
        }),
      });

      const data = await res.json();
      if (data.success && data.diagnosis) {
        setDiagnoses((prev) => ({ ...prev, [record.id]: data.diagnosis }));
      }
    } catch (e) {
      console.error('Diagnosis failed', e);
    } finally {
      setDiagnosingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-6 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FBEAE8] text-[#C25345] flex items-center justify-center font-bold">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-[#1E252B] dark:text-white font-sans">
                Your mistakes
              </h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#C25345] text-white">
                Error Log
              </span>
            </div>
            <p className="text-xs text-[#5C646B] dark:text-slate-400 mt-0.5">
              Revisit difficult questions, understand the explanation, and try again.
            </p>
          </div>
        </div>

        {/* Taxonomy Quick Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] text-xs">
            <span className="text-[#5C646B]">Conceptual: </span>
            <strong className="text-[#36624B]">{taxonomy.conceptual}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] text-xs">
            <span className="text-[#5C646B]">Misread: </span>
            <strong className="text-[#8C7837]">{taxonomy.misread}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] text-xs">
            <span className="text-[#5C646B]">Panic/Time: </span>
            <strong className="text-[#D97746]">{taxonomy.timePanic}</strong>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Revision Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {[
            { id: 'ALL' as MistakeVaultFilter, label: `All Mistakes (${mistakes.length})` },
            { id: 'DUE_FOR_REVIEW' as MistakeVaultFilter, label: 'Due for review' },
            { id: 'CONCEPTUAL_GAP' as MistakeVaultFilter, label: 'Conceptual Gaps Only' },
            { id: 'REPEAT_MISTAKES' as MistakeVaultFilter, label: 'Missed Twice or More' },
            { id: 'TIME_PANIC' as MistakeVaultFilter, label: 'Calculation / Panic' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeFilter === f.id
                  ? 'bg-[#36624B] text-white shadow-xs'
                  : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#5C646B] hover:text-[#1E252B] border border-[#EEF0EA]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#5C646B]">Subject:</label>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white"
          >
            <option value="ALL">All Subjects</option>
            <option value="Polity & Constitution">Polity & Constitution</option>
            <option value="Modern History">Modern History</option>
            <option value="Quantitative Aptitude">Quantitative Aptitude</option>
            <option value="Reasoning & Intelligence">Reasoning & Intelligence</option>
            <option value="Geography & Environment">Geography & Environment</option>
            <option value="General Science">General Science</option>
            <option value="English Comprehension">English Comprehension</option>
          </select>
        </div>
      </div>

      {/* Mistake Items Feed */}
      {displayedRecords.length > 0 ? (
        <div className="space-y-4">
          {displayedRecords.map((record) => {
            const question = questions.find((q) => q.id === record.questionId);
            if (!question) return null;

            const isDueNow = record.nextReviewDate <= Date.now();
            const reattemptChoice = reattemptAnswers[record.id];
            const isReattempted = reattemptSubmitted[record.id];
            const isReattemptCorrect = isReattempted && reattemptChoice === question.correctAnswer;
            const diagnosis = diagnoses[record.id];

            return (
              <div
                key={record.id}
                className={`bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl border p-5 sm:p-6 shadow-sm space-y-4 transition-all ${
                  isDueNow 
                    ? 'border-[#D97746]/60 dark:border-[#D97746]/40' 
                    : 'border-[#E2E6DD] dark:border-slate-800'
                }`}
              >
                {/* Header Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EEF0EA] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FBEAE8] text-[#C25345]">
                      {record.reason || 'Conceptual Gap'}
                    </span>
                    <span className="text-xs font-semibold text-[#1E252B] dark:text-white">
                      {question.subject}
                    </span>
                    <span className="text-xs text-[#5C646B]">
                      &bull; {question.microTopic}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-[#5C646B]">
                      <Calendar className="w-3.5 h-3.5 text-[#36624B]" />
                      <span>SRS Review #{record.reviewCount + 1}</span>
                      {isDueNow && (
                        <span className="font-bold text-[#D97746] bg-[#D97746]/10 px-1.5 py-0.2 rounded ml-1">
                          Due Today
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onClearMistake(record.id)}
                      className="text-[#8B949E] hover:text-[#C25345] transition-colors"
                      title="Remove from mistakes"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Stem */}
                <p className="text-sm font-medium font-serif leading-relaxed text-[#1E252B] dark:text-white">
                  {question.questionText}
                </p>

                {/* Statements (if UPSC) */}
                {question.statements && question.statements.length > 0 && (
                  <div className="space-y-1.5 pl-4 border-l-2 border-[#36624B]/30 my-2 bg-[#F7F8F5] dark:bg-[#121816] p-3 rounded-r-lg">
                    {question.statements.map((stmt, idx) => (
                      <div key={idx} className="text-xs text-[#1E252B] dark:text-slate-200">
                        <strong className="text-[#36624B] mr-2">{idx + 1}.</strong>
                        {stmt}
                      </div>
                    ))}
                  </div>
                )}

                {/* Re-attempt Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {question.options.map((opt) => {
                    const isSelected = reattemptChoice === opt.key;
                    const wasInitialWrongChoice = record.selectedAnswer === opt.key;
                    const optIsCorrect = isReattempted && question.correctAnswer === opt.key;

                    let optCls = 'border-[#E2E6DD] dark:border-slate-800 bg-[#FFFFFF] dark:bg-[#121816]';

                    if (isSelected && !isReattempted) {
                      optCls = 'border-[#36624B] ring-1 ring-[#36624B] bg-[#E3EFE8]/30';
                    } else if (optIsCorrect) {
                      optCls = 'border-[#2E7D5B] bg-[#E6F4EA] text-[#2E7D5B] font-bold';
                    }

                    return (
                      <div
                        key={opt.key}
                        onClick={() => !isReattempted && handleSelectReattempt(record.id, opt.key)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${optCls}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold w-5 h-5 rounded flex items-center justify-center bg-[#EEF0EA] dark:bg-slate-800">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {wasInitialWrongChoice && !isReattempted && (
                          <span className="text-[10px] text-[#C25345] italic">
                            Initial Pick
                          </span>
                        )}
                        {optIsCorrect && <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />}
                      </div>
                    );
                  })}
                </div>

                {/* Actions: Re-test & AI Diagnosis */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {!isReattempted ? (
                      <button
                        onClick={() => handleVerifyReattempt(record, question)}
                        disabled={!reattemptChoice}
                        className="px-4 py-1.5 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-test & Advance SRS</span>
                      </button>
                    ) : (
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${
                        isReattemptCorrect ? 'text-[#2E7D5B]' : 'text-[#C25345]'
                      }`}>
                        {isReattemptCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Solved! Next review scheduled in 7 days.</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Still incorrect. Review reset to 1-day interval.</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDiagnoseMistake(record, question)}
                      disabled={diagnosingId === record.id}
                      className="px-3 py-1.5 rounded-lg border border-[#36624B]/30 hover:bg-[#E3EFE8]/50 text-[#36624B] dark:text-[#88D4A8] text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>{diagnosingId === record.id ? 'Diagnosing...' : 'AI Mistake Diagnosis'}</span>
                    </button>

                    {onSelectTopicForAi && (
                      <button
                        onClick={() => onSelectTopicForAi(question.microTopic, question.subject, question.explanation.standardBookRef || '')}
                        className="text-xs font-semibold text-[#2F7C7E] hover:underline"
                      >
                        Teach Topic
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Psychological Trap Diagnosis Card */}
                {diagnosis && (
                  <div className="p-4 rounded-xl bg-[#F7F8F5] dark:bg-[#121816] border border-[#36624B]/30 space-y-2 text-xs animate-fade-in">
                    <div className="font-bold text-[#36624B] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Psychological Distractor Diagnostic:
                    </div>
                    <p className="text-[#1E252B] dark:text-slate-200 leading-relaxed font-sans">
                      <strong>Why you picked this distractor: </strong>
                      {diagnosis.trapAnalysis}
                    </p>
                    <div className="p-2.5 rounded bg-[#E3EFE8]/60 dark:bg-[#1A2E24] text-[#1E252B] dark:text-slate-100 font-semibold">
                      1-Minute Prevention Rule: {diagnosis.preventionRule}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl border border-[#E2E6DD] dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E6F4EA] text-[#2E7D5B] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#1E252B] dark:text-white">
            No mistakes to review
          </h3>
          <p className="text-xs text-[#5C646B] max-w-md mx-auto">
            No questions match your current filter. Keep practicing CPO Speed drills or CAPF Elimination sets to build your error taxonomy log.
          </p>
        </div>
      )}
    </div>
  );
};
