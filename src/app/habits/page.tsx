import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { createHabit, deleteHabit, setArchived } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const allHabits = await db
    .select()
    .from(habits)
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));

  const active = allHabits.filter((h) => !h.archivedAt);
  const archived = allHabits.filter((h) => h.archivedAt);

  return (
    <div>
      <h1 className="text-xl font-semibold">Habits</h1>

      <form
        action={createHabit}
        className="mt-6 space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
      >
        <h2 className="text-sm font-medium text-stone-500">New habit</h2>
        <div className="flex gap-2">
          <input
            name="emoji"
            placeholder="😀"
            maxLength={4}
            className="w-14 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-center text-sm dark:border-stone-700"
          />
          <input
            name="name"
            required
            placeholder="Habit name"
            className="flex-1 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
          />
        </div>
        <input
          name="description"
          placeholder="Description (optional)"
          className="w-full rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            name="unit"
            placeholder="Unit, e.g. minutes (leave empty for done/not-done)"
            className="min-w-64 flex-1 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
          />
          <input
            name="targetAmount"
            type="number"
            step="any"
            placeholder="Daily goal"
            className="w-28 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
          />
          <button className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            Add
          </button>
        </div>
      </form>

      <ul className="mt-6 space-y-2">
        {active.map((habit) => (
          <li
            key={habit.id}
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900"
          >
            <div className="min-w-0 flex-1">
              <Link href={`/habits/${habit.id}`} className="font-medium hover:underline">
                {habit.emoji ? `${habit.emoji} ` : ""}
                {habit.name}
              </Link>
              <p className="truncate text-xs text-stone-500">
                {habit.unit
                  ? `measurable · ${habit.unit}${habit.targetAmount ? ` · goal ${habit.targetAmount}` : ""}`
                  : "done / not done"}
                {habit.description ? ` · ${habit.description}` : ""}
              </p>
            </div>
            <form action={setArchived.bind(null, habit.id, true)}>
              <button className="text-xs text-stone-500 hover:underline">Archive</button>
            </form>
          </li>
        ))}
      </ul>

      {archived.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-stone-500">Archived</h2>
          <ul className="mt-2 space-y-2">
            {archived.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-100 p-3 text-stone-500 dark:border-stone-800 dark:bg-stone-900/50"
              >
                <span className="min-w-0 flex-1 truncate">
                  {habit.emoji ? `${habit.emoji} ` : ""}
                  {habit.name}
                </span>
                <form action={setArchived.bind(null, habit.id, false)}>
                  <button className="text-xs hover:underline">Restore</button>
                </form>
                <form action={deleteHabit.bind(null, habit.id)}>
                  <button className="text-xs text-red-500 hover:underline">
                    Delete forever
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
