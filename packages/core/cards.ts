import { db } from "./db";
import { cards, lists } from "./schema";
import { eq, and, max } from "drizzle-orm";
import { getOrCreateSpecialList } from "./lists";

async function nextPositionInList(listId: number): Promise<number> {
  const [result] = await db
    .select({ maxPos: max(cards.position) })
    .from(cards)
    .where(eq(cards.listId, listId));
  return (result?.maxPos ?? 0) + 1;
}

export async function createCardCore(
  listId: number,
  title: string,
  fields?: { description?: string | null; dueDate?: string | null }
) {
  const nextPos = await nextPositionInList(listId);
  const [created] = await db
    .insert(cards)
    .values({
      listId,
      title,
      position: nextPos,
      archived: false,
      description: fields?.description ?? null,
      dueDate: fields?.dueDate ?? null,
    })
    .returning();
  return created;
}

export async function updateCardCore(
  id: number,
  fields: { title: string; description?: string | null; dueDate?: string | null }
) {
  await db
    .update(cards)
    .set({
      title: fields.title,
      description: fields.description ?? null,
      dueDate: fields.dueDate ?? null,
    })
    .where(eq(cards.id, id));
}

export async function deleteCardCore(id: number) {
  await db.delete(cards).where(eq(cards.id, id));
}

export async function archiveCardCore(id: number, boardId: number) {
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
}

export async function restoreCardCore(id: number, boardId: number) {
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
}

export async function moveCardCore(id: number, newListId: number) {
  const nextPos = await nextPositionInList(newListId);
  await db.update(cards).set({ listId: newListId, position: nextPos }).where(eq(cards.id, id));
}
