import { asc, isNull } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { checkins, habits } from "@/db/schema";
import { addDays, today } from "@/lib/dates";
import { computeStreaks } from "@/lib/streaks";
import { Heatmap, type HeatmapEntry } from "./heatmap";
import { ReminderToggle } from "./reminder-toggle";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const end = today();
  const windowStart = addDays(end, -29); // last 30 days, inclusive

  const activeHabits = await db
    .select()
    .from(habits)
    .where(isNull(habits.archivedAt))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));

  const allCheckins = await db
    .select({
      habitId: checkins.habitId,
      date: checkins.date,
      amount: checkins.amount,
      note: checkins.note,
    })
    .from(checkins);

  const byHabit = new Map<number, Map<string, HeatmapEntry>>();
  for (const c of allCheckins) {
    const m = byHabit.get(c.habitId) ?? new Map<string, HeatmapEntry>();
    m.set(c.date, { amount: c.amount, note: c.note });
    byHabit.set(c.habitId, m);
  }

  const perHabit = activeHabits.map((habit) => {
    const entries = byHabit.get(habit.id) ?? new Map<string, HeatmapEntry>();
    const dates = [...entries.keys()];
    const streaks = computeStreaks(dates, end);
    // Denominator starts at the habit's creation day so new habits aren't
    // penalized for days before they existed.
    const createdDate = habit.createdAt.toISOString().slice(0, 10);
    const effectiveStart = createdDate > windowStart ? createdDate : windowStart;
    const daysInWindow =
      Math.round(
        (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${effectiveStart}T00:00:00Z`)) / 86400000,
      ) + 1;
    const doneInWindow = dates.filter((d) => d >= effectiveStart && d <= end).length;
    const rate = daysInWindow > 0 ? Math.round((doneInWindow / daysInWindow) * 100) : 0;
    return { habit, entries, streaks, rate, doneInWindow };
  });

  const totalDone30 = perHabit.reduce((sum, h) => sum + h.doneInWindow, 0);
  const avgRate =
    perHabit.length > 0
      ? Math.round(perHabit.reduce((sum, h) => sum + h.rate, 0) / perHabit.length)
      : 0;
  const bestCurrentStreak = perHabit.reduce((max, h) => Math.max(max, h.streaks.current), 0);

  const tiles = [
    { label: "Active habits", value: String(perHabit.length) },
    { label: "Check-ins · 30 days", value: String(totalDone30) },
    { label: "Completion · 30 days", value: `${avgRate}%` },
    { label: "Longest current streak", value: String(bestCurrentStreak) },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
          >
            <dt className="text-xs text-stone-500">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {perHabit.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">
          No habits yet.{" "}
          <Link href="/habits" className="underline">
            Create one
          </Link>{" "}
          to see analytics.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {perHabit.map(({ habit, entries, streaks, rate }) => (
            <div
              key={habit.id}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/habits/${habit.id}`} className="font-medium hover:underline">
                  {habit.emoji ? `${habit.emoji} ` : ""}
                  {habit.name}
                </Link>
                <p className="text-xs text-stone-500">
                  {rate}% · 30 days&ensp;·&ensp;🔥 {streaks.current} current&ensp;·&ensp;best{" "}
                  {streaks.best}
                </p>
              </div>
              <div className="mt-3">
                <Heatmap
                  entries={entries}
                  end={end}
                  unit={habit.unit}
                  targetAmount={habit.targetAmount}
                />
              </div>
              <p className="mt-2 text-[11px] text-stone-400">last 13 weeks</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h2 className="text-sm font-medium">Daily reminder</h2>
        <p className="mt-1 text-xs text-stone-500">
          Get a push notification each evening if any habit is still unchecked.
        </p>
        <div className="mt-3">
          <ReminderToggle vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
        </div>
      </div>
    </div>
  );
}
