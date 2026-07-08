"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCard, archiveCard, restoreCard, deleteCard } from "@/lib/actions/cards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LabelChip } from "@/components/Label/LabelChip";
import { LabelPicker } from "@/components/Label/LabelPicker";

type Label = { id: number; name: string; color: string };

export function CardModal({
  id,
  title,
  boardId,
  open,
  onClose,
  allLabels = [],
  assignedLabelIds = [],
  archived = false,
  description = "",
  dueDate = "",
}: {
  id: number;
  title: string;
  boardId: number;
  open: boolean;
  onClose: () => void;
  allLabels?: Label[];
  assignedLabelIds?: number[];
  archived?: boolean;
  description?: string | null;
  dueDate?: string | null;
}) {
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentDescription, setCurrentDescription] = useState(description ?? "");
  const [currentDueDate, setCurrentDueDate] = useState(dueDate ?? "");
  const router = useRouter();

  const handleSave = async () => {
    const trimmedTitle = currentTitle.trim() || title;
    await updateCard(
      id,
      {
        title: trimmedTitle,
        description: currentDescription.trim() || null,
        dueDate: currentDueDate || null,
      },
      boardId
    );
    onClose();
    router.refresh();
  };

  const handleArchive = async () => {
    await archiveCard(id, boardId);
    onClose();
    router.refresh();
  };

  const handleRestore = async () => {
    await restoreCard(id, boardId);
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
          <label htmlFor="card-title" className="text-sm font-medium text-muted-foreground">
            Title
          </label>
          <input
            id="card-title"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            className="rounded border border-input bg-input/10 px-3 py-1.5 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="card-description" className="text-sm font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            id="card-description"
            value={currentDescription}
            onChange={(e) => setCurrentDescription(e.target.value)}
            rows={4}
            className="rounded border border-input bg-input/10 px-3 py-1.5 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="card-due-date" className="text-sm font-medium text-muted-foreground">
            Due Date
          </label>
          <input
            id="card-due-date"
            type="date"
            value={currentDueDate}
            onChange={(e) => setCurrentDueDate(e.target.value)}
            className="rounded border border-input bg-input/10 px-3 py-1.5 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Labels</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {assignedLabelIds
              .map((labelId) => allLabels.find((l) => l.id === labelId))
              .filter((l): l is Label => Boolean(l))
              .map((label) => (
                <LabelChip key={label.id} label={label} variant="pill" />
              ))}
            <LabelPicker
              cardId={id}
              boardId={boardId}
              allLabels={allLabels}
              assignedLabelIds={assignedLabelIds}
            />
          </div>
        </div>

        <DialogFooter>
          {archived ? (
            <>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="outline" onClick={handleRestore}>
                Restore
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleArchive}>
              Archive
            </Button>
          )}
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
