"use client";

import { useState } from "react";
import { CardModal } from "@/components/CardModal";

export function CardTile({
  id,
  title,
  boardId,
}: {
  id: number;
  title: string;
  boardId: number;
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
        {title}
      </div>
      <CardModal
        id={id}
        title={title}
        boardId={boardId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
