"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { renameBoard, deleteBoard } from "@/lib/actions/boards";
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

export function BoardHeader({ id, title }: { id: number; title: string }) {
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

  return (
    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
      {editing ? (
        <input
          ref={inputRef}
          aria-label="Board name"
          defaultValue={currentTitle}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="text-xl font-semibold rounded border border-blue-400 px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <h1
          className="text-xl font-semibold cursor-pointer hover:bg-gray-100 rounded px-2 py-0.5"
          onClick={() => setEditing(true)}
        >
          {currentTitle}
        </h1>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Board Options"
          className="ml-auto rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ···
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setConfirmDelete(true)}
          >
            Delete Board
          </DropdownMenuItem>
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
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
