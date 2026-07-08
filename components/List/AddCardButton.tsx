"use client";

import { useState } from "react";
import { NewCardModal } from "@/components/List/NewCardModal";

export function AddCardButton({ listId, boardId }: { listId: number; boardId: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mx-3 mb-3 rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        + Add Card
      </button>
      <NewCardModal listId={listId} boardId={boardId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
