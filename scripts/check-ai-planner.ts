import dotenv from 'dotenv';
import { decideDailyPlan, parseDecisionRequest } from '../server/aiDailyPlan';
dotenv.config({ quiet: true });
try {
  const decision = await decideDailyPlan(parseDecisionRequest({ exam: 'UPSC_CAPF', budget: 20, completed: [], dueCount: 0, mistakes: {} }));
  console.log(JSON.stringify({ provider: 'OpenAI', ...decision }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Planner check failed.');
  process.exitCode = 1;
}
