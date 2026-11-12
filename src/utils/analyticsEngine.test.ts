import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateExamReadiness, 
  calculateSubjectAnalytics, 
  calculateTopicAnalytics, 
  calculateStudyAchievements 
} from './analyticsEngine';
import { Question, MistakeRecord, Paper2Submission, SyllabusModule } from '../types';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    targetExam: ['UPSC_CAPF', 'SSC_CPO'],
    subject: 'Polity & Constitution',
    microTopic: 'Emergency Provisions',
    difficulty: 'Analytical',
    type: 'STATEMENT_BASED',
    questionText: 'Test Polity Question',
    options: [{ key: 'A', text: '1 only' }, { key: 'B', text: '2 only' }],
    correctAnswer: 'A',
    explanation: { coreConcept: 'Art 352' },
  },
  {
    id: 'q2',
    targetExam: ['SSC_CPO'],
    subject: 'Quantitative Aptitude',
    microTopic: 'Compound Interest',
    difficulty: 'Speed',
    type: 'SINGLE_CHOICE',
    questionText: 'Test Quant Question',
    options: [{ key: 'A', text: '10' }, { key: 'B', text: '20' }],
    correctAnswer: 'B',
    explanation: { coreConcept: 'Formula D' },
  },
];

const mockModules: SyllabusModule[] = [
  {
    id: 'syl-polity',
    subject: 'Polity & Constitution',
    iconName: 'Scale',
    description: 'Shared Core Polity',
    isSharedCore: true,
    subtopics: [
      {
        id: 'pol-emergency',
        title: 'Emergency Provisions (Art 352, 356, 360)',
        isShared: true,
        examFocus: ['CAPF', 'CPO'],
        weightage: 'High',
        standardRef: 'M. Laxmikanth Ch. 16',
        keyConcepts: ['44th Amendment', '1 Month vs 2 Months'],
      },
    ],
  },
];

test('calculateExamReadiness computes readiness scores and next best action', () => {
  const mistakes: MistakeRecord[] = [
    {
      id: 'm1',
      questionId: 'q1',
      selectedAnswer: 'B',
      correctAnswer: 'A',
      timeSpentSeconds: 50,
      reason: 'Conceptual Gap',
      timestamp: Date.now(),
      reviewCount: 0,
      nextReviewDate: Date.now() - 1000, // Due today!
    },
  ];

  const submissions: Paper2Submission[] = [];
  const solved = ['q1', 'q2'];

  const readiness = calculateExamReadiness(mockQuestions, mistakes, submissions, solved);

  assert.ok(readiness.capfScore >= 0 && readiness.capfScore <= 100);
  assert.ok(readiness.cpoScore >= 0 && readiness.cpoScore <= 100);
  assert.ok(readiness.overallReadiness >= 0 && readiness.overallReadiness <= 100);
  assert.equal(readiness.recommendedAction.targetTab, 'MISTAKE_VAULT');
  assert.match(readiness.recommendedAction.title, /Clear 1 SRS Due Question/);
});

test('calculateSubjectAnalytics classifies status, accuracy, and error breakdown', () => {
  const mistakes: MistakeRecord[] = [
    {
      id: 'm1',
      questionId: 'q1',
      selectedAnswer: 'B',
      correctAnswer: 'A',
      timeSpentSeconds: 40,
      reason: 'Misread Question',
      timestamp: Date.now(),
      reviewCount: 0,
      nextReviewDate: Date.now() + 86400000,
    },
  ];

  const metrics = calculateSubjectAnalytics(mockModules, mockQuestions, mistakes, ['q1']);
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].subjectName, 'Polity & Constitution');
  assert.equal(metrics[0].solvedCount, 1);
  assert.equal(metrics[0].misreadCount, 1);
  assert.equal(metrics[0].conceptualGaps, 0);
});

test('calculateStudyAchievements determines unlocked badges and progress', () => {
  const badges = calculateStudyAchievements(5, [], [], 4);
  const streakBadge = badges.find(b => b.id === 'streak-sentinel');
  const speedBadge = badges.find(b => b.id === 'cpo-velocity');
  
  assert.ok(streakBadge);
  assert.equal(streakBadge?.unlocked, true); // streak >= 3
  assert.ok(speedBadge);
  assert.equal(speedBadge?.unlocked, true); // solved >= 2
});
