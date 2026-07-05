import { colorClassFor } from "@/lib/labels";

export function LabelChip({
  label,
  variant,
}: {
  label: { id: number; name: string; color: string };
  variant: "dot" | "pill";
}) {
  const bgClass = colorClassFor(label.color);

  if (variant === "dot") {
    return (
      <span
        data-testid="label-chip-dot"
        title={label.name}
        className={`h-2 w-6 rounded-full ${bgClass}`}
      />
    );
  }

  return (
    <span
      data-testid="label-chip-pill"
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white ${bgClass}`}
    >
      {label.name}
    </span>
  );
}
