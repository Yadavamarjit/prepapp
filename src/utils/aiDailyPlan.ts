import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { parseDailyPlan, type DailyPlanState, type PlanExam } from './dailyPlan';
export interface PlanDecision { chapterId: string; order: string[]; reason: string; }
export function eligiblePlanChapters(exam: PlanExam, completed: string[]) {
  const unfinished = LEARNING_CHAPTERS.filter(chapter => (exam === 'BOTH' || chapter.examRelevance.includes(exam)) && !completed.includes(chapter.id));
  return [...new Set(unfinished.map(chapter => chapter.subject))].map(subject => unfinished.filter(chapter => chapter.subject === subject).sort((a, b) => a.chapterNumber - b.chapterNumber)[0]);
}
export function validatePlanDecision(value: unknown, exam: PlanExam, completed: string[]): PlanDecision {
  const result = value as PlanDecision;
  const candidates = eligiblePlanChapters(exam, completed);
  if (!result || typeof result.reason !== 'string' || !result.reason.trim() || result.reason.length > 1200 || !Array.isArray(result.order) || result.order.length !== 4 || new Set(result.order).size !== 4 || !result.order.every(id => ['recall', 'learn', 'maths', 'practice'].includes(id)) || !(candidates.length ? candidates.some(chapter => chapter.id === result.chapterId) : result.chapterId === 'review')) throw new Error('AI returned an invalid plan decision. Your existing plan is unchanged.');
  return { chapterId: result.chapterId, order: result.order, reason: result.reason.trim() };
}
export function applyPlanDecision(plan: DailyPlanState, decision: PlanDecision, completed: string[]): DailyPlanState {
  validatePlanDecision(decision, plan.exam, completed);
  const chapter = LEARNING_CHAPTERS.find(chapter => chapter.id === decision.chapterId);
  const tasks = plan.tasks.map(task => {
    if (task.done || task.deferred) return task;
    if (task.id === 'learn' && chapter) return { ...task, title: chapter.chapterTitle, detail: `${chapter.subject} · Chapter ${chapter.chapterNumber}. Read for ${task.minutes} minutes and save your place.`, path: `/learning/${chapter.id}` };
    if (task.id === 'practice' && task.path === '/ai-tutor' && chapter) return { ...task, title: `Practise: ${chapter.subject}`, detail: `Choose “${chapter.chapterTitle}” in Topic practice and answer a short set. Read the explanations before moving on.` };
    return task;
  });
  // Completed and deferred work retain their slots and content.
  const pending = decision.order.map(id => tasks.find(task => task.id === id)!).filter(task => !task.done && !task.deferred);
  const next = { ...plan, tasks: tasks.map(task => task.done || task.deferred ? task : pending.shift()!) };
  if (!parseDailyPlan(JSON.stringify(next))) throw new Error('The AI decision could not be applied.');
  return next;
}
