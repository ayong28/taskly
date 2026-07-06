"use server";

import { db } from "@/lib/db";
import { cards, lists } from "@/lib/schema";
import { eq, and, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getOrCreateSpecialList } from "@/lib/actions/lists";

async function nextPositionInList(listId: number): Promise<number> {
  const [result] = await db
    .select({ maxPos: max(cards.position) })
    .from(cards)
    .where(eq(cards.listId, listId));
  return (result?.maxPos ?? 0) + 1;
}

export async function createCard(listId: number, title: string, boardId: number) {
  const [result] = await db
    .select({ maxPos: max(cards.position) })
    .from(cards)
    .where(eq(cards.listId, listId));

  const nextPos = (result?.maxPos ?? 0) + 1;
  await db.insert(cards).values({ listId, title, position: nextPos, archived: false });
  revalidatePath(`/board/${boardId}`);
}

export async function renameCard(id: number, title: string, boardId: number) {
  await db.update(cards).set({ title }).where(eq(cards.id, id));
  revalidatePath(`/board/${boardId}`);
}

export async function deleteCard(id: number, boardId: number) {
  await db.delete(cards).where(eq(cards.id, id));
  revalidatePath(`/board/${boardId}`);
}

export async function archiveCard(id: number, boardId: number) {
  const [card] = await db.select().from(cards).where(eq(cards.id, id));
  const archivedList = await getOrCreateSpecialList(boardId, "Archived");
  const nextPos = await nextPositionInList(archivedList.id);

  await db
    .update(cards)
    .set({
      archived: true,
      originalListId: card.listId,
      listId: archivedList.id,
      position: nextPos,
    })
    .where(eq(cards.id, id));
  revalidatePath(`/board/${boardId}`);
}

export async function restoreCard(id: number, boardId: number) {
  const [card] = await db.select().from(cards).where(eq(cards.id, id));

  let targetListId: number;
  if (card.originalListId !== null) {
    const [originalList] = await db
      .select()
      .from(lists)
      .where(and(eq(lists.id, card.originalListId), eq(lists.boardId, boardId)));
    targetListId = originalList ? originalList.id : (await getOrCreateSpecialList(boardId, "Restored")).id;
  } else {
    targetListId = (await getOrCreateSpecialList(boardId, "Restored")).id;
  }

  const nextPos = await nextPositionInList(targetListId);

  await db
    .update(cards)
    .set({ archived: false, listId: targetListId, originalListId: null, position: nextPos })
    .where(eq(cards.id, id));
  revalidatePath(`/board/${boardId}`);
}
