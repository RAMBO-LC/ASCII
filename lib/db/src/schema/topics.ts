import { randomUUID } from "node:crypto";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const topicsTable = pgTable("MargUp_topics", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  techStack: text("tech_stack").array().notNull().default([]),
  roadmapRef: text("roadmap_ref"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Topic = typeof topicsTable.$inferSelect;
