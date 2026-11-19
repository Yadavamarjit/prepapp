export const COACH_KEY = 'dutydeck_calculation_coach_v1';
export const SKILLS = ['addition', 'subtraction', 'multiplication', 'division', 'fractionMeaning', 'equivalence', 'comparison', 'fractionAddition'] as const;
export type MathSkill = typeof SKILLS[number];
export const SKILL_LABELS: Record<MathSkill, string> = {
  addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication', division: 'Division',
  fractionMeaning: 'Understanding fractions', equivalence: 'Equivalent fractions', comparison: 'Comparing fractions', fractionAddition: 'Adding fractions',
};
export interface MathQuestion { id: string; skill: MathSkill; a: number; b: number; c: number; d: number; }
export interface MathAttempt { question: MathQuestion; correct: boolean; helped: boolean; skipped: boolean; seconds: number; at: number; }
export type CoachMode = 'check' | 'practice' | 'review' | 'speed';
export interface CoachSession {
  id: string; mode: CoachMode; skill: MathSkill; questions: MathQuestion[]; index: number;
  numerator: string; denominator: string; scratch: string; helped: boolean;
  feedback: 'correct' | 'incorrect' | 'skipped' | null; startedAt: number;
  seconds: number; deadline: number | null; finished: boolean;
}
export interface CoachState { attempts: MathAttempt[]; session: CoachSession | null; checkCompleted: boolean; }
export const emptyCoachState = (): CoachState => ({ attempts: [], session: null, checkCompleted: false });

export function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : Math.abs(a); }
export function fraction(n: number, d: number): string { const divisor = gcd(n, d); return d / divisor === 1 ? String(n / divisor) : `${n / divisor}/${d / divisor}`; }
export const isFractionAnswer = (skill: MathSkill) => ['fractionMeaning', 'equivalence', 'fractionAddition'].includes(skill);

// All exercises and answers are computed locally. No generated answer key or AI call.
export function makeQuestion(skill: MathSkill, id: string, random = Math.random): MathQuestion {
  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const denominators = [2, 3, 4, 6, 8];
  const b = denominators[int(0, denominators.length - 1)];
  const d = denominators[int(0, denominators.length - 1)];
  const q = { id, skill, a: int(1, b - 1), b, c: int(1, d - 1), d };
  if (skill === 'addition') { q.a = int(12, 69); q.b = int(12, 29); }
  if (skill === 'subtraction') { q.a = int(40, 89); q.b = int(12, 39); }
  if (skill === 'multiplication') { q.a = int(2, 12); q.b = int(2, 9); }
  if (skill === 'division') { q.b = int(2, 9); q.a = q.b * int(2, 12); }
  if (skill === 'equivalence') { const factor = int(2, 4); q.a *= factor; q.b *= factor; }
  return q;
}
export function questionPrompt(q: MathQuestion): string {
  switch (q.skill) {
    case 'addition': return `${q.a} + ${q.b} = ?`;
    case 'subtraction': return `${q.a} − ${q.b} = ?`;
    case 'multiplication': return `${q.a} × ${q.b} = ?`;
    case 'division': return `${q.a} ÷ ${q.b} = ?`;
    case 'fractionMeaning': return 'What fraction of the bar is shaded?';
    case 'equivalence': return `Write ${q.a}/${q.b} in its simplest form.`;
    case 'comparison': return `${q.a}/${q.b}  ?  ${q.c}/${q.d}`;
    case 'fractionAddition': return `${q.a}/${q.b} + ${q.c}/${q.d} = ?`;
  }
}
export function expectedAnswer(q: MathQuestion): [number, number] {
  switch (q.skill) {
    case 'addition': return [q.a + q.b, 1];
    case 'subtraction': return [q.a - q.b, 1];
    case 'multiplication': return [q.a * q.b, 1];
    case 'division': return [q.a / q.b, 1];
    case 'fractionMeaning': case 'equivalence': return [q.a, q.b];
    case 'fractionAddition': return [q.a * q.d + q.c * q.b, q.b * q.d];
    case 'comparison': return [Math.sign(q.a * q.d - q.c * q.b), 1];
  }
}
export function answerLabel(q: MathQuestion): string {
  const [n, d] = expectedAnswer(q);
  return q.skill === 'comparison' ? n === 0 ? '=' : n < 0 ? '<' : '>' : fraction(n, d);
}
export function gradeAnswer(q: MathQuestion, numerator: string, denominator = ''): { valid: boolean; correct: boolean; message: string } {
  if (q.skill === 'comparison') return { valid: ['<', '=', '>'].includes(numerator), correct: numerator === answerLabel(q), message: 'Choose <, =, or >.' };
  if (!/^\d{1,6}$/.test(numerator) || (isFractionAnswer(q.skill) && !/^\d{1,6}$/.test(denominator))) return { valid: false, correct: false, message: isFractionAnswer(q.skill) ? 'Enter a numerator and denominator. Use 1 below a whole number.' : 'Enter a whole number.' };
  const n = Number(numerator), d = isFractionAnswer(q.skill) ? Number(denominator) : 1;
  if (!d) return { valid: false, correct: false, message: 'A denominator cannot be zero.' };
  const [expectedN, expectedD] = expectedAnswer(q);
  if (n * expectedD !== expectedN * d) return { valid: true, correct: false, message: 'Let’s work through it together.' };
  if (q.skill === 'equivalence' && gcd(n, d) !== 1) return { valid: false, correct: false, message: 'That fraction has the right value. Divide both numbers by a common factor to give its simplest form.' };
  return { valid: true, correct: true, message: 'Correct.' };
}

export function solutionSteps(q: MathQuestion): string[] {
  const tens = Math.floor(q.b / 10) * 10, units = q.b % 10;
  switch (q.skill) {
    case 'addition': return [`Break ${q.b} into ${tens} + ${units}.`, `${q.a} + ${tens} = ${q.a + tens}.`, `${q.a + tens} + ${units} = ${q.a + q.b}.`];
    case 'subtraction': return [`Subtract ${tens} first, then ${units}.`, `${q.a} − ${tens} = ${q.a - tens}.`, `${q.a - tens} − ${units} = ${q.a - q.b}. Check: ${q.a - q.b} + ${q.b} = ${q.a}.`];
    case 'multiplication': { const half = Math.floor(q.a / 2); return [`Split ${q.a} into ${half} + ${q.a - half}.`, `${half} × ${q.b} = ${half * q.b}; ${q.a - half} × ${q.b} = ${(q.a - half) * q.b}.`, `Add the products: ${half * q.b} + ${(q.a - half) * q.b} = ${q.a * q.b}.`]; }
    case 'division': return [`Ask: how many groups of ${q.b} make ${q.a}?`, `${q.b} × ${q.a / q.b} = ${q.a}.`, `So ${q.a} ÷ ${q.b} = ${q.a / q.b}.`];
    case 'fractionMeaning': return [`The whole bar has ${q.b} equal parts. This is the denominator.`, `${q.a} parts are shaded. This is the numerator.`, `The shaded amount is ${q.a}/${q.b}, equivalent to ${answerLabel(q)}.`];
    case 'equivalence': { const factor = gcd(q.a, q.b); return [`Divide the numerator and denominator by the same number.`, `${q.a} and ${q.b} both divide by ${factor}.`, `${q.a} ÷ ${factor} = ${q.a / factor}; ${q.b} ÷ ${factor} = ${q.b / factor}. Answer: ${answerLabel(q)}.`]; }
    case 'comparison': return [`Compare equal-sized pieces using a common denominator of ${q.b * q.d}.`, `${q.a}/${q.b} = ${q.a * q.d}/${q.b * q.d}; ${q.c}/${q.d} = ${q.c * q.b}/${q.b * q.d}.`, `${q.a * q.d} ${answerLabel(q)} ${q.c * q.b}, so ${q.a}/${q.b} ${answerLabel(q)} ${q.c}/${q.d}.`];
    case 'fractionAddition': { const common = q.b * q.d / gcd(q.b, q.d); const left = q.a * common / q.b, right = q.c * common / q.d; return [`The pieces must have the same size. Use denominator ${common}.`, `${q.a}/${q.b} = ${left}/${common}; ${q.c}/${q.d} = ${right}/${common}.`, `Add the numerators, keeping the denominator: (${left} + ${right})/${common} = ${answerLabel(q)}.`]; }
  }
}
export function mistakeHint(q: MathQuestion, numerator: string, denominator: string): string {
  if (q.skill === 'fractionAddition' && Number(numerator) === q.a + q.c && Number(denominator) === q.b + q.d) return 'This answer adds both denominators. First make the pieces the same size, then add only the numerators.';
  if (q.skill === 'fractionMeaning' && Number(numerator) === q.b && Number(denominator) === q.a) return 'The shaded parts go on top. The total number of equal parts goes below.';
  return 'Compare your working with the steps below. Try the method on the next question.';
}
export function skillStats(attempts: MathAttempt[], skill: MathSkill) {
  const recent = attempts.filter(item => item.question.skill === skill).slice(-10);
  const independent = recent.filter(item => item.correct && !item.helped && !item.skipped);
  return { count: recent.length, correct: independent.length, accuracy: recent.length ? Math.round(independent.length / recent.length * 100) : null,
    seconds: independent.length ? Math.round(independent.reduce((sum, item) => sum + item.seconds, 0) / independent.length * 10) / 10 : null,
    speedReady: recent.length === 10 && independent.length >= 9 };
}
export function weakestSkill(attempts: MathAttempt[]): MathSkill {
  return [...SKILLS].sort((a, b) => (skillStats(attempts, a).accuracy ?? -1) - (skillStats(attempts, b).accuracy ?? -1))[0];
}
export function mistakesForReview(attempts: MathAttempt[]): MathQuestion[] {
  const latest = new Map<string, MathAttempt>();
  attempts.forEach(item => latest.set(item.question.id, item));
  return [...latest.values()].filter(item => !item.correct || item.helped).slice(-12).map(item => item.question);
}
export function createCoachSession(mode: CoachMode, skill: MathSkill, attempts: MathAttempt[], now = Date.now()): CoachSession {
  const id = `${now}-${Math.random().toString(36).slice(2, 7)}`;
  const plan: MathSkill[] = mode === 'check' ? [...SKILLS, 'addition', 'subtraction', 'multiplication', 'fractionAddition'] : Array.from({ length: mode === 'speed' ? 100 : 8 }, () => skill);
  const questions = mode === 'review' ? mistakesForReview(attempts) : plan.map((item, index) => makeQuestion(item, `${id}-${index}`));
  return { id, mode, skill, questions, index: 0, numerator: '', denominator: '', scratch: '', helped: false, feedback: null, startedAt: now, seconds: 0, deadline: mode === 'speed' ? now + 60000 : null, finished: !questions.length };
}

function validQuestion(value: any): value is MathQuestion {
  return value && typeof value.id === 'string' && SKILLS.includes(value.skill) && ['a','b','c','d'].every(key => Number.isInteger(value[key]) && value[key] > 0 && value[key] <= 200);
}
export function parseCoachState(raw: string | null): CoachState {
  try {
    const data = JSON.parse(raw || '{}');
    const state = emptyCoachState();
    if (!data || typeof data !== 'object') return state;
    state.checkCompleted = data.checkCompleted === true;
    if (Array.isArray(data.attempts)) state.attempts = data.attempts.filter((item: any) => validQuestion(item?.question) && typeof item.correct === 'boolean' && typeof item.helped === 'boolean' && typeof item.skipped === 'boolean' && Number.isFinite(item.seconds) && item.seconds >= 0 && Number.isFinite(item.at)).slice(-500);
    const s = data.session;
    if (s && typeof s.id === 'string' && ['check','practice','review','speed'].includes(s.mode) && SKILLS.includes(s.skill) &&
      Array.isArray(s.questions) && s.questions.length > 0 && s.questions.length <= 100 && s.questions.every(validQuestion) && Number.isInteger(s.index) && s.index >= 0 && s.index < s.questions.length &&
      ['numerator','denominator','scratch'].every(key => typeof s[key] === 'string') && typeof s.helped === 'boolean' && typeof s.finished === 'boolean' &&
      [null,'correct','incorrect','skipped'].includes(s.feedback) && Number.isFinite(s.startedAt) && Number.isFinite(s.seconds) && s.seconds >= 0 && (s.mode === 'speed' ? Number.isFinite(s.deadline) : s.deadline === null)) state.session = s;
    return state;
  } catch { return emptyCoachState(); }
}
