"use server";

import { db } from "@/lib/db";
import { cards, lists } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function moveCard(
  cardId: number,
  newListId: number,
  newPosition: number,
  boardId: number
) {
  await db
    .update(cards)
    .set({ listId: newListId, position: newPosition })
    .where(eq(cards.id, cardId));
  revalidatePath(`/board/${boardId}`);
}

export async function moveList(
  listId: number,
  newPosition: number,
  boardId: number
) {
  await db
    .update(lists)
    .set({ position: newPosition })
    .where(eq(lists.id, listId));
  revalidatePath(`/board/${boardId}`);
}
