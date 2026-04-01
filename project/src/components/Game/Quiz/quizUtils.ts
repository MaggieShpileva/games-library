import type { Difficulty, QuizCategory, QuizQuestion } from './quizBank';
import { BANK } from './quizBank';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export function finalize(items: QuizQuestion[]): QuizQuestion[] {
  return items.map((q) => {
    const pairs = q.a.map((t, i) => ({ t, i }));
    const sh = shuffle(pairs);
    const newIdx = sh.findIndex((p) => p.i === q.c);
    return { ...q, a: sh.map((p) => p.t), c: newIdx };
  });
}

function byDifficulty(list: QuizQuestion[], d: Difficulty) {
  return list.filter((x) => x.d === d);
}

export function buildStandard(
  cat: QuizCategory,
  diff: 'easy' | 'medium' | 'hard' | 'mixed',
  shuffleQ: boolean,
  count: number
): QuizQuestion[] {
  const pool = BANK[cat];
  let items: QuizQuestion[] = [...pool];
  if (diff !== 'mixed') items = items.filter((x) => x.d === diff);
  if (shuffleQ) items = shuffle(items);
  const n = clamp(count, 6, 24);
  return finalize(items.slice(0, n));
}

export function buildMultiRound(
  cat: QuizCategory,
  total: number
): QuizQuestion[] {
  const pool = BANK[cat];
  const n = clamp(total, 6, 24);
  const per = Math.max(2, Math.floor(n / 3));
  const r1 = shuffle(byDifficulty(pool, 'easy')).slice(0, per);
  const r2 = shuffle(byDifficulty(pool, 'medium')).slice(0, per);
  const r3 = shuffle(byDifficulty(pool, 'hard')).slice(0, per);
  const items = [...r1, ...r2, ...r3].slice(0, n);
  return finalize(items);
}
