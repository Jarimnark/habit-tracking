import { asc, isNull } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { checkins, habits } from "@/db/schema";
import { today } from "@/lib/dates";
import { computeStreaks } from "@/lib/streaks";
import { HabitCard } from "./habit-card";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const date = today();

  const activeHabits = await db
    .select()
    .from(habits)
    .where(isNull(habits.archivedAt))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));

  const allCheckins = await db
    .select({ habitId: checkins.habitId, date: checkins.date, amount: checkins.amount, note: checkins.note })
    .from(checkins);

  const byHabit = new Map<number, { dates: string[]; today?: { amount: number | null; note: string | null } }>();
  for (const c of allCheckins) {
    const entry = byHabit.get(c.habitId) ?? { dates: [] };
    entry.dates.push(c.date);
    if (c.date === date) entry.today = { amount: c.amount, note: c.note };
    byHabit.set(c.habitId, entry);
  }

  const formatted = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <h1 className="text-xl font-semibold">{formatted}</h1>

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
            const streaks = computeStreaks(entry.dates, date);
            return (
              <li key={habit.id}>
                <HabitCard
                  habit={habit}
                  checkedIn={!!entry.today}
                  todayAmount={entry.today?.amount ?? null}
                  todayNote={entry.today?.note ?? null}
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
