import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { boards, lists } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { BoardHeader } from "@/components/Board/BoardHeader";
import { ListHeader } from "@/components/List/ListHeader";
import { AddListButton } from "@/components/List/AddListButton";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const boardId = parseInt(id, 10);

  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.archived, false)));

  if (!board) notFound();

  const boardLists = await db
    .select()
    .from(lists)
    .where(eq(lists.boardId, boardId))
    .orderBy(lists.position);

  return (
    <div className="flex flex-col h-full">
      <BoardHeader id={board.id} title={board.title} />

      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {boardLists.map((list) => (
          <div key={list.id} className="w-72 shrink-0 rounded-lg bg-gray-100 flex flex-col">
            <ListHeader id={list.id} title={list.title} boardId={boardId} />
            <div className="flex-1 px-3 pb-3" />
          </div>
        ))}
        <AddListButton boardId={boardId} />
      </div>
    </div>
  );
}
