import assert from 'node:assert/strict';
import test from 'node:test';
import { paper, report, startAttempt, validAttempt } from './capfAttempt';

test('a wrong answer deducts one third of its value and a skip earns zero', () => {
  const [first, second, third] = paper;
  const attempt = startAttempt([first.id, second.id, third.id], false, 0);
  attempt.answers[first.id] = { choice: first.correctAnswer };
  attempt.answers[second.id] = {
    choice: second.options.find(o => o.key !== second.correctAnswer)!.key,
    crossed: [second.correctAnswer]
  };
  const score = report(attempt);
  assert.equal(score.net, 4 / 3);
  assert.equal(score.crossedKey, 1);
  assert.equal(score.skipped, 1);
  assert.deepEqual(score.missed.map(q => q.id), [second.id, third.id]);
  assert.equal(attempt.deadline, 180_000);
  assert.ok(validAttempt(JSON.parse(JSON.stringify(attempt))));
  assert.equal(validAttempt({ ...attempt, index: 3 }), false);
});
