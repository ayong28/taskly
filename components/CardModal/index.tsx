"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameCard, deleteCard } from "@/lib/actions/cards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function CardModal({
  id,
  title,
  boardId,
  open,
  onClose,
}: {
  id: number;
  title: string;
  boardId: number;
  open: boolean;
  onClose: () => void;
}) {
  const [currentTitle, setCurrentTitle] = useState(title);
  const router = useRouter();

  const handleSave = async () => {
    if (currentTitle.trim() && currentTitle.trim() !== title) {
      await renameCard(id, currentTitle.trim(), boardId);
    }
    onClose();
    router.refresh();
  };

  const handleDelete = async () => {
    await deleteCard(id, boardId);
    onClose();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit card</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1">
          <label htmlFor="card-title" className="text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="card-title"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <DialogFooter>
          <button
            onClick={handleDelete}
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
