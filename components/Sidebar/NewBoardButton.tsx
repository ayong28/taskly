"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBoard } from "@/lib/actions/boards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function NewBoardButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!title.trim()) return;
    setPending(true);
    const board = await createBoard(title.trim());
    setTitle("");
    setOpen(false);
    setPending(false);
    router.push(`/board/${board.id}`);
    router.refresh();
  };

  const handleCancel = () => {
    setTitle("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
      >
        + New Board
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Board</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <label htmlFor="board-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="board-name"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Website Redesign"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim() || pending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
