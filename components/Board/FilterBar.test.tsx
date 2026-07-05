import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "@/components/Board/FilterBar";

describe("FilterBar", () => {
  const allLabels = [
    { id: 1, name: "Bug", color: "red" },
    { id: 2, name: "Urgent", color: "orange" },
  ];

  it("lists all labels plus an All option, and reports selection", () => {
    const onLabelChange = jest.fn();
    render(
      <FilterBar allLabels={allLabels} selectedLabelId={null} onLabelChange={onLabelChange} />
    );

    const labelSelect = screen.getByLabelText("Filter by label") as HTMLSelectElement;
    const labelOptionNames = Array.from(labelSelect.options).map((o) => o.text);
    expect(labelOptionNames).toEqual(["All", "Bug", "Urgent"]);

    fireEvent.change(labelSelect, { target: { value: "2" } });
    expect(onLabelChange).toHaveBeenCalledWith(2);
  });

  it("only shows a clear-filters button when a filter is active", () => {
    const { rerender } = render(
      <FilterBar allLabels={allLabels} selectedLabelId={null} onLabelChange={jest.fn()} />
    );
    expect(screen.queryByText("Clear filters")).not.toBeInTheDocument();

    rerender(<FilterBar allLabels={allLabels} selectedLabelId={1} onLabelChange={jest.fn()} />);
    expect(screen.getByText("Clear filters")).toBeInTheDocument();
  });

  it("clears the filter when clear-filters is clicked", () => {
    const onLabelChange = jest.fn();
    render(<FilterBar allLabels={allLabels} selectedLabelId={1} onLabelChange={onLabelChange} />);

    fireEvent.click(screen.getByText("Clear filters"));
    expect(onLabelChange).toHaveBeenCalledWith(null);
  });
});
