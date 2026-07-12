"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { checkins, habits, pushSubscriptions } from "@/db/schema";
import { isAuthed } from "./auth";
import { today } from "./dates";

// Middleware is the first gate; every action re-checks the session anyway.
async function requireSession() {
  if (!(await isAuthed())) throw new Error("Unauthorized");
}

/** Check-ins may target any past date, but never the future. */
function validateDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today()) {
    throw new Error("Invalid date");
  }
  return date;
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
  redirect("/habits");
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

/** Create or update a check-in for the given day (idempotent via the unique habit+date constraint). */
export async function checkIn(habitId: number, date: string, formData: FormData) {
  await requireSession();
  validateDate(date);
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
  revalidatePath("/dashboard");
  revalidatePath(`/habits/${habitId}`);
}

/** Remove a day's check-in (uncheck). */
export async function undoCheckIn(habitId: number, date: string) {
  await requireSession();
  validateDate(date);
  await db
    .delete(checkins)
    .where(and(eq(checkins.habitId, habitId), eq(checkins.date, date)));
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/habits/${habitId}`);
}

export async function savePushSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  await requireSession();
  await db
    .insert(pushSubscriptions)
    .values({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

export async function deletePushSubscription(endpoint: string) {
  await requireSession();
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
