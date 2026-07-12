import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { updateHabit } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EditHabitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const habitId = Number(id);
  if (!Number.isInteger(habitId)) notFound();

  const [habit] = await db.select().from(habits).where(eq(habits.id, habitId));
  if (!habit) notFound();

  return (
    <div>
      <Link href="/habits" className="text-sm text-stone-500 hover:underline">
        ← Habits
      </Link>
      <h1 className="mt-2 text-xl font-semibold">Edit habit</h1>

      <form
        action={updateHabit.bind(null, habit.id)}
        className="mt-6 space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="flex gap-2">
          <input
            name="emoji"
            defaultValue={habit.emoji ?? ""}
            placeholder="😀"
            maxLength={4}
            className="w-14 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-center text-sm dark:border-stone-700"
          />
          <input
            name="name"
            required
            defaultValue={habit.name}
            placeholder="Habit name"
            className="flex-1 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
          />
        </div>
        <input
          name="description"
          defaultValue={habit.description ?? ""}
          placeholder="Description (optional)"
          className="w-full rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            name="unit"
            defaultValue={habit.unit ?? ""}
            placeholder="Unit, e.g. minutes (leave empty for done/not-done)"
            className="min-w-64 flex-1 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
          />
          <input
            name="targetAmount"
            type="number"
            step="any"
            defaultValue={habit.targetAmount ?? ""}
            placeholder="Daily goal"
            className="w-28 rounded-md border border-stone-300 bg-transparent px-2 py-1.5 text-sm dark:border-stone-700"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            Save changes
          </button>
          <Link href="/habits" className="text-sm text-stone-500 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
