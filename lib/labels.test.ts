import { LABEL_COLORS, colorClassFor } from "@/lib/labels";

describe("LABEL_COLORS", () => {
  it("has between 8 and 12 preset colors, per the plan's preset-palette requirement", () => {
    expect(LABEL_COLORS.length).toBeGreaterThanOrEqual(8);
    expect(LABEL_COLORS.length).toBeLessThanOrEqual(12);
  });

  it("has no duplicate color keys", () => {
    const keys = LABEL_COLORS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every entry has a non-empty Tailwind bg class", () => {
    for (const color of LABEL_COLORS) {
      expect(color.bgClass).toMatch(/^bg-/);
    }
  });
});

describe("colorClassFor", () => {
  it("returns the bg class for a known color key", () => {
    const first = LABEL_COLORS[0];
    expect(colorClassFor(first.key)).toBe(first.bgClass);
  });

  it("falls back to a neutral class for an unknown color key", () => {
    expect(colorClassFor("not-a-real-color")).toMatch(/^bg-/);
  });
});
