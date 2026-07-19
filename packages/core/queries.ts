import { db } from "./db";
import { boards, lists, cards } from "./schema";
import { eq } from "drizzle-orm";

export async function listBoards() {
  return db.select().from(boards);
}

export async function listListsForBoard(boardId: number) {
  return db.select().from(lists).where(eq(lists.boardId, boardId));
}

export async function listCardsForBoard(boardId: number) {
  return db
    .select({
      id: cards.id,
      listId: cards.listId,
      listTitle: lists.title,
      title: cards.title,
      description: cards.description,
      dueDate: cards.dueDate,
      priority: cards.priority,
      archived: cards.archived,
    })
    .from(cards)
    .innerJoin(lists, eq(cards.listId, lists.id))
    .where(eq(lists.boardId, boardId));
}

export async function getCard(id: number) {
  const [card] = await db.select().from(cards).where(eq(cards.id, id));
  return card ?? null;
}
