"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardTile } from "@/components/Card/CardTile";

type Label = { id: number; name: string; color: string };

export function SortableCardTile({
  id,
  title,
  boardId,
  labels = [],
  allLabels = [],
  hidden = false,
}: {
  id: number;
  title: string;
  boardId: number;
  labels?: Label[];
  allLabels?: Label[];
  hidden?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `card-${id}`, data: { type: "card", cardId: id } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-card-wrapper
      className={hidden ? "hidden" : undefined}
      {...attributes}
      {...listeners}
    >
      <CardTile id={id} title={title} boardId={boardId} labels={labels} allLabels={allLabels} />
    </div>
  );
}
