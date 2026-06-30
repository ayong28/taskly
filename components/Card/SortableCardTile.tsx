"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardTile } from "@/components/Card/CardTile";

export function SortableCardTile({
  id,
  title,
  boardId,
}: {
  id: number;
  title: string;
  boardId: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `card-${id}`, data: { type: "card", cardId: id } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardTile id={id} title={title} boardId={boardId} />
    </div>
  );
}
