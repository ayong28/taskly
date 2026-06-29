"use server";

import { db } from "@/lib/db";
import { lists } from "@/lib/schema";
import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createList(boardId: number, title: string) {
  const [result] = await db
    .select({ maxPos: max(lists.position) })
    .from(lists)
    .where(eq(lists.boardId, boardId));

  const nextPos = (result?.maxPos ?? 0) + 1;
  await db.insert(lists).values({ boardId, title, position: nextPos });
  revalidatePath(`/board/${boardId}`);
}

export async function renameList(id: number, title: string, boardId: number) {
  await db.update(lists).set({ title }).where(eq(lists.id, id));
  revalidatePath(`/board/${boardId}`);
}

export async function deleteList(id: number, boardId: number) {
  await db.delete(lists).where(eq(lists.id, id));
  revalidatePath(`/board/${boardId}`);
}
