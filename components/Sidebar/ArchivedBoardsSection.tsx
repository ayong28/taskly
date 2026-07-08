"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { restoreBoard, deleteBoard } from "@/lib/actions/boards";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type Board = { id: number; title: string; color: string };

export function ArchivedBoardsSection({ boards }: { boards: Board[] }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const router = useRouter();

  if (boards.length === 0) return null;

  const handleRestore = async (id: number) => {
    await restoreBoard(id);
    router.refresh();
  };

  const handleDelete = async () => {
    if (confirmDeleteId === null) return;
    await deleteBoard(confirmDeleteId);
    setConfirmDeleteId(null);
    router.refresh();
  };

  const boardPendingDelete = boards.find((b) => b.id === confirmDeleteId);

  return (
    <div className="border-t border-sidebar-border py-2">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent"
      >
        Archived ({boards.length})
        <span aria-hidden>{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <ul>
          {boards.map((board) => (
            <li
              key={board.id}
              className="flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full opacity-50"
                style={{ backgroundColor: board.color }}
              />
              <span className="flex-1 truncate">{board.title}</span>
              <button
                type="button"
                onClick={() => handleRestore(board.id)}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                Restore
              </button>
              <button
                type="button"
                aria-label="Delete board"
                onClick={() => setConfirmDeleteId(board.id)}
                className="rounded p-1 text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{boardPendingDelete?.title}</strong> and all its lists and cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
