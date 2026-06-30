"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCard } from "@/lib/actions/cards";

export function AddCardButton({ listId, boardId }: { listId: number; boardId: number }) {
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAdd = async () => {
    const title = inputRef.current?.value.trim();
    if (!title) {
      setAdding(false);
      return;
    }
    await createCard(listId, title, boardId);
    router.refresh();
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setAdding(false);
  };

  if (adding) {
    return (
      <div className="px-3 pb-3">
        <input
          ref={inputRef}
          placeholder="Card title"
          onBlur={handleAdd}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-blue-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="mx-3 mb-3 rounded py-1.5 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-700 text-left px-2"
    >
      + Add Card
    </button>
  );
}
