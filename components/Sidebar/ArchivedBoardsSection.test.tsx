import { render, screen, fireEvent } from "@testing-library/react";
import { ArchivedBoardsSection } from "@/components/Sidebar/ArchivedBoardsSection";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

const restoreBoard = jest.fn();
jest.mock("@/lib/actions/boards", () => ({
  restoreBoard: (...args: unknown[]) => restoreBoard(...args),
}));

describe("ArchivedBoardsSection", () => {
  const archivedBoards = [
    { id: 1, title: "Old Project", color: "slate" },
    { id: 2, title: "Retired Board", color: "blue" },
  ];

  it("is collapsed by default, hiding archived board titles", () => {
    render(<ArchivedBoardsSection boards={archivedBoards} />);
    expect(screen.queryByText("Old Project")).not.toBeInTheDocument();
  });

  it("expands to show archived boards and a Restore button per board", () => {
    render(<ArchivedBoardsSection boards={archivedBoards} />);

    fireEvent.click(screen.getByRole("button", { name: /archived/i }));

    expect(screen.getByText("Old Project")).toBeInTheDocument();
    expect(screen.getByText("Retired Board")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /restore/i })).toHaveLength(2);
  });

  it("restores a board when its Restore button is clicked", () => {
    render(<ArchivedBoardsSection boards={archivedBoards} />);
    fireEvent.click(screen.getByRole("button", { name: /archived/i }));

    fireEvent.click(screen.getAllByRole("button", { name: /restore/i })[0]);

    expect(restoreBoard).toHaveBeenCalledWith(1);
  });

  it("renders nothing when there are no archived boards", () => {
    const { container } = render(<ArchivedBoardsSection boards={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
