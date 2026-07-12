import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { checkins, habits } from "@/db/schema";
import { today } from "@/lib/dates";
import { computeStreaks } from "@/lib/streaks";

export const dynamic = "force-dynamic";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const habitId = Number(id);
  if (!Number.isInteger(habitId)) notFound();

  const [habit] = await db.select().from(habits).where(eq(habits.id, habitId));
  if (!habit) notFound();

  const history = await db
    .select()
    .from(checkins)
    .where(eq(checkins.habitId, habitId))
    .orderBy(desc(checkins.date));

  const streaks = computeStreaks(
    history.map((c) => c.date),
    today(),
  );

  return (
    <div>
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        ← Today
      </Link>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold">
          {habit.emoji ? `${habit.emoji} ` : ""}
          {habit.name}
        </h1>
        <Link
          href={`/habits/${habit.id}/edit`}
          className="text-sm text-stone-500 hover:underline"
        >
          Edit
        </Link>
      </div>
      {habit.description && (
        <p className="mt-1 text-sm text-stone-500">{habit.description}</p>
      )}

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Current streak", value: streaks.current },
          { label: "Best streak", value: streaks.best },
          { label: "Total check-ins", value: streaks.total },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
          >
            <dt className="text-xs text-stone-500">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-8 text-sm font-medium text-stone-500">History</h2>
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">No check-ins yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white shadow-sm dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
          {history.slice(0, 60).map((c) => (
            <li key={c.id} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
              <span className="w-28 shrink-0 tabular-nums text-stone-500">{c.date}</span>
              <span className="flex-1">
                {habit.unit && c.amount != null ? `${c.amount} ${habit.unit}` : "✓ done"}
                {c.note && <span className="text-stone-500"> — {c.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
