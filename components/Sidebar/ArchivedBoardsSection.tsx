"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { restoreBoard } from "@/lib/actions/boards";

type Board = { id: number; title: string; color: string };

export function ArchivedBoardsSection({ boards }: { boards: Board[] }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  if (boards.length === 0) return null;

  const handleRestore = async (id: number) => {
    await restoreBoard(id);
    router.refresh();
  };

  return (
    <div className="border-t border-gray-200 py-2">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200"
      >
        Archived ({boards.length})
        <span aria-hidden>{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <ul>
          {boards.map((board) => (
            <li
              key={board.id}
              className="flex items-center gap-2 px-4 py-1.5 text-sm text-gray-500"
            >
              <span
                className="h-3 w-3 rounded-sm shrink-0 opacity-50"
                style={{ backgroundColor: board.color }}
              />
              <span className="flex-1 truncate">{board.title}</span>
              <button
                type="button"
                onClick={() => handleRestore(board.id)}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
