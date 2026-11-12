import { MistakeRecord } from '../types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function calculateNextSrsDate(reviewCount: number, baseTimestamp = Date.now()): number {
  if (reviewCount <= 0) {
    return baseTimestamp + ONE_DAY_MS; // 1 day
  }
  if (reviewCount === 1) {
    return baseTimestamp + 3 * ONE_DAY_MS; // 3 days
  }
  return baseTimestamp + 7 * ONE_DAY_MS; // 7 days
}

export type MistakeVaultFilter = 'ALL' | 'CONCEPTUAL_GAP' | 'REPEAT_MISTAKES' | 'DUE_FOR_REVIEW' | 'TIME_PANIC';

export function filterMistakeRecords(
  records: MistakeRecord[],
  filter: MistakeVaultFilter,
  currentTimestamp = Date.now()
): MistakeRecord[] {
  switch (filter) {
    case 'CONCEPTUAL_GAP':
      return records.filter((r) => r.reason === 'Conceptual Gap');
    case 'REPEAT_MISTAKES':
      return records.filter((r) => r.reviewCount >= 2);
    case 'TIME_PANIC':
      return records.filter((r) => r.reason === 'Calculation/Time Panic');
    case 'DUE_FOR_REVIEW':
      return records.filter((r) => r.nextReviewDate <= currentTimestamp);
    case 'ALL':
    default:
      return records;
  }
}

export function getMistakeTaxonomyBreakdown(records: MistakeRecord[]) {
  const counts = {
    conceptual: 0,
    misread: 0,
    timePanic: 0,
    unclassified: 0,
  };

  records.forEach((r) => {
    if (r.reason === 'Conceptual Gap') counts.conceptual++;
    else if (r.reason === 'Misread Question') counts.misread++;
    else if (r.reason === 'Calculation/Time Panic') counts.timePanic++;
    else counts.unclassified++;
  });

  return counts;
}
