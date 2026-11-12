import { QuestionOption } from '../types';

/**
 * Given an array of eliminated statement indices (1-indexed, e.g. [2]),
 * this identifies which options can be eliminated using UPSC logic.
 * E.g., if Statement 2 is incorrect and the question asks "Which is/are correct?",
 * any option mentioning "2" can be eliminated.
 */
export function deduceEliminableOptions(
  eliminatedStatementIndices: number[],
  options: QuestionOption[],
  isSeekingCorrect = true
): string[] {
  if (eliminatedStatementIndices.length === 0) return [];

  const eliminableOptionKeys: string[] = [];

  options.forEach((opt) => {
    const text = opt.text.toLowerCase();
    
    // Check if option references any of the eliminated statements
    const mentionsEliminated = eliminatedStatementIndices.some((idx) => {
      // Check for standalone digit or preceded/followed by non-digit
      // e.g. "1 and 2 only", "2 and 3", "1, 2 and 3", "2 only"
      const regex = new RegExp(`\\b${idx}\\b`);
      return regex.test(text);
    });

    if (isSeekingCorrect && mentionsEliminated) {
      eliminableOptionKeys.push(opt.key);
    }
  });

  return eliminableOptionKeys;
}

/**
 * Checks if only one option remains after elimination, signaling
 * the classic UPSC 100% certainty elimination breakthrough.
 */
export function checkSingleRemainingOption(
  allOptionKeys: string[],
  eliminatedOptionKeys: string[]
): string | null {
  const remaining = allOptionKeys.filter((k) => !eliminatedOptionKeys.includes(k));
  return remaining.length === 1 ? remaining[0] : null;
}
