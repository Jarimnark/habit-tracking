import { and, eq, isNull } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { checkins, habits, pushSubscriptions } from "@/db/schema";
import { today } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Hit daily by Vercel Cron (see vercel.json). Sends a push to every
// subscribed device listing the habits still unchecked today; sends
// nothing when everything is already done.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return Response.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  const date = today();
  const pending = await db
    .select({ name: habits.name, emoji: habits.emoji })
    .from(habits)
    .leftJoin(checkins, and(eq(checkins.habitId, habits.id), eq(checkins.date, date)))
    .where(and(isNull(habits.archivedAt), isNull(checkins.id)));

  if (pending.length === 0) {
    return Response.json({ sent: 0, reason: "all habits already checked in" });
  }

  const subscriptions = await db.select().from(pushSubscriptions);
  if (subscriptions.length === 0) {
    return Response.json({ sent: 0, reason: "no subscribed devices" });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:habits@example.com",
    publicKey,
    privateKey,
  );

  const names = pending.map((h) => (h.emoji ? `${h.emoji} ${h.name}` : h.name));
  const payload = JSON.stringify({
    title: `${pending.length} habit${pending.length > 1 ? "s" : ""} waiting`,
    body: names.join(", "),
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      // The browser revoked this subscription — clean it up.
      if (status === 404 || status === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }

  return Response.json({ sent, pending: pending.length });
}
