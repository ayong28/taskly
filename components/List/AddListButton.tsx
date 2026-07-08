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
      <div className="w-72 shrink-0 rounded-lg border border-border bg-card p-2">
        <input
          ref={inputRef}
          placeholder="List name"
          onBlur={handleAdd}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-ring bg-input/10 px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          autoFocus
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="w-72 shrink-0 rounded-lg border border-dashed border-border bg-transparent px-4 py-3 text-left text-sm text-muted-foreground hover:border-primary hover:text-primary"
    >
      + Add List
    </button>
  );
}
