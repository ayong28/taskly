import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const boards = sqliteTable("boards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  color: text("color").notNull().default("slate"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const lists = sqliteTable("lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: real("position").notNull(),
  // Marks auto-created "Archived"/"Restored" lists as protected from rename/delete.
  special: integer("special", { mode: "boolean" }).notNull().default(false),
});

export const cards = sqliteTable("cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listId: integer("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  priority: text("priority", { enum: ["high", "medium", "low"] }),
  position: real("position").notNull(),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  // Plain integer, deliberately not a FK: must survive the referenced list
  // being deleted so restoreCard can detect "original list no longer exists".
  originalListId: integer("original_list_id"),
});

export const labels = sqliteTable("labels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const cardLabels = sqliteTable("card_labels", {
  cardId: integer("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  labelId: integer("label_id")
    .notNull()
    .references(() => labels.id, { onDelete: "cascade" }),
});
