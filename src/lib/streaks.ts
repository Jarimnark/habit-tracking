import { addDays } from "./dates";

export interface StreakStats {
  current: number;
  best: number;
  total: number;
}

/**
 * Compute streaks from a habit's check-in dates (YYYY-MM-DD, any order).
 * The current streak counts consecutive days ending at today or yesterday,
 * so it isn't shown as broken before today's check-in has happened.
 */
export function computeStreaks(dates: string[], todayDate: string): StreakStats {
  if (dates.length === 0) return { current: 0, best: 0, total: 0 };

  const sorted = [...new Set(dates)].sort();

  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === addDays(sorted[i - 1], 1) ? run + 1 : 1;
    if (run > best) best = run;
  }

  const set = new Set(sorted);
  let current = 0;
  let cursor = set.has(todayDate) ? todayDate : addDays(todayDate, -1);
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  return { current, best, total: sorted.length };
}
