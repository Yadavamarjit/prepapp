import { Spinner } from './LoadingIndicator';
import { apiFetch } from '../lib/api';
import React, { useState, useEffect, useRef } from 'react';
import { useStudyPreferences } from '../context/StudyPreferences';
import { useSyllabus } from '../context/SyllabusContext';
import { SyllabusStatus } from './SyllabusOutline';
import { useSearchParams } from 'react-router-dom';
import { Question, MistakeRecord, MistakeReason, AdaptiveAssessment, QuestionComplexityTier } from '../types';
import { calculateTopicProficiency, determineAdaptiveAssessment } from '../utils/adaptiveEngine';


interface AiTopicBreakdownProps {
  initialTopic?: string;
  initialSubject?: string;
  initialRef?: string;
  mistakes: MistakeRecord[];
  solvedQuestionIds: string[];
  allQuestions: Question[];
  onQuestionAttempted?: (questionId: string) => void;
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
  onQuestionAttempted,
  onAddQuestionsToBank,
}) => {
  const { subjects, chapters, status } = useSyllabus();
  const [params, setParams] = useSearchParams();
  const chapterId = params.get('chapter');
  const chapter = chapterId ? chapters.find(item => item.id === chapterId) : initialTopic ? undefined : chapters[0];
  const topicIndex = Number(params.get('topic'));
  const focus = chapter && params.has('topic') ? chapter.topics[topicIndex] : undefined;
  const selectedTopic = focus || chapter?.title || (chapterId ? '' : initialTopic || '');
  const selectedSubject = chapter?.subject || initialSubject || '';
  const standardRef = chapter?.reference || initialRef || '';
  const changeChapter = (id: string) => setParams({ chapter: id });
  const [customGap, setCustomGap] = useState('');
  const { exam: examTrackChoice } = useStudyPreferences();

  // Question Statement Depth & Calibration Settings Panel state
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

  const selectionVersion = useRef(0);
  useEffect(() => {
    selectionVersion.current += 1;
    setBreakdownData(null);
    setGeneratedQuestions([]);
    setUserDrillAnswers({});
    setShowDrillSolutions({});
    setCustomGap('');
    setGenerationError(null);
    setBreakdownError(null);
  }, [selectedTopic, selectedSubject, examTrackChoice]);

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
    const requestVersion = selectionVersion.current;
    setIsLoadingBreakdown(true);
    setBreakdownError(null);

    try {
      const res = await apiFetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          subject: selectedSubject,
          standardRef: standardRef,
          examFocus: ['CAPF'],
        }),
      });

      const data = await res.json();
      if (requestVersion !== selectionVersion.current) return;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to break down topic');
      }

      setBreakdownData(data.data);
    } catch (err: any) {
      if (requestVersion !== selectionVersion.current) return;
      setBreakdownError(err.message || 'Error communicating with AI tutor.');
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  // Trigger Dynamic Practice Question Generation based on Learning Gap & Adaptive Depth
  const handleGenerateQuestions = async () => {
    if (!selectedTopic) return;
    const requestVersion = selectionVersion.current;
    setIsGeneratingQuestions(true);
    setGeneratedQuestions([]);
    setGenerationError(null);

    try {
      const res = await apiFetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          subject: selectedSubject,
          examTrack: examTrackChoice,
          specificGap: customGap || effectiveAssessment.identifiedGap,
          count: questionCount,
          complexityTier: effectiveAssessment.complexityTier,
          statementDepth: effectiveAssessment.statementDepth,
          adaptiveAssessment: effectiveAssessment,
        }),
      });

      const data = await res.json();
      if (requestVersion !== selectionVersion.current) return;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate practice questions');
      }

      setGeneratedQuestions(data.questions);
      onAddQuestionsToBank(data.questions);
      setUserDrillAnswers({});
      setShowDrillSolutions({});
    } catch (err: any) {
      if (requestVersion !== selectionVersion.current) return;
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
    if (chosen) onQuestionAttempted?.(q.id);
    const isCorrect = chosen === q.correctAnswer;
    
    // Automatically record to profile
    if (!isCorrect && chosen) {
      onSaveMistake(q.id, chosen, 'Conceptual Gap', 55);
    }
  };

  return <div className="mx-auto max-w-4xl space-y-6">
    <header><p className="eyebrow">A little help, right where you need it</p><h1 className="page-title mt-2">Topic practice</h1><p className="page-description">Understand one topic, then check what you know. Questions stay within your selection.</p></header>
    <section className="study-panel space-y-5 p-5 sm:p-6">
      <SyllabusStatus />
      {status === 'ready' && chapterId && !chapter && <p role="alert">This syllabus chapter is unavailable. Choose another subject below.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Subject
          <select className="study-input mt-2 w-full" value={chapter?.subjectId || ''} onChange={event => {
            const next = chapters.find(item => item.subjectId === event.target.value);
            if (next) changeChapter(next.id);
          }}>
            <option value="" disabled>{initialSubject && !chapterId ? initialSubject : 'Choose a subject'}</option>
            {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Chapter
          <select className="study-input mt-2 w-full" value={chapter?.id || ''} onChange={event => changeChapter(event.target.value)} disabled={!chapter}>
            {!chapter && <option value="">{selectedTopic || 'Choose a chapter'}</option>}
            {subjects.find(subject => subject.id === chapter?.subjectId)?.subSubjects.map(group => <optgroup key={group.id} label={group.name}>
              {group.chapters.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </optgroup>)}
          </select>
        </label>
        {chapter && <label className="text-sm sm:col-span-2">Topic
          <select className="study-input mt-2 w-full" value={focus ? String(topicIndex) : ''} onChange={event =>
            setParams(event.target.value ? { chapter: chapter.id, topic: event.target.value } : { chapter: chapter.id })}>
            <option value="">Entire chapter</option>
            {chapter.topics.map((topic, index) => <option key={index} value={index}>{topic}</option>)}
          </select>
        </label>}
      </div>
      <p className="text-xs leading-6 text-[#818879]">Reference: {standardRef}</p>
      <details className="border-t border-[#E6E7DE] pt-4 dark:border-slate-800"><summary className="cursor-pointer text-xs font-medium">Practice settings <span className="ml-2 font-normal text-[#818879]">{effectiveAssessment.statementDepth === 1 ? 'Direct questions' : `${effectiveAssessment.statementDepth}-statement questions`} ? {questionCount} questions</span></summary>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium">Difficulty<select value={isManualOverride ? complexityTier : 'AUTO'} onChange={event => {
            if (event.target.value === 'AUTO') setIsManualOverride(false);
            else handleToggleComplexityTier(event.target.value as QuestionComplexityTier);
          }} className="study-input mt-2 !py-2"><option value="AUTO">Automatic ? based on my practice</option><option value="Simple">Simple ? direct recall</option><option value="Moderate">Moderate ? 2 statements</option><option value="Complex/UPSC">Advanced ? 3?4 statements</option></select></label>
          <label className="block text-xs font-medium">Number of questions<select value={questionCount} onChange={event => setQuestionCount(Number(event.target.value))} className="study-input mt-2 !py-2">{[1,2,3,4,5].map(count => <option key={count}>{count}</option>)}</select></label>
          {isManualOverride && complexityTier === 'Complex/UPSC' && <label className="block text-xs font-medium">Statements per question<select value={manualDepth} onChange={event => setManualDepth(Number(event.target.value) as 3 | 4)} className="study-input mt-2 !py-2"><option value={3}>3 statements</option><option value={4}>4 statements</option></select></label>}
          <label className="block text-xs font-medium sm:col-span-2">Anything you find difficult? <span className="font-normal text-[#818879]">Optional</span><input value={customGap} onChange={event => setCustomGap(event.target.value)} placeholder="For example: I confuse the approval timelines" className="study-input mt-2 !py-2" /></label>
        </div>
      </details>
      <div className="flex flex-wrap gap-3"><button type="button" disabled={!selectedTopic || isLoadingBreakdown} aria-busy={isLoadingBreakdown} onClick={handleFetchBreakdown} className="secondary-button">{isLoadingBreakdown && <Spinner />}{isLoadingBreakdown ? 'Preparing explanation…' : 'Explain this topic'}</button><button type="button" disabled={!selectedTopic || isGeneratingQuestions} aria-busy={isGeneratingQuestions} onClick={handleGenerateQuestions} className="primary-button">{isGeneratingQuestions && <Spinner />}{isGeneratingQuestions ? 'Preparing questions…' : 'Practise this topic'}</button></div>
      {(breakdownError || generationError) && <p role="alert" className="rounded-lg bg-[#FBEAE8] p-3 text-sm text-[#9B3E33]">{breakdownError || generationError}</p>}
    </section>
    {breakdownData && <section className="study-panel space-y-6 p-5 sm:p-7"><h2 className="section-title">Understand the essentials</h2><ul className="list-disc space-y-3 pl-5 text-sm leading-7 text-[#626B59] dark:text-slate-300">{breakdownData.eli5Summary.map((point, index) => <li key={index}>{point}</li>)}</ul>{[
      ['Go a little deeper', breakdownData.upscAnalyticalDepth], ['A quicker way', breakdownData.cpoSpeedShortcut], ['A way to remember', breakdownData.memoryHook], ['A common mistake', breakdownData.examinerTrap]
    ].map(([title, text]) => <div key={title} className="border-t border-[#E6E7DE] pt-5 dark:border-slate-800"><h3 className="mb-2 text-sm font-medium">{title}</h3><p className="text-sm leading-7 text-[#717B64] dark:text-slate-300">{text}</p></div>)}</section>}
    {generatedQuestions.length > 0 && <section className="space-y-4"><div className="flex flex-wrap justify-between gap-2"><h2 className="section-title">Your practice questions</h2><span className="text-xs text-[#818879]">{selectedTopic}</span></div>{generatedQuestions.map((question, index) => {
      const revealed = !!showDrillSolutions[question.id];
      const selected = userDrillAnswers[question.id];
      return <article key={question.id} className="study-panel space-y-4 p-5 sm:p-6"><h3 className="text-sm font-medium leading-7">{index + 1}. {question.questionText}</h3>{question.statements?.length ? <ol className="list-decimal space-y-2 pl-5 text-sm leading-7">{question.statements.map((statement, i) => <li key={i}>{statement}</li>)}</ol> : null}<div className="grid gap-2">{question.options.map(option => <button type="button" key={option.key} disabled={revealed} onClick={() => handleSelectDrillOption(question.id, option.key)} className={`rounded-lg border px-4 py-3 text-left text-sm ${revealed && option.key === question.correctAnswer ? 'border-[#8FA980] bg-[#EEF4E9] text-[#315840] dark:bg-[#273C2E] dark:text-[#B2D7BA]' : option.key === selected ? 'border-[#8FA980] bg-[#F2F5ED] text-[#315840] dark:bg-[#273C2E] dark:text-[#B2D7BA]' : 'border-[#E1E3D8] dark:border-slate-700'}`}>{option.key}. {option.text}</button>)}</div>{!revealed ? <button type="button" className="secondary-button disabled:opacity-50" disabled={!selected} onClick={() => handleVerifyDrillQuestion(question)}>Check answer</button> : <div role="status" className="space-y-3 border-t border-[#E6E7DE] pt-4 text-sm leading-7 dark:border-slate-800"><p className="font-medium">{selected === question.correctAnswer ? 'Correct.' : `Correct answer: ${question.correctAnswer}.`}</p><p className="text-[#717B64] dark:text-slate-300">{question.explanation.coreConcept}</p>{question.explanation.shortcutOrTrick && <p className="text-[#717B64] dark:text-slate-300">{question.explanation.shortcutOrTrick}</p>}<p className="text-xs text-[#818879]">Added to your revision cards.</p></div>}</article>;
    })}</section>}
  </div>;
};
