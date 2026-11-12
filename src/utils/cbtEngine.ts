import { Question } from '../types';

export interface ScoreSummary {
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracyPercent: number;
  netScore: number;
  maxScore: number;
  speedAlertCount: number; // Questions exceeding 45s
}

export function calculateCbtScore(
  questions: Question[],
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | undefined>,
  questionTimes: Record<string, number>,
  examType: 'SSC_CPO' | 'UPSC_CAPF'
): ScoreSummary {
  const marksPerCorrect = examType === 'UPSC_CAPF' ? 2 : 1;
  const negativeMark = examType === 'UPSC_CAPF' ? 0.67 : 0.25;

  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  let speedAlertCount = 0;

  questions.forEach((q) => {
    const userAns = answers[q.id];
    const timeSpent = questionTimes[q.id] || 0;

    if (timeSpent > 45) {
      speedAlertCount++;
    }

    if (!userAns) {
      unattempted++;
    } else if (userAns === q.correctAnswer) {
      correct++;
    } else {
      incorrect++;
    }
  });

  const attempted = correct + incorrect;
  const accuracyPercent = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const rawNetScore = correct * marksPerCorrect - incorrect * negativeMark;
  const netScore = Math.max(0, Math.round(rawNetScore * 100) / 100);
  const maxScore = questions.length * marksPerCorrect;

  return {
    attempted,
    correct,
    incorrect,
    unattempted,
    accuracyPercent,
    netScore,
    maxScore,
    speedAlertCount,
  };
}

export function isSpeedWarning(timeSpentSeconds: number, threshold = 45): boolean {
  return timeSpentSeconds > threshold;
}

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
