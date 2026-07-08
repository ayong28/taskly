"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCard } from "@/lib/actions/cards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function NewCardModal({
  listId,
  boardId,
  open,
  onClose,
}: {
  listId: number;
  boardId: number;
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const router = useRouter();

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createCard(listId, trimmed, boardId, {
      description: description.trim() || null,
      dueDate: dueDate || null,
    });
    setTitle("");
    setDescription("");
    setDueDate("");
    onClose();
    router.refresh();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New card</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1">
          <label htmlFor="new-card-title" className="text-sm font-medium text-muted-foreground">
            Title
          </label>
          <input
            id="new-card-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="rounded border border-input bg-input/10 px-3 py-1.5 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="new-card-description" className="text-sm font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            id="new-card-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="rounded border border-input bg-input/10 px-3 py-1.5 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="new-card-due-date" className="text-sm font-medium text-muted-foreground">
            Due Date
          </label>
          <input
            id="new-card-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded border border-input bg-input/10 px-3 py-1.5 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
