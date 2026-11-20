import { Spinner } from './LoadingIndicator';
import { SyllabusOutline } from './SyllabusOutline';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect, useRef } from 'react';
import { 
  PenTool, 
  Timer, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  RotateCcw, 
  Award, 
  AlertTriangle, 
  HelpCircle,
  Clock,
  Split,
  Newspaper,
  BookOpen
} from 'lucide-react';
import { PAPER_2_PROMPTS } from '../data/paper2Prompts';
import { Paper2Prompt, Paper2Submission, Paper2Feedback } from '../types';
import { getScaffoldTemplate, countWords, checkPrecisCompliance, analyzeArgumentSections } from '../utils/paper2Scaffold';
import { formatTimer } from '../utils/cbtEngine';

interface Paper2LabProps {
  onSaveSubmission: (submission: Paper2Submission) => boolean;
  submissions: Paper2Submission[];
}

export const Paper2Lab: React.FC<Paper2LabProps> = ({
  onSaveSubmission,
  submissions,
}) => {
  const { canUseAi } = useAuth();
  const [selectedPromptId, setSelectedPromptId] = useState<string>(PAPER_2_PROMPTS[0].id);
  const activePrompt: Paper2Prompt = PAPER_2_PROMPTS.find((p) => p.id === selectedPromptId) || PAPER_2_PROMPTS[0];
  const draftFor = (prompt: Paper2Prompt) => submissions.find((item) => item.promptId === prompt.id)?.content;

  const [content, setContent] = useState<string>(() =>
    draftFor(activePrompt) ?? getScaffoldTemplate(activePrompt.type, activePrompt.title)
  );
  const [draftStatus, setDraftStatus] = useState('');

  // Timer: defaults to prompt's suggestedMinutes (e.g. 20 min = 1200s)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(activePrompt.suggestedMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // AI Evaluation State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<Paper2Feedback | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // When changing prompt, update template and reset timer
  const handleSelectPrompt = (promptId: string) => {
    const nextPrompt = PAPER_2_PROMPTS.find((p) => p.id === promptId);
    if (!nextPrompt) return;
    setSelectedPromptId(promptId);
    setContent(draftFor(nextPrompt) ?? getScaffoldTemplate(nextPrompt.type, nextPrompt.title));
    setDraftStatus('');
    setSecondsRemaining(nextPrompt.suggestedMinutes * 60);
    setIsTimerRunning(false);
    setTimeSpentSeconds(0);
    setEvaluationFeedback(null);
    setEvalError(null);
  };

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
        setTimeSpentSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const currentWordCount = countWords(content);
  const originalWords = activePrompt.originalPassage ? countWords(activePrompt.originalPassage) : 0;
  const precisStatus = activePrompt.type === 'PRECIS' ? checkPrecisCompliance(originalWords, currentWordCount) : null;
  const argumentSections = activePrompt.type === 'ARGUMENT' ? analyzeArgumentSections(content) : null;

  // Insert Scaffolding
  const handleInsertScaffold = () => {
    setContent(getScaffoldTemplate(activePrompt.type, activePrompt.title));
    setDraftStatus('');
  };

  function saveDraft(feedback?: Paper2Feedback) {
    const saved = onSaveSubmission({
      id: crypto.randomUUID(),
      topicType: activePrompt.type,
      promptId: activePrompt.id,
      promptTitle: activePrompt.title,
      content,
      wordCount: currentWordCount,
      timeSpentSeconds,
      submittedAt: Date.now(),
      aiFeedback: feedback,
    });
    if (saved) {
      setDraftStatus('Draft saved in this browser.');
      setEvalError(null);
    } else {
      setEvalError('Could not save your draft. Keep this tab open and try again.');
    }
  }

  // Run AI Evaluation
  const handleRunEvaluation = async () => {
    if (currentWordCount < 30) {
      setEvalError('Please write at least 30 words before requesting AI grading.');
      return;
    }

    setIsEvaluating(true);
    setEvalError(null);

    try {
      const res = await apiFetch('/api/ai/evaluate-paper2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicType: activePrompt.type,
          prompt: activePrompt.prompt,
          content,
          wordCount: currentWordCount,
          originalPassage: activePrompt.originalPassage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Evaluation failed');
      }

      const feedback: Paper2Feedback = data.feedback;
      setEvaluationFeedback(feedback);

      saveDraft(feedback);
    } catch (err: any) {
      setEvalError(err.message || 'Error communicating with AI evaluator.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-5 rounded-xl border border-[#E2E6DD] dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4B5A8E]/10 text-[#4B5A8E] flex items-center justify-center font-bold">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-[#1E252B] dark:text-white font-sans">
                Writing practice
              </h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#4B5A8E] text-white">
                UPSC Rubric Grader
              </span>
            </div>
            <p className="text-xs text-[#5C646B] dark:text-slate-400">
              Practise arguments, reports, essays, and précis with a timer, a writing outline and a word count.
            </p>
          </div>
        </div>

        {/* Live Timer Controls */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border ${
            secondsRemaining < 120 
              ? 'bg-[#FBEAE8] text-[#C25345] border-[#C25345]/30 animate-pulse' 
              : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white border-[#E2E6DD] dark:border-slate-800'
          }`}>
            <Clock className="w-4 h-4 text-[#4B5A8E]" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isTimerRunning 
                ? 'bg-[#8C7837] text-white hover:bg-[#73632E]' 
                : 'bg-[#36624B] text-white hover:bg-[#2A4F3C]'
            }`}
          >
            {isTimerRunning ? 'Pause Timer' : 'Start Exam Clock'}
          </button>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols): Prompt Selector & Scaffolding Guides */}
        <div className="lg:col-span-4 space-y-4">
          
          <section className="space-y-3" aria-label="Paper II syllabus">
            <h2 className="section-title">Paper II syllabus chapters</h2>
            <SyllabusOutline paper="paper2" />
          </section>

          {/* Prompt Selector */}
          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-sm space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400 block">
              Choose a writing prompt:
            </label>

            <select
              value={selectedPromptId}
              onChange={(e) => handleSelectPrompt(e.target.value)}
              className="w-full text-xs font-medium p-2.5 rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#36624B]"
            >
              {PAPER_2_PROMPTS.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.type}] {p.title}
                </option>
              ))}
            </select>

            {/* Prompt Stem Card */}
            <div className="p-3.5 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#4B5A8E]/10 text-[#4B5A8E]">
                  {activePrompt.type}
                </span>
                <span className="text-[11px] text-[#5C646B] dark:text-slate-400">
                  Target: {activePrompt.wordLimit} words &bull; {activePrompt.suggestedMinutes}m
                </span>
              </div>
              <p className="text-xs text-[#1E252B] dark:text-white font-medium leading-relaxed font-serif">
                "{activePrompt.prompt}"
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activePrompt.contextTags.map((tag, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF0EA] dark:bg-slate-800 text-[#5C646B]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Original Passage for Precis */}
            {activePrompt.originalPassage && (
              <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#121816] border border-[#2F7C7E]/30 space-y-2">
                <div className="flex justify-between items-center text-xs text-[#2F7C7E] font-semibold">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Original Passage ({originalWords} words)
                  </span>
                  <span className="text-[10px]">Strict 1/3 Target: ~{Math.round(originalWords / 3)}w</span>
                </div>
                <div className="text-[11px] text-[#5C646B] dark:text-slate-300 leading-relaxed font-serif max-h-48 overflow-y-auto p-2 bg-[#F7F8F5] dark:bg-slate-900 rounded">
                  {activePrompt.originalPassage}
                </div>
              </div>
            )}

            {/* Quick Scaffolding Helper Buttons */}
            <div className="pt-2 border-t border-[#EEF0EA] dark:border-slate-800 space-y-2">
              <button
                onClick={handleInsertScaffold}
                className="w-full py-2 px-3 rounded-lg border border-[#36624B]/30 hover:bg-[#E3EFE8]/50 text-xs font-semibold text-[#36624B] dark:text-[#88D4A8] flex items-center justify-center gap-1.5 transition-all"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Reset to UPSC {activePrompt.type} Scaffold</span>
              </button>
            </div>
          </div>

          {/* Live Structure Scaffolding Checklist */}
          {activePrompt.type === 'ARGUMENT' && argumentSections && (
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400">
                <span>Argument Structure Splitter</span>
                <span className="text-[#36624B]">{argumentSections.scaffoldScore}%</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className={`flex items-center gap-2 p-1.5 rounded ${argumentSections.hasIntro ? 'text-[#2E7D5B] bg-[#E6F4EA]' : 'text-[#8B949E]'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>1. Introduction / Context Defined</span>
                </div>
                <div className={`flex items-center gap-2 p-1.5 rounded ${argumentSections.hasFor ? 'text-[#2E7D5B] bg-[#E6F4EA]' : 'text-[#8B949E]'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>2. Arguments FOR the Statement</span>
                </div>
                <div className={`flex items-center gap-2 p-1.5 rounded ${argumentSections.hasAgainst ? 'text-[#2E7D5B] bg-[#E6F4EA]' : 'text-[#8B949E]'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>3. Arguments AGAINST the Statement</span>
                </div>
                <div className={`flex items-center gap-2 p-1.5 rounded ${argumentSections.hasConclusion ? 'text-[#2E7D5B] bg-[#E6F4EA]' : 'text-[#8B949E]'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>4. Balanced Conclusion / Way Forward</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Precis Compliance Meter */}
          {precisStatus && (
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#5C646B] dark:text-slate-400">
                <span>Précis 1/3 Rule Compliance</span>
                <span className={precisStatus.isCompliant ? 'text-[#2E7D5B]' : 'text-[#C25345]'}>
                  {precisStatus.isCompliant ? 'Compliant' : 'Out of range'}
                </span>
              </div>
              <div className="text-xs text-[#5C646B] dark:text-slate-300">
                Written: <strong>{currentWordCount} words</strong> (Target: ~{precisStatus.targetWords}w, Allowed: {precisStatus.minAllowed}–{precisStatus.maxAllowed}w)
              </div>
              <div className="w-full bg-[#EEF0EA] h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${precisStatus.isCompliant ? 'bg-[#2E7D5B]' : 'bg-[#C25345]'}`}
                  style={{ width: `${Math.min(100, precisStatus.percentOfOriginal * 2)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column (8 cols): Writing Desk Editor + AI Evaluation Report */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Timed Markdown Writing Desk */}
          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl border border-[#E2E6DD] dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF0EA] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4B5A8E]" />
                <span className="font-bold text-sm text-[#1E252B] dark:text-white">
                  Examination Writing Desk
                </span>
              </div>

              {/* Word Count Meter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-[#1E252B] dark:text-white">
                  {currentWordCount} words
                </span>
                <span className="text-[#5C646B] dark:text-slate-400">
                  / {activePrompt.wordLimit} max
                </span>
              </div>
            </div>

            {/* Writing Textarea */}
            <textarea
              aria-label="Writing draft"
              value={content}
              onChange={(e) => { setContent(e.target.value); setDraftStatus(''); }}
              placeholder="Draft your answer here according to UPSC CAPF Paper 2 structure..."
              rows={16}
              className="w-full p-4 text-sm font-serif leading-relaxed text-[#1E252B] dark:text-slate-100 bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#36624B] transition-all resize-y"
            />

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-[11px] text-[#5C646B] dark:text-slate-400">
                Exam tip: Maintain objective, constitutional diction without partisan or hyperbolic rhetoric.
              </div>

              {canUseAi ? <button
                onClick={handleRunEvaluation}
                disabled={isEvaluating} aria-busy={isEvaluating}
                className="px-5 py-2.5 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {isEvaluating ? <Spinner className="size-4 text-[#E3EFE8]" /> : <Sparkles className="w-4 h-4 text-[#E3EFE8]" />}
                <span>{isEvaluating ? 'Evaluating with UPSC Rubrics...' : 'Submit for AI Rubric Evaluation'}</span>
              </button> : <button type="button" className="primary-button" disabled={!content.trim() || content === draftFor(activePrompt) || content === getScaffoldTemplate(activePrompt.type, activePrompt.title)} onClick={() => saveDraft()}>
                Save writing draft
              </button>}
            </div>

            {draftStatus && <p role="status" className="text-sm text-[#36624B] dark:text-[#88D4A8]">{draftStatus}</p>}

            {evalError && (
              <div role="alert" className="p-3 rounded-lg bg-[#FBEAE8] text-[#C25345] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{evalError}</span>
              </div>
            )}
          </div>

          {/* AI Rubric Evaluation Report Screen */}
          {evaluationFeedback && (
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-xl border border-[#36624B]/30 p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EEF0EA] dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E3EFE8] text-[#36624B] flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1E252B] dark:text-white">
                      Writing feedback
                    </h3>
                    <p className="text-xs text-[#5C646B] dark:text-slate-400">
                      Standard official marking out of 20 marks
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 bg-[#36624B] text-white px-4 py-2 rounded-xl font-mono">
                  <span className="text-2xl font-bold">{evaluationFeedback.totalScore}</span>
                  <span className="text-xs text-[#E3EFE8]">/ 20</span>
                </div>
              </div>

              {/* Score Breakdown Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA]">
                  <div className="text-[11px] text-[#5C646B] uppercase font-semibold">Structure & Split</div>
                  <div className="text-lg font-bold font-mono text-[#1E252B] dark:text-white mt-1">
                    {evaluationFeedback.structuralScore} / 6
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA]">
                  <div className="text-[11px] text-[#5C646B] uppercase font-semibold">Constitutional & Fact Depth</div>
                  <div className="text-lg font-bold font-mono text-[#1E252B] dark:text-white mt-1">
                    {evaluationFeedback.factualAndDepthScore} / 8
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA]">
                  <div className="text-[11px] text-[#5C646B] uppercase font-semibold">Tone Objectivity & Diction</div>
                  <div className="text-lg font-bold font-mono text-[#1E252B] dark:text-white mt-1">
                    {evaluationFeedback.toneAndGrammarScore} / 6
                  </div>
                </div>
              </div>

              {/* Objective Tone Audit */}
              <div className="p-4 rounded-lg bg-[#F7F8F5] dark:bg-[#121816] border border-[#EEF0EA] space-y-1.5">
                <div className="text-xs font-bold text-[#36624B] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#36624B]" />
                  Objective Tone & Administrative Neutrality Audit:
                </div>
                <p className="text-xs text-[#1E252B] dark:text-slate-300 leading-relaxed font-sans">
                  {evaluationFeedback.objectiveToneAudit}
                </p>
              </div>

              {/* Points FOR vs AGAINST Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#E6F4EA]/50 dark:bg-[#1A2E24]/30 border border-[#2E7D5B]/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B]">
                    Points FOR Critique:
                  </h4>
                  <ul className="text-xs text-[#1E252B] dark:text-slate-300 space-y-1.5 list-disc pl-4">
                    {evaluationFeedback.pointsForFeedback.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#FBEAE8]/50 dark:bg-[#2E1815]/30 border border-[#C25345]/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#C25345]">
                    Points AGAINST Critique:
                  </h4>
                  <ul className="text-xs text-[#1E252B] dark:text-slate-300 space-y-1.5 list-disc pl-4">
                    {evaluationFeedback.pointsAgainstFeedback.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="space-y-3">
                <div className="text-xs">
                  <strong className="text-[#2E7D5B]">Notable Strengths: </strong>
                  <span className="text-[#5C646B] dark:text-slate-300">
                    {evaluationFeedback.strengths.join(' • ')}
                  </span>
                </div>
                <div className="text-xs">
                  <strong className="text-[#C25345]">Suggested Improvements: </strong>
                  <span className="text-[#5C646B] dark:text-slate-300">
                    {evaluationFeedback.suggestedImprovements.join(' • ')}
                  </span>
                </div>
              </div>

              {/* Model Answer Paragraph Snippet */}
              {evaluationFeedback.modelAnswerSnippet && (
                <div className="p-4 rounded-xl bg-[#E3EFE8]/40 dark:bg-[#1A2E24] border border-[#36624B]/30 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#36624B] dark:text-[#88D4A8]">
                    Model UPSC Answer Paragraph Snippet:
                  </div>
                  <p className="text-xs text-[#1E252B] dark:text-slate-200 font-serif leading-relaxed italic">
                    "{evaluationFeedback.modelAnswerSnippet}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
