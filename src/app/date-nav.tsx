"use client";

import { useRouter } from "next/navigation";
import { addDays } from "@/lib/dates";

export function DateNav({ date, todayDate }: { date: string; todayDate: string }) {
  const router = useRouter();
  const go = (d: string) => router.push(d === todayDate ? "/" : `/?date=${d}`);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => go(addDays(date, -1))}
        aria-label="Previous day"
        className="rounded-md border border-stone-300 px-2 py-1 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
      >
        ‹
      </button>
      <input
        type="date"
        value={date}
        max={todayDate}
        onChange={(e) => e.target.value && e.target.value <= todayDate && go(e.target.value)}
        className="rounded-md border border-stone-300 bg-transparent px-2 py-1 text-sm dark:border-stone-700"
      />
      <button
        onClick={() => go(addDays(date, 1))}
        disabled={date >= todayDate}
        aria-label="Next day"
        className="rounded-md border border-stone-300 px-2 py-1 text-sm hover:bg-stone-100 disabled:opacity-40 dark:border-stone-700 dark:hover:bg-stone-800"
      >
        ›
      </button>
      {date !== todayDate && (
        <button
          onClick={() => go(todayDate)}
          className="ml-1 text-sm text-emerald-600 hover:underline dark:text-emerald-400"
        >
          Today
        </button>
      )}
    </div>
  );
}
