import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLearningProgress,
  filterLearningChapters,
  getRecommendedChapter,
} from './learningProgress.ts';
import { LearningChapter, ChapterProgress } from '../types/index.ts';

const mockChapters: LearningChapter[] = [
  {
    id: 'pol-1',
    subject: 'Polity & Constitution',
    ncertBook: 'NCERT Class 11 Ch 1',
    chapterNumber: 1,
    chapterTitle: 'Constitution: Why and How',
    readTimeMinutes: 20,
    examRelevance: ['UPSC_CAPF', 'SSC_CPO'],
    weightage: 'Very High',
    coreConcepts: ['Cabinet Mission Plan', 'Constituent Assembly'],
    summaryOverview: 'Overview of Indian Constitution',
    sections: [
      {
        heading: 'Intro',
        content: 'Constitution allows coordination.',
      },
    ],
    upscCapfAnalyticalAngle: 'Focus on Art 33-35 exceptions.',
    sscCpoSpeedShortcut: 'Remember 2 yrs 11 mos 18 days.',
    examinerTraps: ['Confusing Cabinet Mission with Cripps Mission'],
    highYieldMnemonics: ['SOBS for Sovereign Socialist Secular Democratic Republic'],
    comprehensionQuiz: [
      {
        question: 'Who moved the Objectives Resolution?',
        options: ['Nehru', 'Ambedkar', 'Patel', 'Prasad'],
        correctIndex: 0,
        explanation: 'Jawaharlal Nehru on 13 Dec 1946.',
      },
    ],
  },
  {
    id: 'hist-1',
    subject: 'Modern History',
    ncertBook: 'Spectrum Ch 15',
    chapterNumber: 2,
    chapterTitle: 'Government of India Acts',
    readTimeMinutes: 25,
    examRelevance: ['UPSC_CAPF'],
    weightage: 'High',
    coreConcepts: ['1919 Dyarchy', '1935 Provincial Autonomy'],
    summaryOverview: 'Historical constitutional evolution under British rule',
    sections: [],
    upscCapfAnalyticalAngle: 'Compare 1919 transferred vs reserved subjects',
    sscCpoSpeedShortcut: '1909 gave communal electorates to Muslims',
    examinerTraps: ['Dyarchy at provinces was 1919, not 1935'],
    highYieldMnemonics: ['1919 Prov Dyarchy, 1935 Centre Dyarchy'],
    comprehensionQuiz: [],
  },
  {
    id: 'quant-1',
    subject: 'Quantitative Aptitude',
    ncertBook: 'Arithmetic & Speed Quant',
    chapterNumber: 1,
    chapterTitle: 'Compound Interest Formulas',
    readTimeMinutes: 15,
    examRelevance: ['SSC_CPO'],
    weightage: 'High',
    coreConcepts: ['Effective rate delta', 'Successive percentage'],
    summaryOverview: 'Fast calculation shortcuts for CPO',
    sections: [],
    upscCapfAnalyticalAngle: 'Word problems on installments',
    sscCpoSpeedShortcut: 'Difference between CI and SI for 2 years = P*(R/100)^2',
    examinerTraps: ['Half-yearly interest rate doubling trap'],
    highYieldMnemonics: ['2 years = P(r/100)^2'],
    comprehensionQuiz: [],
  },
];

test('calculateLearningProgress calculates accurate stats with zero progress', () => {
  const result = calculateLearningProgress(mockChapters, {});
  assert.equal(result.totalChapters, 3);
  assert.equal(result.completedChapters, 0);
  assert.equal(result.overallPercentage, 0);
  assert.equal(result.totalReadingMinutes, 60);
  assert.equal(result.completedReadingMinutes, 0);
  assert.equal(result.subjectStats.length, 3);
});

test('calculateLearningProgress updates properly when a chapter is completed', () => {
  const progressMap: Record<string, ChapterProgress> = {
    'pol-1': {
      chapterId: 'pol-1',
      isCompleted: true,
      completedAt: Date.now(),
    },
  };

  const result = calculateLearningProgress(mockChapters, progressMap);
  assert.equal(result.totalChapters, 3);
  assert.equal(result.completedChapters, 1);
  assert.equal(result.overallPercentage, 33);
  assert.equal(result.completedReadingMinutes, 20);

  const polStat = result.subjectStats.find((s) => s.subject === 'Polity & Constitution');
  assert.ok(polStat);
  assert.equal(polStat?.completedChapters, 1);
  assert.equal(polStat?.completionPercentage, 100);
});

test('filterLearningChapters filters correctly by subject, search query, and exam track', () => {
  // Filter by subject
  const polityOnly = filterLearningChapters(mockChapters, { subject: 'Polity & Constitution' });
  assert.equal(polityOnly.length, 1);
  assert.equal(polityOnly[0].id, 'pol-1');

  // Filter by exam track
  const cpoOnly = filterLearningChapters(mockChapters, { examTrack: 'SSC_CPO' });
  assert.equal(cpoOnly.length, 2); // pol-1 has both, quant-1 has SSC_CPO

  // Search by query
  const queryResult = filterLearningChapters(mockChapters, { searchQuery: 'Dyarchy' });
  assert.equal(queryResult.length, 1);
  assert.equal(queryResult[0].id, 'hist-1');

  // Search by trap query
  const trapResult = filterLearningChapters(mockChapters, { searchQuery: 'Cripps' });
  assert.equal(trapResult.length, 1);
  assert.equal(trapResult[0].id, 'pol-1');
});

test('getRecommendedChapter recommends weak subject first or very high weightage', () => {
  const progress: Record<string, ChapterProgress> = {
    'pol-1': { chapterId: 'pol-1', isCompleted: true },
  };

  // Modern History is uncompleted and marked as weak subject
  const rec1 = getRecommendedChapter(mockChapters, progress, ['Modern History']);
  assert.equal(rec1?.id, 'hist-1');

  // No weak subjects specified, picks first uncompleted
  const rec2 = getRecommendedChapter(mockChapters, progress, []);
  assert.equal(rec2?.id, 'hist-1');
});
