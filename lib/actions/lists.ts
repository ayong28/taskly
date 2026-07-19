"use server";

import { revalidatePath } from "next/cache";
import { createListCore, renameListCore, deleteListCore } from "@/lib/core/lists";

export async function createList(boardId: number, title: string) {
  await createListCore(boardId, title);
  revalidatePath(`/board/${boardId}`);
}

export async function renameList(id: number, title: string, boardId: number) {
  await renameListCore(id, title);
  revalidatePath(`/board/${boardId}`);
}

export async function deleteList(id: number, boardId: number) {
  await deleteListCore(id, boardId);
  revalidatePath(`/board/${boardId}`);
}
