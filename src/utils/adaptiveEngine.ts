import { Question, MistakeRecord, MistakeReason, TopicProficiency, AdaptiveAssessment, AdaptiveComplexityLevel } from '../types';

/**
 * Computes an aspirant's performance metrics and learning gaps for a given topic.
 */
export function calculateTopicProficiency(
  topicTitle: string,
  mistakes: MistakeRecord[],
  solvedIds: string[],
  allQuestions: Question[]
): TopicProficiency {
  // Ignore reference annotations, but never match on a shared first word or empty label.
  const normalizeTopic = (value: string) => value.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const normTopic = normalizeTopic(topicTitle);
  const topicQuestions = allQuestions.filter((q) => {
    const qTopic = normalizeTopic(q.microTopic || '');
    return Boolean(normTopic && qTopic && normTopic === qTopic);
  });

  const topicQuestionIds = new Set(topicQuestions.map((q) => q.id));

  // Find solved questions in this topic
  const attemptedTopicQuestionIds = solvedIds.filter((id) => topicQuestionIds.has(id));
  const topicMistakes = mistakes.filter((m) => topicQuestionIds.has(m.questionId));

  const totalAttempts = Math.max(attemptedTopicQuestionIds.length, topicMistakes.length);
  const incorrectCount = topicMistakes.length;
  const correctCount = Math.max(0, totalAttempts - incorrectCount);
  const accuracyRate = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 60; // 60% neutral baseline

  // Error taxonomy counts
  let conceptualGaps = 0;
  let misreadCount = 0;
  let timePanicCount = 0;
  let totalTime = 0;

  topicMistakes.forEach((m) => {
    totalTime += m.timeSpentSeconds || 45;
    if (m.reason === 'Conceptual Gap') conceptualGaps++;
    else if (m.reason === 'Misread Question') misreadCount++;
    else if (m.reason === 'Calculation/Time Panic') timePanicCount++;
    else conceptualGaps++;
  });

  const averageTimeSeconds = topicMistakes.length > 0 ? Math.round(totalTime / topicMistakes.length) : 42;

  // Determine consecutive streak from most recent mistake or solved events
  // If recent mistakes exist, consecutive incorrect is at least 1
  let consecutiveIncorrect = 0;
  let consecutiveCorrect = 0;

  if (topicMistakes.length > 0) {
    const lastMistakeTime = Math.max(...topicMistakes.map((m) => m.timestamp));
    const now = Date.now();
    // If mistake happened in last 1 hour, count consecutive incorrect
    if (now - lastMistakeTime < 3600000) {
      consecutiveIncorrect = Math.min(topicMistakes.length, 3);
    }
  }

  if (totalAttempts >= 2 && incorrectCount === 0) {
    consecutiveCorrect = totalAttempts;
  } else if (accuracyRate >= 80) {
    consecutiveCorrect = Math.max(1, correctCount - incorrectCount);
  }

  // Dominant learning gap identification
  let dominantGap: MistakeReason | 'Pacing' | 'None' = 'None';
  if (conceptualGaps > 0 && conceptualGaps >= misreadCount && conceptualGaps >= timePanicCount) {
    dominantGap = 'Conceptual Gap';
  } else if (misreadCount > 0 && misreadCount >= conceptualGaps && misreadCount >= timePanicCount) {
    dominantGap = 'Misread Question';
  } else if (timePanicCount > 0 && timePanicCount >= conceptualGaps && timePanicCount >= misreadCount) {
    dominantGap = 'Calculation/Time Panic';
  } else if (averageTimeSeconds > 60) {
    dominantGap = 'Pacing';
  }

  // Determine current baseline complexity level and statement depth
  let currentLevel: AdaptiveComplexityLevel = 'Standard';
  let statementDepth: 1 | 2 | 3 | 4 = 3;

  if (accuracyRate >= 75 && consecutiveCorrect >= 2) {
    currentLevel = 'Advanced';
    statementDepth = 4;
  } else if (accuracyRate < 50 || consecutiveIncorrect >= 2 || (conceptualGaps >= 2 && accuracyRate < 60)) {
    currentLevel = 'Foundational';
    statementDepth = 2;
  }

  const recentOutcomes: ('CORRECT' | 'INCORRECT')[] = [];
  for (let i = 0; i < correctCount; i++) recentOutcomes.push('CORRECT');
  for (let i = 0; i < incorrectCount; i++) recentOutcomes.push('INCORRECT');

  return {
    topic: topicTitle,
    totalAttempts,
    correctCount,
    accuracyRate,
    averageTimeSeconds,
    conceptualGaps,
    misreadCount,
    timePanicCount,
    consecutiveCorrect,
    consecutiveIncorrect,
    currentLevel,
    statementDepth,
    dominantGap,
    recentOutcomes,
  };
}

/**
 * Calculates adaptive question generation parameters based on diagnosed proficiency.
 */
export function determineAdaptiveAssessment(proficiency: TopicProficiency): AdaptiveAssessment {
  const { accuracyRate, consecutiveCorrect, consecutiveIncorrect, conceptualGaps, misreadCount, dominantGap, statementDepth, currentLevel } = proficiency;

  // 1. Factual Recall (1 Statement)
  if (statementDepth === 1 || currentLevel === 'Factual Recall') {
    return {
      level: 'Factual Recall',
      statementDepth: 1,
      identifiedGap: 'Speed and direct factual recall accuracy (SSC CPO / High-speed CBT gate)',
      trapTypeToInject: 'Subtle Qualifier',
      rationale: 'Targeting direct, single-statement factual recall. Eliminates multi-statement complexity to build rapid recall of key articles, amendments, and definitions.',
      learningIntervention: 'Direct factual retrieval: High-speed recall without multi-statement elimination overhead.',
    };
  }

  // 2. Advanced Tier (4 Statements)
  if (currentLevel === 'Advanced' || (accuracyRate >= 75 && consecutiveCorrect >= 2)) {
    return {
      level: 'Advanced',
      statementDepth: 4,
      identifiedGap: dominantGap === 'Misread Question' 
        ? 'High accuracy but vulnerable to fine semantic exceptions in multi-statement sets'
        : 'Syllabus mastery established; ready for multi-statement combinatorial elimination',
      trapTypeToInject: dominantGap === 'Misread Question' ? 'Subtle Qualifier' : 'Pacing & Elimination',
      rationale: `Aspirant is demonstrating high proficiency (${accuracyRate}% accuracy, ${consecutiveCorrect} consecutive correct). Scaling statement depth to 4 statements to simulate modern high-order UPSC elimination matrices.`,
      learningIntervention: 'Deep analytical synthesis: Testing edge-case statutory provisions and overlapping constitutional articles.',
    };
  }

  // 3. Foundational Tier (2 Statements)
  if (currentLevel === 'Foundational' || accuracyRate < 50 || consecutiveIncorrect >= 2 || conceptualGaps >= 2) {
    return {
      level: 'Foundational',
      statementDepth: 2,
      identifiedGap: dominantGap === 'Conceptual Gap'
        ? 'Fundamental doctrine confusion (e.g. parliamentary approval majorities or amendment years)'
        : dominantGap === 'Misread Question'
        ? 'Careless reading of negative qualifiers ("not correct", "only")'
        : 'Inconsistent recall under test pressure',
      trapTypeToInject: dominantGap === 'Misread Question' ? 'Subtle Qualifier' : 'Conceptual Contrast',
      rationale: `Diagnostic indicates a learning gap (${conceptualGaps} conceptual gaps logged, ${accuracyRate}% accuracy). Reducing noise to 2 statements with sharp binary contrast to rebuild conceptual certainty.`,
      learningIntervention: 'Remedial consolidation: 2-statement binary verification directly anchored in standard textbook citations.',
    };
  }

  // 4. Standard Tier (3 Statements)
  return {
    level: 'Standard',
    statementDepth: 3,
    identifiedGap: dominantGap !== 'None' 
      ? `Periodic slip-ups tagged under "${dominantGap}"`
      : 'Calibrated at standard UPSC CAPF AC elimination benchmark',
    trapTypeToInject: dominantGap === 'Misread Question' 
      ? 'Subtle Qualifier' 
      : dominantGap === 'Conceptual Gap'
      ? 'Conceptual Contrast'
      : 'None',
    rationale: `Balanced baseline performance (${accuracyRate}% accuracy across ${proficiency.totalAttempts} attempts). Serving canonical 3-statement format where 1 elimination eliminates 50% of choices.`,
    learningIntervention: 'Standard elimination mastery: Practicing classic 50/50 deduction heuristics.',
  };
}

/**
 * Formats a rich adaptive instruction for the Gemini prompt or question setter.
 */
export function buildAdaptivePromptInstruction(assessment: AdaptiveAssessment, topic: string): string {
  return `[ADAPTIVE QUESTION ENGINE DIRECTIVE]
Target Complexity: ${assessment.level.toUpperCase()}
Statement Count: EXACTLY ${assessment.statementDepth} statements per question.
Diagnosed Learning Gap: "${assessment.identifiedGap}"
Targeted Trap Directive: Inject "${assessment.trapTypeToInject}" traps.
Instructional Objective: ${assessment.learningIntervention}

Rules for this level:
${
  assessment.statementDepth === 1
    ? `- Generate direct single-statement factual recall questions (standard CBT objective format, type: SINGLE_CHOICE).
- Do NOT provide a numbered statements array. The questionText itself should be a direct, clear factual question testing a single article, amendment, formula, or definition.
- The options should be 4 direct substantive choices (A, B, C, D).`
    : assessment.statementDepth === 2
    ? `- Generate exactly 2 distinct, high-contrast statements (1 and 2).
- Keep statements direct and anchored to fundamental principles from standard books.
- The options should be: "A: 1 only", "B: 2 only", "C: Both 1 and 2", "D: Neither 1 nor 2".`
    : assessment.statementDepth === 4
    ? `- Generate exactly 4 multi-layered statements (1, 2, 3, and 4) covering constitutional nuances, commission reports, or border jurisdictions.
- Require multi-step elimination (e.g., options like "1 and 3 only", "1, 2 and 4 only", "2, 3 and 4 only", "All four").
- Provide an intricate elimination clue in the explanation.`
    : `- Generate standard 3 statements (1, 2, and 3).
- Options should follow classic UPSC format: "1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3".
- Ensure 1 statement is definitively falsifiable via a known rule.`
}`;
}
