"use client";

type Label = { id: number; name: string; color: string };

export function FilterBar({
  allLabels,
  selectedLabelId,
  onLabelChange,
}: {
  allLabels: Label[];
  selectedLabelId: number | null;
  onLabelChange: (labelId: number | null) => void;
}) {
  const hasActiveFilter = selectedLabelId !== null;

  return (
    <div className="flex items-center gap-3 border-b border-border px-6 py-2">
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        Label
        <select
          aria-label="Filter by label"
          value={selectedLabelId ?? ""}
          onChange={(e) => onLabelChange(e.target.value ? Number(e.target.value) : null)}
          className="rounded border border-input bg-input/10 px-2 py-1 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
        >
          <option value="">All</option>
          {allLabels.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </select>
      </label>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={() => onLabelChange(null)}
          className="text-sm text-primary hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
