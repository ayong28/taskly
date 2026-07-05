import { render, screen } from "@testing-library/react";
import { LabelChip } from "@/components/Label/LabelChip";

const label = { id: 1, name: "Urgent", color: "red" };

describe("LabelChip", () => {
  it("dot variant renders a colored swatch without the label name", () => {
    render(<LabelChip label={label} variant="dot" />);
    expect(screen.queryByText("Urgent")).not.toBeInTheDocument();
    expect(screen.getByTestId("label-chip-dot")).toHaveClass("bg-red-500");
  });

  it("pill variant renders the label name and its color", () => {
    render(<LabelChip label={label} variant="pill" />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByTestId("label-chip-pill")).toHaveClass("bg-red-500");
  });
});
