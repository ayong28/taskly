export type LabelColorKey =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "indigo"
  | "purple"
  | "pink";

export const LABEL_COLORS: { key: LabelColorKey; bgClass: string }[] = [
  { key: "red", bgClass: "bg-red-500" },
  { key: "orange", bgClass: "bg-orange-500" },
  { key: "amber", bgClass: "bg-amber-500" },
  { key: "yellow", bgClass: "bg-yellow-500" },
  { key: "green", bgClass: "bg-green-500" },
  { key: "teal", bgClass: "bg-teal-500" },
  { key: "blue", bgClass: "bg-blue-500" },
  { key: "indigo", bgClass: "bg-indigo-500" },
  { key: "purple", bgClass: "bg-purple-500" },
  { key: "pink", bgClass: "bg-pink-500" },
];

const FALLBACK_BG_CLASS = "bg-gray-400";

export function colorClassFor(colorKey: string): string {
  return LABEL_COLORS.find((c) => c.key === colorKey)?.bgClass ?? FALLBACK_BG_CLASS;
}
