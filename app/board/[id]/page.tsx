import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { boards, lists, cards } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { BoardHeader } from "@/components/Board/BoardHeader";
import { BoardCanvas } from "@/components/Board/BoardCanvas";

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

  const boardCards = await db
    .select()
    .from(cards)
    .where(eq(cards.archived, false))
    .orderBy(cards.position);

  const cardsByList = new Map(
    boardLists.map((l) => [l.id, boardCards.filter((c) => c.listId === l.id)])
  );

  return (
    <div className="flex flex-col h-full">
      <BoardHeader id={board.id} title={board.title} />
      <BoardCanvas
        boardId={boardId}
        lists={boardLists}
        initialCardsByList={cardsByList}
      />
    </div>
  );
}
