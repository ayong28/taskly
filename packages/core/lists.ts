import { db } from "./db";
import { lists, cards } from "./schema";
import { eq, and, max } from "drizzle-orm";

export async function getOrCreateSpecialList(boardId: number, title: string) {
  const [existing] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.boardId, boardId), eq(lists.special, true), eq(lists.title, title)));
  if (existing) return existing;

  const [result] = await db
    .select({ maxPos: max(lists.position) })
    .from(lists)
    .where(eq(lists.boardId, boardId));
  const nextPos = (result?.maxPos ?? 0) + 1;

  const [created] = await db
    .insert(lists)
    .values({ boardId, title, position: nextPos, special: true })
    .returning();
  return created;
}

export async function createListCore(boardId: number, title: string) {
  const [result] = await db
    .select({ maxPos: max(lists.position) })
    .from(lists)
    .where(eq(lists.boardId, boardId));

  const nextPos = (result?.maxPos ?? 0) + 1;
  await db.insert(lists).values({ boardId, title, position: nextPos });
}

export async function renameListCore(id: number, title: string) {
  await db.update(lists).set({ title }).where(eq(lists.id, id));
}

export async function deleteListCore(id: number, boardId: number) {
  const listCards = await db.select().from(cards).where(eq(cards.listId, id));

  if (listCards.length) {
    const archivedList = await getOrCreateSpecialList(boardId, "Archived");
    const [result] = await db
      .select({ maxPos: max(cards.position) })
      .from(cards)
      .where(eq(cards.listId, archivedList.id));
    let nextPos = (result?.maxPos ?? 0) + 1;

    for (const card of listCards) {
      await db
        .update(cards)
        .set({ archived: true, originalListId: card.listId, listId: archivedList.id, position: nextPos })
        .where(eq(cards.id, card.id));
      nextPos += 1;
    }
  }

  await db.delete(lists).where(eq(lists.id, id));
}
