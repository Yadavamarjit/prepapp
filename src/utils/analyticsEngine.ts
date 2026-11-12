import { Question, MistakeRecord, Paper2Submission, SyllabusModule, SyllabusSubtopic } from '../types';

export interface SubjectMetric {
  subjectId: string;
  subjectName: string;
  isSharedCore: boolean;
  totalQuestions: number;
  solvedCount: number;
  correctCount: number;
  accuracyRate: number;
  masteryScore: number; // 0-100
  status: 'Mastered' | 'On Track' | 'Needs Attention' | 'Unexplored';
  conceptualGaps: number;
  misreadCount: number;
  panicCount: number;
  subtopicCount: number;
}

export interface TopicMetric {
  id: string;
  title: string;
  subject: string;
  standardRef: string;
  weightage: 'High' | 'Medium' | 'Low';
  isShared: boolean;
  examFocus: ('CAPF' | 'CPO')[];
  totalQuestions: number;
  solvedCount: number;
  accuracyRate: number;
  masteryScore: number;
  status: 'Mastered' | 'Proficient' | 'Developing' | 'Unstarted';
  activeMistakesCount: number;
  hasDueSrs: boolean;
  keyConcepts: string[];
}

export interface ExamReadiness {
  capfScore: number; // 0-100
  capfLabel: string;
  cpoScore: number;  // 0-100
  cpoLabel: string;
  overallReadiness: number;
  weeklyTargetSolved: number;
  weeklyActualSolved: number;
  targetProgressPercent: number;
  studyHoursEstimated: number;
  recommendedAction: {
    title: string;
    subtitle: string;
    targetTab: 'AI_TUTOR' | 'CPO_SPEED' | 'CAPF_ELIMINATION' | 'PAPER_2' | 'MISTAKE_VAULT';
    topic?: string;
    subject?: string;
    standardRef?: string;
    impactLabel: string;
  };
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0 - 100
  thresholdText: string;
}

/**
 * Calculates exam readiness scores for UPSC CAPF AC & SSC CPO
 */
export function calculateExamReadiness(
  questions: Question[],
  mistakes: MistakeRecord[],
  submissions: Paper2Submission[],
  solvedQuestionIds: string[]
): ExamReadiness {
  const solvedCount = solvedQuestionIds.length;
  const mistakeSet = new Set(mistakes.map(m => m.questionId));
  
  // CAPF Questions
  const capfQuestions = questions.filter(q => q.targetExam.includes('UPSC_CAPF'));
  const capfSolved = capfQuestions.filter(q => solvedQuestionIds.includes(q.id));
  const capfCorrect = capfSolved.filter(q => !mistakeSet.has(q.id)).length;
  const capfP1Accuracy = capfSolved.length > 0 ? (capfCorrect / capfSolved.length) * 100 : 40;
  
  // Paper 2 contribution
  const avgPaper2Score = submissions.length > 0 
    ? (submissions.reduce((acc, s) => acc + (s.aiFeedback?.totalScore || 10), 0) / submissions.length) * 5 
    : 35; // Default baseline out of 100
  
  const capfScore = Math.min(100, Math.round((capfP1Accuracy * 0.6) + (avgPaper2Score * 0.3) + Math.min(10, (solvedCount / 20) * 10)));

  // CPO Questions
  const cpoQuestions = questions.filter(q => q.targetExam.includes('SSC_CPO'));
  const cpoSolved = cpoQuestions.filter(q => solvedQuestionIds.includes(q.id));
  const cpoCorrect = cpoSolved.filter(q => !mistakeSet.has(q.id)).length;
  const cpoAccuracy = cpoSolved.length > 0 ? (cpoCorrect / cpoSolved.length) * 100 : 45;
  const speedBonus = cpoSolved.length >= 2 ? 10 : 0;
  const cpoScore = Math.min(100, Math.round((cpoAccuracy * 0.8) + speedBonus + Math.min(10, (solvedCount / 15) * 10)));

  const overallReadiness = Math.round((capfScore + cpoScore) / 2);

  // Labels
  const getCapfLabel = (score: number) => {
    if (score >= 80) return 'Combat Ready (Rank Contender)';
    if (score >= 60) return 'Field Ready (Solid Foundation)';
    if (score >= 40) return 'Drill Phase (Building Elimination Depth)';
    return 'Cadet Phase (Initiating Syllabus)';
  };

  const getCpoLabel = (score: number) => {
    if (score >= 80) return 'Sub-Inspector Benchmark (High Velocity)';
    if (score >= 60) return 'Rapid Transit (Pacing Improving)';
    if (score >= 40) return 'CBT Conditioning (Needs Shortcut Practice)';
    return 'Recruit Phase (Speed Calibration Needed)';
  };

  // Recommended next study action
  let recommendedAction: ExamReadiness['recommendedAction'] = {
    title: 'Review Due Mistakes in Vault',
    subtitle: 'Reset SRS intervals for pending questions to prevent memory decay.',
    targetTab: 'MISTAKE_VAULT',
    impactLabel: '+6% Long-Term Retention',
  };

  const dueMistakes = mistakes.filter(m => m.nextReviewDate <= Date.now());
  if (dueMistakes.length > 0) {
    recommendedAction = {
      title: `Clear ${dueMistakes.length} SRS Due Question${dueMistakes.length > 1 ? 's' : ''}`,
      subtitle: 'Reinforce diagnosed conceptual gaps in your personal mistake vault.',
      targetTab: 'MISTAKE_VAULT',
      impactLabel: '+8% Memory Resilience',
    };
  } else if (submissions.length === 0) {
    recommendedAction = {
      title: 'Submit First Paper 2 Counter-Argument',
      subtitle: 'Practice the 3-part split (Intro, For, Against, Conclusion) under timed exam conditions.',
      targetTab: 'PAPER_2',
      impactLabel: '+15% CAPF Descriptive Score',
    };
  } else if (cpoSolved.length < 3) {
    recommendedAction = {
      title: 'Attempt 15-Minute CPO Speed Sprint',
      subtitle: 'Quant arithmetic drills with strict 45-second pacing gates.',
      targetTab: 'CPO_SPEED',
      impactLabel: '+10% Speed Velocity',
    };
  } else {
    recommendedAction = {
      title: 'Master Armed Forces Fundamental Rights (Art 33-35)',
      subtitle: 'Target high-frequency CAPF elimination traps with the AI Syllabus Tutor.',
      targetTab: 'AI_TUTOR',
      topic: 'Armed Forces & Fundamental Rights (Art 33, 34, 35)',
      subject: 'Polity & Constitution',
      standardRef: 'M. Laxmikanth Ch. 7',
      impactLabel: '+5% Analytical Accuracy',
    };
  }

  const weeklyTargetSolved = 30;
  const weeklyActualSolved = Math.max(solvedCount, 4);
  const targetProgressPercent = Math.min(100, Math.round((weeklyActualSolved / weeklyTargetSolved) * 100));
  const studyHoursEstimated = Math.round(((solvedCount * 2.5) + (submissions.length * 20)) / 60 * 10) / 10;

  return {
    capfScore,
    capfLabel: getCapfLabel(capfScore),
    cpoScore,
    cpoLabel: getCpoLabel(cpoScore),
    overallReadiness,
    weeklyTargetSolved,
    weeklyActualSolved,
    targetProgressPercent,
    studyHoursEstimated,
    recommendedAction,
  };
}

/**
 * Calculates per-subject analytics across all syllabus modules
 */
export function calculateSubjectAnalytics(
  modules: SyllabusModule[],
  questions: Question[],
  mistakes: MistakeRecord[],
  solvedQuestionIds: string[]
): SubjectMetric[] {
  const mistakeMap = new Map<string, MistakeRecord>();
  mistakes.forEach(m => mistakeMap.set(m.questionId, m));

  return modules.map(mod => {
    // Match questions for this subject
    const subjectQuestions = questions.filter(q => 
      q.subject.toLowerCase().includes(mod.subject.toLowerCase()) || 
      mod.subject.toLowerCase().includes(q.subject.toLowerCase())
    );

    const totalQuestions = subjectQuestions.length;
    const solved = subjectQuestions.filter(q => solvedQuestionIds.includes(q.id));
    const solvedCount = solved.length;

    let correctCount = 0;
    let conceptualGaps = 0;
    let misreadCount = 0;
    let panicCount = 0;

    solved.forEach(q => {
      const mist = mistakeMap.get(q.id);
      if (!mist) {
        correctCount++;
      } else {
        if (mist.reason === 'Conceptual Gap') conceptualGaps++;
        else if (mist.reason === 'Misread Question') misreadCount++;
        else if (mist.reason === 'Calculation/Time Panic') panicCount++;
      }
    });

    const accuracyRate = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;
    
    // Mastery formula: combination of coverage (how many questions attempted) and accuracy
    const coverageRate = totalQuestions > 0 ? (solvedCount / totalQuestions) * 100 : 0;
    const masteryScore = Math.min(100, Math.round((accuracyRate * 0.7) + (coverageRate * 0.3)));

    let status: SubjectMetric['status'] = 'Unexplored';
    if (solvedCount === 0) status = 'Unexplored';
    else if (masteryScore >= 75) status = 'Mastered';
    else if (masteryScore >= 45) status = 'On Track';
    else status = 'Needs Attention';

    return {
      subjectId: mod.id,
      subjectName: mod.subject,
      isSharedCore: mod.isSharedCore,
      totalQuestions: Math.max(totalQuestions, mod.subtopics.length * 2),
      solvedCount,
      correctCount,
      accuracyRate,
      masteryScore,
      status,
      conceptualGaps,
      misreadCount,
      panicCount,
      subtopicCount: mod.subtopics.length,
    };
  });
}

/**
 * Calculates per-topic metrics for detailed syllabus drill-down
 */
export function calculateTopicAnalytics(
  modules: SyllabusModule[],
  questions: Question[],
  mistakes: MistakeRecord[],
  solvedQuestionIds: string[]
): TopicMetric[] {
  const mistakeMap = new Map<string, MistakeRecord>();
  mistakes.forEach(m => mistakeMap.set(m.questionId, m));

  const allTopicMetrics: TopicMetric[] = [];

  modules.forEach(mod => {
    mod.subtopics.forEach(sub => {
      const topicLower = sub.title.toLowerCase();
      // Match questions related to this topic
      const relatedQuestions = questions.filter(q => 
        q.microTopic?.toLowerCase().includes(topicLower) || 
        topicLower.includes(q.microTopic?.toLowerCase() || '') ||
        q.questionText?.toLowerCase().includes(sub.id.replace('pol-', '').replace('hist-', ''))
      );

      const totalQuestions = Math.max(relatedQuestions.length, 2);
      const solved = relatedQuestions.filter(q => solvedQuestionIds.includes(q.id));
      const solvedCount = solved.length;

      let correctCount = 0;
      let activeMistakes = 0;
      let hasDueSrs = false;

      relatedQuestions.forEach(q => {
        const mist = mistakeMap.get(q.id);
        if (mist) {
          activeMistakes++;
          if (mist.nextReviewDate <= Date.now()) {
            hasDueSrs = true;
          }
        } else if (solvedQuestionIds.includes(q.id)) {
          correctCount++;
        }
      });

      const accuracyRate = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;
      const masteryScore = solvedCount > 0 ? Math.round((accuracyRate * 0.7) + (Math.min(solvedCount, 3) / 3 * 30)) : 0;

      let status: TopicMetric['status'] = 'Unstarted';
      if (solvedCount === 0) status = 'Unstarted';
      else if (masteryScore >= 80) status = 'Mastered';
      else if (masteryScore >= 50) status = 'Proficient';
      else status = 'Developing';

      allTopicMetrics.push({
        id: sub.id,
        title: sub.title,
        subject: mod.subject,
        standardRef: sub.standardRef,
        weightage: sub.weightage,
        isShared: sub.isShared,
        examFocus: sub.examFocus,
        totalQuestions,
        solvedCount,
        accuracyRate,
        masteryScore,
        status,
        activeMistakesCount: activeMistakes,
        hasDueSrs,
        keyConcepts: sub.keyConcepts,
      });
    });
  });

  return allTopicMetrics;
}

/**
 * Calculates gamified badges and achievements for positive study encouragement
 */
export function calculateStudyAchievements(
  solvedCount: number,
  mistakes: MistakeRecord[],
  submissions: Paper2Submission[],
  streakDays: number
): AchievementBadge[] {
  return [
    {
      id: 'streak-sentinel',
      title: 'Discipline Sentinel',
      description: 'Maintain an unbroken daily routine of study and drills.',
      icon: 'Flame',
      unlocked: streakDays >= 3,
      progress: Math.min(100, Math.round((streakDays / 7) * 100)),
      thresholdText: `${streakDays}/7 Days Goal`,
    },
    {
      id: 'elimination-maestro',
      title: 'Elimination Maestro',
      description: 'Solve multi-statement objective questions with deduction.',
      icon: 'CheckSquare',
      unlocked: solvedCount >= 3,
      progress: Math.min(100, Math.round((solvedCount / 10) * 100)),
      thresholdText: `${solvedCount}/10 Questions Solved`,
    },
    {
      id: 'paper2-wordsmith',
      title: 'Paper 2 Strategist',
      description: 'Submit an evaluated Counter-Argument or Report to the lab.',
      icon: 'PenTool',
      unlocked: submissions.length >= 1,
      progress: submissions.length >= 1 ? 100 : 0,
      thresholdText: `${submissions.length}/1 Lab Submission`,
    },
    {
      id: 'vault-purifier',
      title: 'Mistake Purifier',
      description: 'Actively log and review questions via Spaced Repetition.',
      icon: 'Archive',
      unlocked: mistakes.length >= 1,
      progress: mistakes.length >= 1 ? 100 : 0,
      thresholdText: `${mistakes.length} Logged in Vault`,
    },
    {
      id: 'cpo-velocity',
      title: 'Speed Sprinter',
      description: 'Execute rapid-fire quantitative drills under 15-minute pressure.',
      icon: 'Zap',
      unlocked: solvedCount >= 2,
      progress: Math.min(100, Math.round((solvedCount / 5) * 100)),
      thresholdText: `${solvedCount}/5 Speed Drills`,
    },
    {
      id: 'centurion-cadet',
      title: 'Centurion Aspirant',
      description: 'Solve 50 comprehensive dual-exam questions across syllabus.',
      icon: 'Award',
      unlocked: solvedCount >= 50,
      progress: Math.min(100, Math.round((solvedCount / 50) * 100)),
      thresholdText: `${solvedCount}/50 Solved`,
    },
  ];
}
