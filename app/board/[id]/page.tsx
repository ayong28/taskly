import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { boards, lists, cards } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { BoardHeader } from "@/components/Board/BoardHeader";
import { ListHeader } from "@/components/List/ListHeader";
import { AddListButton } from "@/components/List/AddListButton";
import { AddCardButton } from "@/components/List/AddCardButton";
import { CardTile } from "@/components/Card/CardTile";

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
    .where(and(eq(cards.archived, false)))
    .orderBy(cards.position);

  const cardsByList = new Map(
    boardLists.map((l) => [l.id, boardCards.filter((c) => c.listId === l.id)])
  );

  return (
    <div className="flex flex-col h-full">
      <BoardHeader id={board.id} title={board.title} />

      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {boardLists.map((list) => (
          <div key={list.id} aria-label={`${list.title} list`} className="w-72 shrink-0 rounded-lg bg-gray-100 flex flex-col">
            <ListHeader id={list.id} title={list.title} boardId={boardId} />
            <div className="flex flex-col gap-2 px-3 pb-2">
              {cardsByList.get(list.id)?.map((card) => (
                <CardTile key={card.id} id={card.id} title={card.title} boardId={boardId} />
              ))}
            </div>
            <AddCardButton listId={list.id} boardId={boardId} />
          </div>
        ))}
        <AddListButton boardId={boardId} />
      </div>
    </div>
  );
}
