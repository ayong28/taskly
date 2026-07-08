"use client";

import { useState } from "react";
import { NewCardModal } from "@/components/List/NewCardModal";

export function AddCardButton({ listId, boardId }: { listId: number; boardId: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mx-3 mb-3 rounded py-1.5 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-700 text-left px-2"
      >
        + Add Card
      </button>
      <NewCardModal listId={listId} boardId={boardId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
