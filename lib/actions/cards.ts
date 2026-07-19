"use server";

import { revalidatePath } from "next/cache";
import {
  createCardCore,
  updateCardCore,
  deleteCardCore,
  archiveCardCore,
  restoreCardCore,
} from "@/lib/core/cards";

export async function createCard(
  listId: number,
  title: string,
  boardId: number,
  fields?: { description?: string | null; dueDate?: string | null }
) {
  await createCardCore(listId, title, fields);
  revalidatePath(`/board/${boardId}`);
}

export async function updateCard(
  id: number,
  fields: { title: string; description?: string | null; dueDate?: string | null },
  boardId: number
) {
  await updateCardCore(id, fields);
  revalidatePath(`/board/${boardId}`);
}

export async function deleteCard(id: number, boardId: number) {
  await deleteCardCore(id);
  revalidatePath(`/board/${boardId}`);
}

export async function archiveCard(id: number, boardId: number) {
  await archiveCardCore(id, boardId);
  revalidatePath(`/board/${boardId}`);
}

export async function restoreCard(id: number, boardId: number) {
  await restoreCardCore(id, boardId);
  revalidatePath(`/board/${boardId}`);
}
