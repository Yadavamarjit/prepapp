import { LearningChapter, ChapterProgress, Subject } from '../types';

export interface SubjectProgressStat {
  subject: Subject;
  totalChapters: number;
  completedChapters: number;
  completionPercentage: number;
  totalMinutes: number;
  completedMinutes: number;
}

export interface LearningProgressSummary {
  totalChapters: number;
  completedChapters: number;
  overallPercentage: number;
  totalReadingMinutes: number;
  completedReadingMinutes: number;
  subjectStats: SubjectProgressStat[];
}

/**
 * Calculates comprehensive progress summary across all learning chapters
 */
export function calculateLearningProgress(
  chapters: LearningChapter[],
  progressMap: Record<string, ChapterProgress> = {}
): LearningProgressSummary {
  if (!chapters || chapters.length === 0) {
    return {
      totalChapters: 0,
      completedChapters: 0,
      overallPercentage: 0,
      totalReadingMinutes: 0,
      completedReadingMinutes: 0,
      subjectStats: [],
    };
  }

  let totalMinutes = 0;
  let completedMinutes = 0;
  let completedCount = 0;

  // Group by subject
  const subjectGroups = new Map<
    Subject,
    { total: number; completed: number; totalMins: number; completedMins: number }
  >();

  for (const chapter of chapters) {
    totalMinutes += chapter.readTimeMinutes;
    const isDone = !!progressMap[chapter.id]?.isCompleted;
    if (isDone) {
      completedCount++;
      completedMinutes += chapter.readTimeMinutes;
    }

    const current = subjectGroups.get(chapter.subject) || {
      total: 0,
      completed: 0,
      totalMins: 0,
      completedMins: 0,
    };

    current.total += 1;
    current.totalMins += chapter.readTimeMinutes;
    if (isDone) {
      current.completed += 1;
      current.completedMins += chapter.readTimeMinutes;
    }
    subjectGroups.set(chapter.subject, current);
  }

  const subjectStats: SubjectProgressStat[] = Array.from(subjectGroups.entries()).map(
    ([subject, data]) => ({
      subject,
      totalChapters: data.total,
      completedChapters: data.completed,
      completionPercentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      totalMinutes: data.totalMins,
      completedMinutes: data.completedMins,
    })
  );

  return {
    totalChapters: chapters.length,
    completedChapters: completedCount,
    overallPercentage: Math.round((completedCount / chapters.length) * 100),
    totalReadingMinutes: totalMinutes,
    completedReadingMinutes: completedMinutes,
    subjectStats,
  };
}

/**
 * Filter chapters by subject, search query, and exam track
 */
export function filterLearningChapters(
  chapters: LearningChapter[],
  filters: {
    subject?: string;
    searchQuery?: string;
    examTrack?: 'ALL' | 'UPSC_CAPF' | 'SSC_CPO';
  }
): LearningChapter[] {
  const { subject, searchQuery, examTrack } = filters;
  const query = (searchQuery || '').toLowerCase().trim();

  return chapters.filter((chapter) => {
    // Subject filter
    if (subject && subject !== 'ALL' && chapter.subject !== subject) {
      return false;
    }

    // Exam track filter
    if (examTrack && examTrack !== 'ALL') {
      if (!chapter.examRelevance.includes(examTrack)) {
        return false;
      }
    }

    // Search query matching
    if (query) {
      const matchTitle = chapter.chapterTitle.toLowerCase().includes(query);
      const matchBook = chapter.ncertBook.toLowerCase().includes(query);
      const matchConcepts = chapter.coreConcepts.some((c) => c.toLowerCase().includes(query));
      const matchTraps = chapter.examinerTraps.some((t) => t.toLowerCase().includes(query));
      const matchOverview = chapter.summaryOverview.toLowerCase().includes(query);

      return matchTitle || matchBook || matchConcepts || matchTraps || matchOverview;
    }

    return true;
  });
}

/**
 * Suggests the next high-priority chapter to read
 * Prioritizes:
 * 1. Uncompleted chapters related to recent mistake subjects
 * 2. Uncompleted "Very High" weightage chapters
 * 3. First uncompleted chapter
 */
export function getRecommendedChapter(
  chapters: LearningChapter[],
  progressMap: Record<string, ChapterProgress> = {},
  weakSubjects: string[] = []
): LearningChapter | null {
  const uncompleted = chapters.filter((c) => !progressMap[c.id]?.isCompleted);
  if (uncompleted.length === 0) return chapters[0] || null;

  // 1. Weak subjects matching
  if (weakSubjects.length > 0) {
    const weakMatch = uncompleted.find((c) => weakSubjects.includes(c.subject));
    if (weakMatch) return weakMatch;
  }

  // 2. Very High weightage
  const veryHigh = uncompleted.find((c) => c.weightage === 'Very High');
  if (veryHigh) return veryHigh;

  // 3. First uncompleted
  return uncompleted[0];
}
