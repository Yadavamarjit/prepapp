import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCbtScore, isSpeedWarning, formatTimer } from './cbtEngine';
import { deduceEliminableOptions, checkSingleRemainingOption } from './elimination';
import { calculateNextSrsDate, filterMistakeRecords, getMistakeTaxonomyBreakdown } from './srsVault';
import { countWords, checkPrecisCompliance, analyzeArgumentSections } from './paper2Scaffold';
import { Question, QuestionOption } from '../types';

test('CBT score calculation for SSC CPO and UPSC CAPF', () => {
  const dummyQuestions: Question[] = [
    {
      id: 'q1',
      targetExam: ['SSC_CPO'],
      subject: 'Quantitative Aptitude',
      microTopic: 'Compound Interest',
      difficulty: 'Speed',
      type: 'SINGLE_CHOICE',
      questionText: 'CI Question',
      options: [
        { key: 'A', text: '100' },
        { key: 'B', text: '200' },
        { key: 'C', text: '300' },
        { key: 'D', text: '400' },
      ],
      correctAnswer: 'B',
      explanation: { coreConcept: 'CI Formula' },
    },
    {
      id: 'q2',
      targetExam: ['UPSC_CAPF'],
      subject: 'Polity & Constitution',
      microTopic: 'Emergency Provisions',
      difficulty: 'Analytical',
      type: 'STATEMENT_BASED',
      questionText: 'Polity Question',
      options: [
        { key: 'A', text: '1 only' },
        { key: 'B', text: '2 only' },
        { key: 'C', text: 'Both 1 and 2' },
        { key: 'D', text: 'Neither 1 nor 2' },
      ],
      correctAnswer: 'A',
      explanation: { coreConcept: 'Article 352' },
    },
    {
      id: 'q3',
      targetExam: ['SSC_CPO'],
      subject: 'Reasoning & Intelligence',
      microTopic: 'Syllogisms',
      difficulty: 'Speed',
      type: 'SINGLE_CHOICE',
      questionText: 'Syllogism Question',
      options: [
        { key: 'A', text: 'Only 1 follows' },
        { key: 'B', text: 'Only 2 follows' },
        { key: 'C', text: 'Either 1 or 2' },
        { key: 'D', text: 'Neither follows' },
      ],
      correctAnswer: 'C',
      explanation: { coreConcept: 'Either-or condition' },
    },
  ];

  const answers = {
    q1: 'B' as const, // correct
    q2: 'B' as const, // incorrect (correct is A)
    // q3 unattempted
  };

  const times = {
    q1: 30,
    q2: 55, // > 45s
    q3: 0,
  };

  // SSC CPO scoring (+1, -0.25)
  const cpoScore = calculateCbtScore(dummyQuestions, answers, times, 'SSC_CPO');
  assert.equal(cpoScore.attempted, 2);
  assert.equal(cpoScore.correct, 1);
  assert.equal(cpoScore.incorrect, 1);
  assert.equal(cpoScore.unattempted, 1);
  assert.equal(cpoScore.netScore, 0.75); // 1 - 0.25 = 0.75
  assert.equal(cpoScore.speedAlertCount, 1);

  // UPSC CAPF scoring (+2, -0.67)
  const capfScore = calculateCbtScore(dummyQuestions, answers, times, 'UPSC_CAPF');
  assert.equal(capfScore.attempted, 2);
  assert.equal(capfScore.correct, 1);
  assert.equal(capfScore.incorrect, 1);
  assert.equal(capfScore.netScore, 1.33); // 2 - 0.67 = 1.33
});

test('Speed alert and timer formatting', () => {
  assert.equal(isSpeedWarning(35), false);
  assert.equal(isSpeedWarning(46), true);
  assert.equal(formatTimer(900), '15:00');
  assert.equal(formatTimer(45), '00:45');
});

test('UPSC statement elimination heuristics', () => {
  const options: QuestionOption[] = [
    { key: 'A', text: '1 and 2 only' },
    { key: 'B', text: '1 and 3 only' },
    { key: 'C', text: '2 and 3 only' },
    { key: 'D', text: '1, 2 and 3' },
  ];

  // If statement 2 is eliminated (e.g. clearly false)
  const eliminable = deduceEliminableOptions([2], options, true);
  assert.deepEqual(eliminable.sort(), ['A', 'C', 'D'].sort());

  // Only option B remains!
  const remaining = checkSingleRemainingOption(['A', 'B', 'C', 'D'], eliminable);
  assert.equal(remaining, 'B');
});

test('SRS interval calculation and mistake categorization', () => {
  const now = 1000000000;
  const dayMs = 24 * 60 * 60 * 1000;

  assert.equal(calculateNextSrsDate(0, now), now + dayMs);
  assert.equal(calculateNextSrsDate(1, now), now + 3 * dayMs);
  assert.equal(calculateNextSrsDate(2, now), now + 7 * dayMs);

  const records = [
    {
      id: 'm1',
      questionId: 'q1',
      selectedAnswer: 'A' as const,
      correctAnswer: 'B' as const,
      timeSpentSeconds: 40,
      reason: 'Conceptual Gap' as const,
      timestamp: now,
      reviewCount: 1,
      nextReviewDate: now + 3 * dayMs,
    },
    {
      id: 'm2',
      questionId: 'q2',
      selectedAnswer: 'C' as const,
      correctAnswer: 'A' as const,
      timeSpentSeconds: 65,
      reason: 'Calculation/Time Panic' as const,
      timestamp: now,
      reviewCount: 2,
      nextReviewDate: now - 1000, // overdue
    },
  ];

  const conceptual = filterMistakeRecords(records, 'CONCEPTUAL_GAP', now);
  assert.equal(conceptual.length, 1);
  assert.equal(conceptual[0].id, 'm1');

  const overdue = filterMistakeRecords(records, 'DUE_FOR_REVIEW', now);
  assert.equal(overdue.length, 1);
  assert.equal(overdue[0].id, 'm2');

  const taxonomy = getMistakeTaxonomyBreakdown(records);
  assert.equal(taxonomy.conceptual, 1);
  assert.equal(taxonomy.timePanic, 1);
});

test('Paper 2 word counter and précis compliance', () => {
  const text = 'The quick brown fox jumps over the lazy dog.';
  assert.equal(countWords(text), 9);

  // Original passage of 300 words
  const complianceGood = checkPrecisCompliance(300, 100);
  assert.equal(complianceGood.targetWords, 100);
  assert.equal(complianceGood.isCompliant, true);

  const complianceBad = checkPrecisCompliance(300, 150);
  assert.equal(complianceBad.isCompliant, false);
});

test('Argument scaffolding section detection', () => {
  const sampleArg = `
    Introduction: In recent times, the debate around One Nation One Election has gained momentum.
    Arguments for the policy:
    1. Financial efficiency and reduction in recurring polling costs.
    2. Administrative continuity preventing model code freeze.
    Arguments against the policy:
    1. Federalism distortions and regional voice marginalization.
    Conclusion: A phased rollout with constitutional consensus is needed.
  `;
  const result = analyzeArgumentSections(sampleArg);
  assert.equal(result.hasIntro, true);
  assert.equal(result.hasFor, true);
  assert.equal(result.hasAgainst, true);
  assert.equal(result.hasConclusion, true);
  assert.equal(result.scaffoldScore, 100);
});
