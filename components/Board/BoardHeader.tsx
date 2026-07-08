"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { renameBoard, deleteBoard, archiveBoard } from "@/lib/actions/boards";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function BoardHeader({
  id,
  title,
  archived = false,
}: {
  id: number;
  title: string;
  archived?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleRename = async () => {
    const newTitle = inputRef.current?.value.trim();
    if (newTitle && newTitle !== currentTitle) {
      await renameBoard(id, newTitle);
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
    await deleteBoard(id);
    router.push("/");
    router.refresh();
  };

  const handleArchive = async () => {
    await archiveBoard(id);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 border-b border-border px-6 py-4">
      {editing ? (
        <input
          ref={inputRef}
          aria-label="Board name"
          defaultValue={currentTitle}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="rounded border border-ring px-2 py-0.5 font-heading text-xl font-semibold text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          autoFocus
        />
      ) : (
        <h1
          className="cursor-pointer rounded px-2 py-0.5 font-heading text-xl font-semibold text-foreground hover:bg-muted"
          onClick={() => setEditing(true)}
        >
          {currentTitle}
        </h1>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Board Options"
          className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ···
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {archived ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Board
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleArchive}>Archive Board</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{currentTitle}</strong> and all its lists and
              cards.
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
