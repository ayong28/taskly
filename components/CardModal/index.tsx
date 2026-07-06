"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameCard, archiveCard, restoreCard, deleteCard } from "@/lib/actions/cards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
}: {
  id: number;
  title: string;
  boardId: number;
  open: boolean;
  onClose: () => void;
  allLabels?: Label[];
  assignedLabelIds?: number[];
  archived?: boolean;
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

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Labels</span>
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
              <button
                onClick={handleDelete}
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={handleRestore}
                className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Restore
              </button>
            </>
          ) : (
            <button
              onClick={handleArchive}
              className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Archive
            </button>
          )}
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
