import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const inboxes = pgTable("inboxes", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull().unique().references(() => usersTable.id),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio").notNull().default("Leave a little honesty. Make my day."),
  acceptingMessages: boolean("accepting_messages").notNull().default(true),
});
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  inboxId: integer("inbox_id").notNull().references(() => inboxes.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
  isFavorite: boolean("is_favorite").notNull().default(false),
});
// Abuse-control counters are deliberately separate from message records.
export const sendLimits = pgTable("send_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
