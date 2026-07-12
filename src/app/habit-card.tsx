"use client";

import Link from "next/link";
import { useState } from "react";
import type { Habit } from "@/db/schema";
import { checkIn, undoCheckIn } from "@/lib/actions";

interface Props {
  habit: Habit;
  checkedIn: boolean;
  todayAmount: number | null;
  todayNote: string | null;
  currentStreak: number;
}

export function HabitCard({ habit, checkedIn, todayAmount, todayNote, currentStreak }: Props) {
  const measurable = !!habit.unit;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (measurable) {
              // Measurable habits need an amount, so the circle opens the form.
              setExpanded((v) => !v);
            } else if (checkedIn) {
              undoCheckIn(habit.id);
            } else {
              checkIn(habit.id, new FormData());
            }
          }}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition ${
            checkedIn
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-stone-300 hover:border-emerald-400 dark:border-stone-600"
          }`}
          aria-label={checkedIn ? "Undo or edit check-in" : "Check in"}
        >
          {checkedIn ? "✓" : ""}
        </button>

        <div className="min-w-0 flex-1">
          <Link href={`/habits/${habit.id}`} className="font-medium hover:underline">
            {habit.emoji ? `${habit.emoji} ` : ""}
            {habit.name}
          </Link>
          <div className="text-xs text-stone-500">
            {measurable && checkedIn && todayAmount != null && (
              <span>
                {todayAmount}
                {habit.targetAmount ? ` / ${habit.targetAmount}` : ""} {habit.unit} today ·{" "}
              </span>
            )}
            {measurable && !checkedIn && habit.targetAmount && (
              <span>
                goal: {habit.targetAmount} {habit.unit} ·{" "}
              </span>
            )}
            {currentStreak > 0 ? `🔥 ${currentStreak}-day streak` : "no streak yet"}
            {todayNote && <span> · 📝 {todayNote}</span>}
          </div>
        </div>

        {!measurable && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            {expanded ? "close" : "note"}
          </button>
        )}
      </div>

      {expanded && (
        <form
          action={async (formData) => {
            await checkIn(habit.id, formData);
            setExpanded(false);
          }}
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 dark:border-stone-800"
        >
          {measurable && (
            <input
              name="amount"
              type="number"
              step="any"
              required
              defaultValue={todayAmount ?? ""}
              placeholder={habit.unit ?? "amount"}
              className="w-28 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
            />
          )}
          <input
            name="note"
            type="text"
            defaultValue={todayNote ?? ""}
            placeholder="note (optional)"
            className="min-w-40 flex-1 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
          />
          <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            Save
          </button>
          {measurable && checkedIn && (
            <button
              type="button"
              onClick={() => {
                undoCheckIn(habit.id);
                setExpanded(false);
              }}
              className="text-sm text-stone-500 hover:underline"
            >
              Uncheck
            </button>
          )}
        </form>
      )}
    </div>
  );
}
