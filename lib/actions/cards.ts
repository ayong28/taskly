"use server";

import { db } from "@/lib/db";
import { cards } from "@/lib/schema";
import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
