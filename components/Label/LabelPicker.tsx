"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LabelChip } from "@/components/Label/LabelChip";
import { LABEL_COLORS, colorClassFor } from "@/lib/labels";
import {
  createLabel,
  renameLabel,
  deleteLabel,
  assignLabelToCard,
  removeLabelFromCard,
} from "@/lib/actions/labels";

type Label = { id: number; name: string; color: string };

export function LabelPicker({
  cardId,
  boardId,
  allLabels,
  assignedLabelIds,
}: {
  cardId: number;
  boardId: number;
  allLabels: Label[];
  assignedLabelIds: number[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[0].key);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  async function toggleLabel(label: Label) {
    if (assignedLabelIds.includes(label.id)) {
      await removeLabelFromCard(cardId, label.id, boardId);
    } else {
      await assignLabelToCard(cardId, label.id, boardId);
    }
    router.refresh();
  }

  function startEditing(label: Label) {
    setEditingId(label.id);
    setEditingName(label.name);
  }

  async function commitRename() {
    const name = editingName.trim();
    if (name) {
      await renameLabel(editingId as number, name, boardId);
      router.refresh();
    }
    setEditingId(null);
  }

  async function handleDelete(label: Label) {
    await deleteLabel(label.id, boardId);
    router.refresh();
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const label = await createLabel(name, newColor, boardId);
    if (label) {
      await assignLabelToCard(cardId, label.id, boardId);
    }
    setNewName("");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Labels"
        className="rounded border border-input px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Labels
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2">
        <div className="flex flex-col gap-1">
          {allLabels.map((label) => {
            const assigned = assignedLabelIds.includes(label.id);

            if (editingId === label.id) {
              return (
                <input
                  key={label.id}
                  autoFocus
                  aria-label="Label name"
                  placeholder="Label name"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    // Stop the keystroke from reaching the menu's typeahead
                    // handler, which otherwise intercepts every character key
                    // (to jump-navigate menu items) before it reaches this input.
                    e.stopPropagation();
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={commitRename}
                  className="rounded border border-ring px-2 py-1 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                />
              );
            }

            return (
              <div
                key={label.id}
                className={`group flex items-center gap-1 rounded px-2 py-1 hover:bg-muted ${
                  assigned ? "ring-1 ring-inset ring-border" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <LabelChip label={label} variant="pill" />
                  {assigned && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                </button>
                <button
                  type="button"
                  aria-label="Rename label"
                  onClick={() => startEditing(label)}
                  className="rounded p-0.5 text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground group-hover:opacity-100"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Delete label"
                  onClick={() => handleDelete(label)}
                  className="rounded p-0.5 text-muted-foreground opacity-0 hover:bg-muted hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        <div className="flex flex-col gap-2 px-1 py-1">
          <input
            placeholder="New label name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            // Stop the keystroke from reaching the menu's typeahead handler,
            // which otherwise intercepts every character key before it
            // reaches this input.
            onKeyDown={(e) => e.stopPropagation()}
            className="rounded border border-input bg-input/10 px-2 py-1 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {LABEL_COLORS.map((color) => (
              <button
                key={color.key}
                type="button"
                data-testid={`swatch-${color.key}`}
                aria-label={color.key}
                onClick={() => setNewColor(color.key)}
                className={`h-5 w-5 rounded-full ${colorClassFor(color.key)} ${
                  newColor === color.key ? "ring-2 ring-ring ring-offset-1 ring-offset-popover" : ""
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="rounded bg-primary px-2 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
          >
            Create label
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
