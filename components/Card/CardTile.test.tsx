import { render, screen } from "@testing-library/react";
import { CardTile } from "@/components/Card/CardTile";

jest.mock("@/components/CardModal", () => ({
  CardModal: () => null,
}));

describe("CardTile label swatches", () => {
  it("renders no label dots when the card has no labels", () => {
    render(<CardTile id={1} title="No labels" boardId={1} labels={[]} allLabels={[]} />);
    expect(screen.queryAllByTestId("label-chip-dot")).toHaveLength(0);
  });

  it("renders one dot per assigned label", () => {
    const labels = [
      { id: 1, name: "Urgent", color: "red" },
      { id: 2, name: "Docs", color: "blue" },
    ];
    render(
      <CardTile id={1} title="Has labels" boardId={1} labels={labels} allLabels={labels} />
    );
    expect(screen.getAllByTestId("label-chip-dot")).toHaveLength(2);
  });
});
