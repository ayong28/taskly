"use server";

import { db } from "@taskly/core/db";
import { labels, cardLabels } from "@taskly/core/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Labels are global (not board-scoped), so callers pass the boardId only to
// know which board page to revalidate after a mutation.

export async function createLabel(name: string, color: string, boardId: number) {
  const [label] = await db.insert(labels).values({ name, color }).returning();
  revalidatePath(`/board/${boardId}`);
  return label;
}

export async function renameLabel(id: number, name: string, boardId: number) {
  await db.update(labels).set({ name }).where(eq(labels.id, id));
  revalidatePath(`/board/${boardId}`);
}

export async function deleteLabel(id: number, boardId: number) {
  await db.delete(labels).where(eq(labels.id, id));
  revalidatePath(`/board/${boardId}`);
}

export async function assignLabelToCard(cardId: number, labelId: number, boardId: number) {
  await db.insert(cardLabels).values({ cardId, labelId });
  revalidatePath(`/board/${boardId}`);
}

export async function removeLabelFromCard(cardId: number, labelId: number, boardId: number) {
  await db
    .delete(cardLabels)
    .where(and(eq(cardLabels.cardId, cardId), eq(cardLabels.labelId, labelId)));
  revalidatePath(`/board/${boardId}`);
}
