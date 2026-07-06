"use client";

import { useState, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CardTile } from "@/components/Card/CardTile";
import { SortableCardTile } from "@/components/Card/SortableCardTile";
import { AddCardButton } from "@/components/List/AddCardButton";
import { AddListButton } from "@/components/List/AddListButton";
import { ListHeader } from "@/components/List/ListHeader";
import { FilterBar } from "@/components/Board/FilterBar";
import { moveCard } from "@/lib/actions/dnd";

type CardRow = {
  id: number;
  title: string;
  listId: number;
  position: number;
  archived?: boolean;
};
type ListRow = { id: number; title: string; boardId: number; position: number; special?: boolean };
type Label = { id: number; name: string; color: string };

function serializeCards(map: Map<number, CardRow[]>): string {
  return JSON.stringify(
    Array.from(map.entries()).map(([k, v]) => [k, v.map((c) => [c.id, c.title])])
  );
}

function ListDropZone({ listId, children }: { listId: number; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `list-${listId}` });
  return (
    <div ref={setNodeRef} className="flex flex-col gap-2 px-3 pb-2 min-h-[1px]">
      {children}
    </div>
  );
}

export function BoardCanvas({
  boardId,
  lists,
  initialCardsByList,
  allLabels = [],
  cardLabelIds = new Map(),
}: {
  boardId: number;
  lists: ListRow[];
  initialCardsByList: Map<number, CardRow[]>;
  allLabels?: Label[];
  cardLabelIds?: Map<number, number[]>;
}) {
  function labelsForCard(cardId: number): Label[] {
    const ids = cardLabelIds.get(cardId) ?? [];
    return ids
      .map((id) => allLabels.find((l) => l.id === id))
      .filter((l): l is Label => Boolean(l));
  }

  const [cardsByList, setCardsByList] = useState(initialCardsByList);
  const [activeCard, setActiveCard] = useState<CardRow | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);

  function isCardVisible(card: CardRow): boolean {
    return (
      selectedLabelId === null ||
      labelsForCard(card.id).some((l) => l.id === selectedLabelId)
    );
  }

  // Sync local state when server data changes (e.g. after add/delete/rename)
  const prevKeyRef = useRef(serializeCards(initialCardsByList));
  const currentKey = serializeCards(initialCardsByList);
  if (prevKeyRef.current !== currentKey) {
    prevKeyRef.current = currentKey;
    setCardsByList(initialCardsByList);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function getListIdForCard(cardDndId: string): number | null {
    const cardId = parseInt(cardDndId.replace("card-", ""), 10);
    for (const [listId, cards] of cardsByList) {
      if (cards.some((c) => c.id === cardId)) return listId;
    }
    return null;
  }

  function computePosition(cards: CardRow[], atIndex: number): number {
    const prev = cards[atIndex - 1];
    const next = cards[atIndex + 1];
    if (!prev) return (next?.position ?? 1) / 2;
    if (!next) return prev.position + 1;
    return (prev.position + next.position) / 2;
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = event.active.id as string;
    if (!activeId.startsWith("card-")) return;
    const cardId = parseInt(activeId.replace("card-", ""), 10);
    const listId = getListIdForCard(activeId);
    const card = listId !== null ? cardsByList.get(listId)?.find((c) => c.id === cardId) : null;
    setActiveCard(card ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (!activeId.startsWith("card-")) return;
    if (!overId.startsWith("card-") && !overId.startsWith("list-")) return;

    const sourceListId = getListIdForCard(activeId);
    const destListId = overId.startsWith("list-")
      ? parseInt(overId.replace("list-", ""), 10)
      : getListIdForCard(overId);
    if (sourceListId === null || destListId === null) return;

    const cardId = parseInt(activeId.replace("card-", ""), 10);
    const sourceCards = cardsByList.get(sourceListId) ?? [];
    const destCards =
      sourceListId === destListId ? sourceCards : (cardsByList.get(destListId) ?? []);

    const fromIndex = sourceCards.findIndex((c) => c.id === cardId);
    // Dropping directly on the list (empty-list droppable) means "append to end"
    const toIndex = overId.startsWith("list-")
      ? destCards.length
      : destCards.findIndex((c) => `card-${c.id}` === overId);
    if (fromIndex === -1 || toIndex === -1) return;

    if (sourceListId === destListId) {
      const reordered = arrayMove(sourceCards, fromIndex, toIndex);
      const newPosition = computePosition(reordered, toIndex);
      const updated = reordered.map((c, i) =>
        i === toIndex ? { ...c, position: newPosition } : c
      );
      setCardsByList(new Map(cardsByList).set(sourceListId, updated));
      await moveCard(cardId, sourceListId, newPosition, boardId);
    } else {
      // Cross-list move: remove from source, insert into dest at toIndex
      const movedCard = sourceCards[fromIndex];
      const newSource = sourceCards.filter((_, i) => i !== fromIndex);
      const newDest = [...destCards.slice(0, toIndex), movedCard, ...destCards.slice(toIndex)];
      const newPosition = computePosition(newDest, toIndex);
      const updatedDest = newDest.map((c, i) =>
        i === toIndex ? { ...c, listId: destListId, position: newPosition } : c
      );
      const next = new Map(cardsByList);
      next.set(sourceListId, newSource);
      next.set(destListId, updatedDest);
      setCardsByList(next);
      await moveCard(cardId, destListId, newPosition, boardId);
    }
  }

  return (
    <DndContext
      id="board-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <FilterBar
        allLabels={allLabels}
        selectedLabelId={selectedLabelId}
        onLabelChange={setSelectedLabelId}
      />
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {lists.map((list) => {
          const listCards = cardsByList.get(list.id) ?? [];
          const cardDndIds = listCards.map((c) => `card-${c.id}`);

          return (
            <div
              key={list.id}
              aria-label={`${list.title} list`}
              className="w-72 shrink-0 rounded-lg bg-gray-100 flex flex-col"
            >
              <ListHeader
                id={list.id}
                title={list.title}
                boardId={boardId}
                special={list.special}
              />
              <SortableContext items={cardDndIds} strategy={verticalListSortingStrategy}>
                <ListDropZone listId={list.id}>
                  {listCards.map((card) => (
                    <SortableCardTile
                      key={card.id}
                      id={card.id}
                      title={card.title}
                      boardId={boardId}
                      labels={labelsForCard(card.id)}
                      allLabels={allLabels}
                      hidden={!isCardVisible(card)}
                      archived={card.archived}
                    />
                  ))}
                </ListDropZone>
              </SortableContext>
              <AddCardButton listId={list.id} boardId={boardId} />
            </div>
          );
        })}
        <AddListButton boardId={boardId} />
      </div>
      <DragOverlay>
        {activeCard && (
          <CardTile
            id={activeCard.id}
            title={activeCard.title}
            boardId={boardId}
            labels={labelsForCard(activeCard.id)}
            allLabels={allLabels}
            archived={activeCard.archived}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
