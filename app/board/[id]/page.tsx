import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { boards, lists, cards, labels, cardLabels } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { BoardHeader } from "@/components/Board/BoardHeader";
import { BoardCanvas } from "@/components/Board/BoardCanvas";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const boardId = parseInt(id, 10);

  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));

  if (!board) notFound();

  const boardLists = await db
    .select()
    .from(lists)
    .where(eq(lists.boardId, boardId))
    .orderBy(lists.position);

  const boardCards = await db.select().from(cards).orderBy(cards.position);

  const cardsByList = new Map(
    boardLists.map((l) => [l.id, boardCards.filter((c) => c.listId === l.id)])
  );

  const allLabels = await db.select().from(labels);

  const cardIds = boardCards.map((c) => c.id);
  const boardCardLabels = cardIds.length
    ? await db.select().from(cardLabels).where(inArray(cardLabels.cardId, cardIds))
    : [];

  const cardLabelIds = new Map<number, number[]>();
  for (const { cardId, labelId } of boardCardLabels) {
    cardLabelIds.set(cardId, [...(cardLabelIds.get(cardId) ?? []), labelId]);
  }

  return (
    <div className="flex flex-col h-full">
      <BoardHeader id={board.id} title={board.title} archived={board.archived} />
      <BoardCanvas
        boardId={boardId}
        lists={boardLists}
        initialCardsByList={cardsByList}
        allLabels={allLabels}
        cardLabelIds={cardLabelIds}
      />
    </div>
  );
}
