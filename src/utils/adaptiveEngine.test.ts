import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTopicProficiency, determineAdaptiveAssessment, buildAdaptivePromptInstruction } from './adaptiveEngine';
import { Question, MistakeRecord } from '../types';

const mockQuestions: Question[] = [
  {
    id: 'q-em-1',
    targetExam: ['UPSC_CAPF'],
    subject: 'Polity & Constitution',
    microTopic: 'Emergency Provisions',
    difficulty: 'Analytical',
    type: 'STATEMENT_BASED',
    questionText: 'Test Q1',
    options: [{ key: 'A', text: '1 only' }, { key: 'B', text: '2 only' }, { key: 'C', text: 'Both' }, { key: 'D', text: 'Neither' }],
    correctAnswer: 'A',
    explanation: { coreConcept: 'Art 352' },
  },
  {
    id: 'q-em-2',
    targetExam: ['UPSC_CAPF'],
    subject: 'Polity & Constitution',
    microTopic: 'Emergency Provisions',
    difficulty: 'Analytical',
    type: 'STATEMENT_BASED',
    questionText: 'Test Q2',
    options: [{ key: 'A', text: '1 only' }, { key: 'B', text: '2 only' }, { key: 'C', text: 'Both' }, { key: 'D', text: 'Neither' }],
    correctAnswer: 'B',
    explanation: { coreConcept: 'Art 356' },
  },
];

test('Adaptive Engine: Scales down to Foundational (2 statements) when conceptual gaps are detected', () => {
  const mistakes: MistakeRecord[] = [
    {
      id: 'm1',
      questionId: 'q-em-1',
      selectedAnswer: 'B',
      correctAnswer: 'A',
      timeSpentSeconds: 50,
      reason: 'Conceptual Gap',
      timestamp: Date.now() - 10000,
      reviewCount: 0,
      nextReviewDate: Date.now() + 86400000,
    },
    {
      id: 'm2',
      questionId: 'q-em-2',
      selectedAnswer: 'A',
      correctAnswer: 'B',
      timeSpentSeconds: 60,
      reason: 'Conceptual Gap',
      timestamp: Date.now() - 5000,
      reviewCount: 0,
      nextReviewDate: Date.now() + 86400000,
    },
  ];

  const proficiency = calculateTopicProficiency(
    'Emergency Provisions (Art 352, 356, 360)',
    mistakes,
    ['q-em-1', 'q-em-2'],
    mockQuestions
  );

  assert.equal(proficiency.accuracyRate, 0);
  assert.equal(proficiency.dominantGap, 'Conceptual Gap');
  assert.equal(proficiency.currentLevel, 'Foundational');
  assert.equal(proficiency.statementDepth, 2);

  const assessment = determineAdaptiveAssessment(proficiency);
  assert.equal(assessment.level, 'Foundational');
  assert.equal(assessment.statementDepth, 2);
  assert.equal(assessment.trapTypeToInject, 'Conceptual Contrast');
  assert.match(assessment.rationale, /Reducing noise to 2 statements/);
});

test('Adaptive Engine: Advances to Advanced (4 statements) when high accuracy and streak are achieved', () => {
  const mistakes: MistakeRecord[] = []; // Zero mistakes!

  const proficiency = calculateTopicProficiency(
    'Emergency Provisions',
    mistakes,
    ['q-em-1', 'q-em-2'],
    mockQuestions
  );

  assert.equal(proficiency.accuracyRate, 100);
  assert.equal(proficiency.consecutiveCorrect, 2);
  assert.equal(proficiency.currentLevel, 'Advanced');
  assert.equal(proficiency.statementDepth, 4);

  const assessment = determineAdaptiveAssessment(proficiency);
  assert.equal(assessment.level, 'Advanced');
  assert.equal(assessment.statementDepth, 4);
  assert.match(assessment.rationale, /Scaling statement depth to 4 statements/);
});

test('Adaptive Engine: Targets Misread Question traps specifically', () => {
  const mistakes: MistakeRecord[] = [
    {
      id: 'm1',
      questionId: 'q-em-1',
      selectedAnswer: 'B',
      correctAnswer: 'A',
      timeSpentSeconds: 25, // Rushed through
      reason: 'Misread Question',
      timestamp: Date.now() - 200000,
      reviewCount: 0,
      nextReviewDate: Date.now() + 86400000,
    },
  ];

  const proficiency = calculateTopicProficiency(
    'Emergency Provisions',
    mistakes,
    ['q-em-1'],
    mockQuestions
  );

  assert.equal(proficiency.dominantGap, 'Misread Question');
  const assessment = determineAdaptiveAssessment(proficiency);
  assert.equal(assessment.trapTypeToInject, 'Subtle Qualifier');
});

test('Adaptive Prompt Instruction Builder formats correct directives', () => {
  const prompt2 = buildAdaptivePromptInstruction(
    {
      level: 'Foundational',
      statementDepth: 2,
      identifiedGap: 'Article distinction gap',
      trapTypeToInject: 'Conceptual Contrast',
      rationale: 'Rebuild core certainty',
      learningIntervention: 'Binary contrast',
    },
    'Emergency Provisions'
  );

  assert.match(prompt2, /Statement Count: EXACTLY 2 statements/);
  assert.match(prompt2, /Both 1 and 2/);

  const prompt4 = buildAdaptivePromptInstruction(
    {
      level: 'Advanced',
      statementDepth: 4,
      identifiedGap: 'None',
      trapTypeToInject: 'Pacing & Elimination',
      rationale: 'Advanced mastery',
      learningIntervention: 'Combinatorial',
    },
    'Emergency Provisions'
  );

  assert.match(prompt4, /Statement Count: EXACTLY 4 statements/);
  assert.match(prompt4, /multi-layered statements/);

  const prompt1 = buildAdaptivePromptInstruction(
    {
      level: 'Factual Recall',
      statementDepth: 1,
      identifiedGap: 'Speed and direct factual recall',
      trapTypeToInject: 'None',
      rationale: 'Direct objective recall drill',
      learningIntervention: 'Factual reinforcement',
    },
    'Emergency Provisions'
  );

  assert.match(prompt1, /Statement Count: EXACTLY 1 statements/);
  assert.match(prompt1, /SINGLE_CHOICE/);
  assert.match(prompt1, /Do NOT provide a numbered statements array/);
});

