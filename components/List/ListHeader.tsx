"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { renameList, deleteList } from "@/lib/actions/lists";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ListHeader({
  id,
  title,
  boardId,
  special = false,
}: {
  id: number;
  title: string;
  boardId: number;
  special?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleRename = async () => {
    const newTitle = inputRef.current?.value.trim();
    if (newTitle && newTitle !== currentTitle) {
      await renameList(id, newTitle, boardId);
      setCurrentTitle(newTitle);
      router.refresh();
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRename();
    if (e.key === "Escape") setEditing(false);
  };

  const handleDelete = async () => {
    await deleteList(id, boardId);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {editing ? (
        <input
          ref={inputRef}
          aria-label="List name"
          defaultValue={currentTitle}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded border border-ring px-2 py-0.5 font-heading text-sm font-semibold text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          autoFocus
        />
      ) : special ? (
        <h2 className="flex-1 px-2 py-0.5 font-heading text-sm font-semibold text-muted-foreground">
          {currentTitle}
        </h2>
      ) : (
        <h2
          className="flex-1 cursor-pointer rounded px-2 py-0.5 font-heading text-sm font-semibold text-foreground hover:bg-muted"
          onClick={() => setEditing(true)}
        >
          {currentTitle}
        </h2>
      )}

      {!special && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="List Options"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ···
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              Delete List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
