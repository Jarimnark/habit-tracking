import {
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji"),
  description: text("description"),
  // A habit with a unit (e.g. "minutes", "km") is measurable; its check-ins carry an amount.
  unit: text("unit"),
  targetAmount: doublePrecision("target_amount"),
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const checkins = pgTable(
  "checkins",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    // Local calendar day (resolved via APP_TIMEZONE), not a timestamp.
    date: date("date").notNull(),
    amount: doublePrecision("amount"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("checkins_habit_date_idx").on(t.habitId, t.date)],
);

// One row per browser/device that enabled the daily reminder.
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Habit = typeof habits.$inferSelect;
export type Checkin = typeof checkins.$inferSelect;
