"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { checkins, habits } from "@/db/schema";
import { today } from "./dates";

// Middleware is the first gate; every action re-checks the session anyway.
async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const s = value?.toString().trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const s = value?.toString().trim();
  return s ? s : null;
}

export async function createHabit(formData: FormData) {
  await requireSession();
  const name = formData.get("name")?.toString().trim();
  if (!name) return;

  await db.insert(habits).values({
    name,
    emoji: optionalText(formData.get("emoji")),
    description: optionalText(formData.get("description")),
    unit: optionalText(formData.get("unit")),
    targetAmount: optionalNumber(formData.get("targetAmount")),
  });
  revalidatePath("/");
  revalidatePath("/habits");
}

export async function updateHabit(habitId: number, formData: FormData) {
  await requireSession();
  const name = formData.get("name")?.toString().trim();
  if (!name) return;

  await db
    .update(habits)
    .set({
      name,
      emoji: optionalText(formData.get("emoji")),
      description: optionalText(formData.get("description")),
      unit: optionalText(formData.get("unit")),
      targetAmount: optionalNumber(formData.get("targetAmount")),
    })
    .where(eq(habits.id, habitId));
  revalidatePath("/");
  revalidatePath("/habits");
  revalidatePath(`/habits/${habitId}`);
}

export async function setArchived(habitId: number, archived: boolean) {
  await requireSession();
  await db
    .update(habits)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(habits.id, habitId));
  revalidatePath("/");
  revalidatePath("/habits");
}

export async function deleteHabit(habitId: number) {
  await requireSession();
  await db.delete(habits).where(eq(habits.id, habitId));
  revalidatePath("/");
  revalidatePath("/habits");
}

/** Create or update today's check-in (idempotent via the unique habit+date constraint). */
export async function checkIn(habitId: number, formData: FormData) {
  await requireSession();
  const date = today();
  const amount = optionalNumber(formData.get("amount"));
  const note = optionalText(formData.get("note"));

  await db
    .insert(checkins)
    .values({ habitId, date, amount, note })
    .onConflictDoUpdate({
      target: [checkins.habitId, checkins.date],
      set: { amount, note },
    });
  revalidatePath("/");
  revalidatePath(`/habits/${habitId}`);
}

/** Remove today's check-in (uncheck). */
export async function undoCheckIn(habitId: number) {
  await requireSession();
  await db
    .delete(checkins)
    .where(and(eq(checkins.habitId, habitId), eq(checkins.date, today())));
  revalidatePath("/");
  revalidatePath(`/habits/${habitId}`);
}
