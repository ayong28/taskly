"use server";

import { db } from "@/lib/db";
import { boards, lists } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const DEFAULT_LISTS = ["To Do", "In Progress", "Done"];

export async function createBoard(title: string) {
  const [board] = await db
    .insert(boards)
    .values({ title, color: "slate", archived: false, createdAt: new Date().toISOString() })
    .returning();

  for (let i = 0; i < DEFAULT_LISTS.length; i++) {
    await db.insert(lists).values({ boardId: board.id, title: DEFAULT_LISTS[i], position: i + 1 });
  }

  revalidatePath("/", "layout");
  return board;
}

export async function renameBoard(id: number, title: string) {
  await db.update(boards).set({ title }).where(eq(boards.id, id));
  revalidatePath("/", "layout");
}

export async function deleteBoard(id: number) {
  await db.delete(boards).where(eq(boards.id, id));
  revalidatePath("/", "layout");
}
