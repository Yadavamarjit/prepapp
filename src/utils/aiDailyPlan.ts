import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { nextSyllabusChapters, type CatalogChapter } from '../data/syllabusCatalog';
import { parseDailyPlan, type DailyPlanState, type PlanExam } from './dailyPlan';

export interface PlanDecision { chapterId: string; order: string[]; reason: string; }

export function eligiblePlanChapters(exam: PlanExam, completed: string[]) {
  const unfinished = LEARNING_CHAPTERS.filter(chapter => (exam === 'BOTH' || chapter.examRelevance.includes(exam)) && !completed.includes(chapter.id));
  return [...new Set(unfinished.map(chapter => chapter.subject))].map(subject => unfinished.filter(chapter => chapter.subject === subject).sort((a, b) => a.chapterNumber - b.chapterNumber)[0]);
}

export function planCandidates(exam: PlanExam, completed: string[], catalog?: CatalogChapter[]) {
  if (catalog && exam !== 'SSC_CPO') return nextSyllabusChapters(catalog, new Set(completed)).map(chapter => ({
    id: chapter.progressId, subject: chapter.subject, title: chapter.title, number: chapter.order,
    minutes: undefined, path: chapter.path, practicePath: chapter.practicePath, reference: chapter.reference,
  }));
  return eligiblePlanChapters(exam, completed).map(chapter => ({
    id: chapter.id, subject: chapter.subject, title: chapter.chapterTitle, number: chapter.chapterNumber,
    minutes: chapter.readTimeMinutes, path: `/learning/${chapter.id}`, practicePath: '/ai-tutor', reference: chapter.ncertBook,
  }));
}

export function validatePlanDecision(value: unknown, exam: PlanExam, completed: string[], syllabusChapters?: CatalogChapter[]): PlanDecision {
  const result = value as PlanDecision;
  const candidates = planCandidates(exam, completed, syllabusChapters);
  if (!result || typeof result.reason !== 'string' || !result.reason.trim() || result.reason.length > 1200 || !Array.isArray(result.order) || result.order.length !== 4 || new Set(result.order).size !== 4 || !result.order.every(id => ['recall', 'learn', 'maths', 'practice'].includes(id)) || !(candidates.length ? candidates.some(chapter => chapter.id === result.chapterId) : result.chapterId === 'review')) throw new Error('AI returned an invalid plan decision. Your existing plan is unchanged.');
  return { chapterId: result.chapterId, order: result.order, reason: result.reason.trim() };
}
export function applyPlanDecision(plan: DailyPlanState, decision: PlanDecision, completed: string[], catalog?: CatalogChapter[]): DailyPlanState {
  validatePlanDecision(decision, plan.exam, completed, catalog);
  const chapter = planCandidates(plan.exam, completed, catalog).find(item => item.id === decision.chapterId);
  const tasks = plan.tasks.map(task => {
    if (task.done || task.deferred || !chapter) return task;
    if (task.id === 'learn') return { ...task, title: chapter.title, detail: `${chapter.subject} · Chapter ${chapter.number}. ${chapter.reference || 'Study the syllabus chapter topics.'} Use this time to study a section and save your place.`, path: chapter.path };
    if (task.id === 'practice' && task.path.startsWith('/ai-tutor')) return { ...task, title: `Practise: ${chapter.title}`, detail: `Use the syllabus topics as a checklist, answer a short set and read the explanations. ${chapter.reference || ''}`, path: chapter.practicePath };
    return task;
  });
  // Completed and deferred work retain their slots and content.
  const pending = decision.order.map(id => tasks.find(task => task.id === id)!).filter(task => !task.done && !task.deferred);
  const next = { ...plan, tasks: tasks.map(task => task.done || task.deferred ? task : pending.shift()!) };
  if (!parseDailyPlan(JSON.stringify(next))) throw new Error('The AI decision could not be applied.');
  return next;
}
