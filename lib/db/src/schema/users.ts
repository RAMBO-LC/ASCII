import { date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("MargUp_users", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull().default("Learner"),
  currentGoal: text("current_goal")
    .notNull()
    .default("Build a strong foundation in modern web development"),
  streakCount: integer("streak_count").notNull().default(0),
  lastActive: date("last_active", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
