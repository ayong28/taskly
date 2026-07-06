"use client";

import { useState } from "react";
import { CardModal } from "@/components/CardModal";
import { LabelChip } from "@/components/Label/LabelChip";

type Label = { id: number; name: string; color: string };

export function CardTile({
  id,
  title,
  boardId,
  labels = [],
  allLabels = [],
  archived = false,
}: {
  id: number;
  title: string;
  boardId: number;
  labels?: Label[];
  allLabels?: Label[];
  archived?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        className="rounded-md bg-white px-3 py-2 shadow-sm text-sm text-gray-800 cursor-pointer hover:bg-gray-50"
      >
        {labels.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            {labels.map((label) => (
              <LabelChip key={label.id} label={label} variant="dot" />
            ))}
          </div>
        )}
        {title}
      </div>
      <CardModal
        id={id}
        title={title}
        boardId={boardId}
        open={open}
        onClose={() => setOpen(false)}
        allLabels={allLabels}
        assignedLabelIds={labels.map((l) => l.id)}
        archived={archived}
      />
    </>
  );
}
