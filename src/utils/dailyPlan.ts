import type { ChapterProgress, LearningChapter, MistakeRecord, Question } from '../types';
export const DAILY_PLAN_KEY = 'dutydeck_daily_plan_v1';
export type PlanBudget = 20 | 45 | 90;
export type PlanExam = 'BOTH' | 'UPSC_CAPF' | 'SSC_CPO';
export interface PlanTask { id: string; title: string; detail: string; minutes: number; path: string; done: boolean; deferred: boolean; }
export interface DailyPlanState { date: string; exam: PlanExam; budget: PlanBudget; tasks: PlanTask[]; aiReason?: string; }
export function localPlanDate(now = new Date()) { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
export function parseDailyPlan(raw: string | null): DailyPlanState | null {
  try {
    const value = JSON.parse(raw || 'null');
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || ![20, 45, 90].includes(value.budget) || !['BOTH', 'UPSC_CAPF', 'SSC_CPO'].includes(value.exam) || !Array.isArray(value.tasks) || value.tasks.length !== 4) return null;
    if (!value.tasks.every((task: PlanTask) => ['recall', 'learn', 'maths', 'practice'].includes(task.id) && typeof task.title === 'string' && typeof task.detail === 'string' && Number.isInteger(task.minutes) && task.minutes > 0 && typeof task.done === 'boolean' && typeof task.deferred === 'boolean' && typeof task.path === 'string' && /^\/(daily-review|learning(?:\/[a-zA-Z0-9_-]+)?|calculation-coach|ai-tutor|mistake-vault)$/.test(task.path))) return null;
    if (new Set(value.tasks.map((task: PlanTask) => task.id)).size !== 4 || value.tasks.reduce((sum: number, task: PlanTask) => sum + task.minutes, 0) !== value.budget) return null;
    if (value.aiReason !== undefined && (typeof value.aiReason !== 'string' || value.aiReason.length > 1200)) return null;
    return value;
  } catch { return null; }
}
export function buildDailyPlan({ budget, exam, chapters, progress, questions, mistakes, dueCount, now = new Date() }: {
  budget: PlanBudget; exam: PlanExam; chapters: LearningChapter[]; progress: Record<string, ChapterProgress>;
  questions: Question[]; mistakes: MistakeRecord[]; dueCount: number; now?: Date;
}): DailyPlanState {
  const eligible = chapters.filter(chapter => exam === 'BOTH' || chapter.examRelevance.includes(exam));
  const weakQuestions = questions.filter(question => (exam === 'BOTH' || question.targetExam.includes(exam)) && mistakes.some(mistake => mistake.questionId === question.id));
  const subjectCounts = new Map<string, number>();
  for (const question of weakQuestions) subjectCounts.set(question.subject, (subjectCounts.get(question.subject) || 0) + 1);
  // Choose a subject with recorded mistakes, then its earliest unfinished chapter.
  const unfinished = eligible.filter(chapter => !progress[chapter.id]?.isCompleted);
  const subjects = [...new Set(unfinished.map(chapter => chapter.subject))];
  subjects.sort((a, b) => (subjectCounts.get(b) || 0) - (subjectCounts.get(a) || 0));
  const chapter = unfinished.filter(chapter => chapter.subject === subjects[0]).sort((a, b) => a.chapterNumber - b.chapterNumber)[0];
  const [recall, learn, maths, practice] = budget === 20 ? [4, 8, 4, 4] : budget === 45 ? [7, 20, 8, 10] : [10, 40, 15, 25];
  const task = (id: string, title: string, detail: string, minutes: number, path: string): PlanTask => ({ id, title, detail, minutes, path, done: false, deferred: false });
  return { date: localPlanDate(now), exam, budget, tasks: [
    task('recall', dueCount ? `Review due recall cards` : 'Recall your last lesson', dueCount ? `${dueCount} cards due across your revision queue. Review as many as fit; the rest stay due.` : 'Without looking, write three things you remember. If you are starting fresh, use this time to preview today’s lesson.', recall, '/daily-review'),
    task('learn', chapter ? chapter.chapterTitle : 'Revisit a chapter', chapter ? `${chapter.subject} · Chapter ${chapter.chapterNumber}. Read for ${learn} minutes and save your place; a full chapter may take longer.` : 'Your available topic lessons are marked complete. Choose one to explain from memory, then check it.', learn, chapter ? `/learning/${chapter.id}` : '/learning'),
    task('maths', 'Build calculation confidence', 'Open Calculation Coach. Start with fractions or a difficult skill. Work accurately before trying speed.', maths, '/calculation-coach'),
    task('practice', weakQuestions.length ? `Revisit ${weakQuestions[0].microTopic}` : chapter ? `Practise: ${chapter.subject}` : 'Practise a chosen topic', weakQuestions.length ? 'A saved mistake suggests this needs another look. Explain the method before checking the solution.' : 'Choose the exact topic you just studied, then answer a short set and read the explanations.', practice, weakQuestions.length ? '/mistake-vault' : '/ai-tutor'),
  ] };
}
export function carryDailyPlan(previous: DailyPlanState, fresh: DailyPlanState): DailyPlanState {
  if (previous.exam !== fresh.exam) return fresh;
  return { ...fresh, tasks: fresh.tasks.map(task => {
    const pending = previous.tasks.find(old => old.id === task.id && !old.done);
    return pending ? { ...pending, minutes: task.minutes, done: false, deferred: false } : task;
  }) };
}
