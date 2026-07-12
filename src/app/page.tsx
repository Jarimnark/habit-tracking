import { asc, isNull } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { checkins, habits } from "@/db/schema";
import { today } from "@/lib/dates";
import { computeStreaks } from "@/lib/streaks";
import { DateNav } from "./date-nav";
import { HabitCard } from "./habit-card";

export const dynamic = "force-dynamic";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const todayDate = today();
  const { date: rawDate } = await searchParams;
  // Only well-formed, non-future dates; anything else falls back to today.
  const date =
    rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && rawDate <= todayDate
      ? rawDate
      : todayDate;

  const activeHabits = await db
    .select()
    .from(habits)
    .where(isNull(habits.archivedAt))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));

  const allCheckins = await db
    .select({ habitId: checkins.habitId, date: checkins.date, amount: checkins.amount, note: checkins.note })
    .from(checkins);

  const byHabit = new Map<number, { dates: string[]; selected?: { amount: number | null; note: string | null } }>();
  for (const c of allCheckins) {
    const entry = byHabit.get(c.habitId) ?? { dates: [] };
    entry.dates.push(c.date);
    if (c.date === date) entry.selected = { amount: c.amount, note: c.note };
    byHabit.set(c.habitId, entry);
  }

  const formatted = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          {formatted}
          {date !== todayDate && (
            <span className="ml-2 align-middle text-xs font-normal text-amber-600 dark:text-amber-400">
              editing a past day
            </span>
          )}
        </h1>
        <DateNav date={date} todayDate={todayDate} />
      </div>

      {activeHabits.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">
          No habits yet.{" "}
          <Link href="/habits" className="underline">
            Create your first habit
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {activeHabits.map((habit) => {
            const entry = byHabit.get(habit.id) ?? { dates: [] };
            const streaks = computeStreaks(entry.dates, todayDate);
            return (
              <li key={habit.id}>
                <HabitCard
                  habit={habit}
                  date={date}
                  checkedIn={!!entry.selected}
                  dayAmount={entry.selected?.amount ?? null}
                  dayNote={entry.selected?.note ?? null}
                  currentStreak={streaks.current}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
