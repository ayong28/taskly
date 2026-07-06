import { render, screen, fireEvent } from "@testing-library/react";
import { ListHeader } from "@/components/List/ListHeader";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/lib/actions/lists", () => ({
  renameList: jest.fn(),
  deleteList: jest.fn(),
}));

describe("ListHeader", () => {
  it("shows a list-options menu and allows rename for a normal list", () => {
    render(<ListHeader id={1} title="To Do" boardId={1} />);

    expect(screen.getByRole("button", { name: /list options/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText("To Do"));
    expect(screen.getByLabelText(/list name/i)).toBeInTheDocument();
  });

  it("hides the options menu and disables rename for a special list", () => {
    render(<ListHeader id={1} title="Archived" boardId={1} special />);

    expect(screen.queryByRole("button", { name: /list options/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Archived"));
    expect(screen.queryByLabelText(/list name/i)).not.toBeInTheDocument();
  });
});
