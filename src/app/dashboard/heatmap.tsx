import { addDays } from "@/lib/dates";

export interface HeatmapEntry {
  amount: number | null;
  note: string | null;
}

interface Props {
  /** date (YYYY-MM-DD) → check-in for that day */
  entries: Map<string, HeatmapEntry>;
  end: string;
  weeks?: number;
  unit: string | null;
  targetAmount: number | null;
}

// Sequential single-hue ramp (more = darker toward the mode's ink), plus an
// empty step that recedes toward the surface. Level 3 = goal met / done.
const LEVELS = [
  "bg-stone-200 dark:bg-stone-800",
  "bg-emerald-200 dark:bg-emerald-900",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-600 dark:bg-emerald-500",
];

function level(entry: HeatmapEntry | undefined, targetAmount: number | null): number {
  if (!entry) return 0;
  if (targetAmount && entry.amount != null) {
    const ratio = entry.amount / targetAmount;
    if (ratio >= 1) return 3;
    if (ratio >= 0.5) return 2;
    return 1;
  }
  return 3;
}

/** GitHub-style calendar grid: columns are weeks, rows Sun–Sat, ending at `end`. */
export function Heatmap({ entries, end, weeks = 13, unit, targetAmount }: Props) {
  // Snap the window start back to a Sunday so columns are whole weeks.
  let start = addDays(end, -(weeks * 7 - 1));
  start = addDays(start, -new Date(`${start}T00:00:00Z`).getUTCDay());

  const columns: string[][] = [];
  let cursor = start;
  while (cursor <= end) {
    const week: string[] = [];
    for (let i = 0; i < 7 && cursor <= end; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    columns.push(week);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex w-max gap-[3px]" role="img" aria-label={`Check-ins, last ${weeks} weeks`}>
        {columns.map((week, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {week.map((day) => {
              const entry = entries.get(day);
              const l = level(entry, targetAmount);
              const detail = entry
                ? unit && entry.amount != null
                  ? `${entry.amount} ${unit}`
                  : "done"
                : "—";
              return (
                <div
                  key={day}
                  title={`${day}: ${detail}${entry?.note ? ` · ${entry.note}` : ""}`}
                  className={`h-3 w-3 rounded-[3px] ${LEVELS[l]}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
