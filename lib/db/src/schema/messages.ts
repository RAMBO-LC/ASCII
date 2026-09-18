import { randomUUID } from "node:crypto";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { topicsTable } from "./topics";

export const messagesTable = pgTable("MargUp_messages", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topicsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Message = typeof messagesTable.$inferSelect;
