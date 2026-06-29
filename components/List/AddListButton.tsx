"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createList } from "@/lib/actions/lists";

export function AddListButton({ boardId }: { boardId: number }) {
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAdd = async () => {
    const title = inputRef.current?.value.trim();
    if (!title) {
      setAdding(false);
      return;
    }
    await createList(boardId, title);
    router.refresh();
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setAdding(false);
  };

  if (adding) {
    return (
      <div className="w-72 shrink-0 rounded-lg bg-gray-100 p-2">
        <input
          ref={inputRef}
          placeholder="List name"
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
      className="w-72 shrink-0 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600 hover:bg-gray-200 text-left"
    >
      + Add List
    </button>
  );
}
