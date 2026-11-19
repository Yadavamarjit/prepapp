import test from 'node:test';
import assert from 'node:assert/strict';
import { LEARNING_CHAPTERS } from '../data/learningLibrary';
import { applyPlanDecision, eligiblePlanChapters, validatePlanDecision } from './aiDailyPlan';
import { buildDailyPlan } from './dailyPlan';
import { decideDailyPlan, parseDecisionRequest } from '../../server/aiDailyPlan';
const context = parseDecisionRequest({ exam: 'UPSC_CAPF', budget: 20, completed: [], dueCount: 4, mistakes: {} });
const decision = { chapterId: context.candidates[0].id, order: ['maths', 'recall', 'learn', 'practice'], reason: 'Start with a little calculation practice and then learn one concept.' };
test('AI candidates contain only first unfinished chapter per subject in the selected exam', () => {
  const candidates = eligiblePlanChapters('UPSC_CAPF', []);
  assert.equal(new Set(candidates.map(chapter => chapter.subject)).size, candidates.length);
  for (const chapter of candidates) {
    assert.ok(chapter.examRelevance.includes('UPSC_CAPF'));
    assert.ok(!LEARNING_CHAPTERS.some(other => other.examRelevance.includes('UPSC_CAPF') && other.subject === chapter.subject && other.chapterNumber < chapter.chapterNumber));
  }
  assert.ok(!eligiblePlanChapters('UPSC_CAPF', [candidates[0].id]).some(chapter => chapter.id === candidates[0].id));
});
test('invalid AI chapter selections, duplicate tasks and missing explanations are rejected', () => {
  for (const bad of [{ ...decision, chapterId: 'made-up' }, { ...decision, order: ['learn', 'learn', 'learn', 'learn'] }, { ...decision, reason: '' }]) assert.throws(() => validatePlanDecision(bad, context.exam, []));
});
test('applying AI preserves finished and deferred work, exact time budget and safe links', () => {
  const plan = buildDailyPlan({ budget: 20, exam: context.exam, chapters: LEARNING_CHAPTERS, progress: {}, questions: [], mistakes: [], dueCount: 4 });
  plan.tasks[0].done = true; plan.tasks[1].deferred = true;
  const next = applyPlanDecision(plan, decision, []);
  assert.deepEqual(next.tasks[0], plan.tasks[0]); assert.deepEqual(next.tasks[1], plan.tasks[1]);
  assert.equal(next.tasks.reduce((sum, task) => sum + task.minutes, 0), 20);
});
test('OpenAI request uses server credentials, strict output and minimal progress context', async () => {
  let called = false;
  const result = await decideDailyPlan(context, { apiKey: 'test-key', fetcher: (async (url, init) => {
    called = true; assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer test-key');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.store, false); assert.equal(body.text.format.strict, true);
    assert.ok(!body.input.includes('test-key'));
    return new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(decision) }] }] }), { status: 200 });
  }) as typeof fetch });
  assert.ok(called); assert.deepEqual(result, decision);
});
test('provider failure is explicit and never reported as a successful AI decision', async () => {
  await assert.rejects(decideDailyPlan(context, { apiKey: 'test', fetcher: (async () => new Response('{}', { status: 429 })) as typeof fetch }), /quota/);
  assert.throws(() => parseDecisionRequest({ ...context, budget: 999 }), /Invalid/);
});
