import { render, screen, fireEvent } from "@testing-library/react";
import { BoardHeader } from "@/components/Board/BoardHeader";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/lib/actions/boards", () => ({
  renameBoard: jest.fn(),
  deleteBoard: jest.fn(),
  archiveBoard: jest.fn(),
  restoreBoard: jest.fn(),
}));

describe("BoardHeader options menu", () => {
  it("shows only Archive Board for an active board", async () => {
    render(<BoardHeader id={1} title="My Board" archived={false} />);

    fireEvent.click(screen.getByRole("button", { name: /board options/i }));

    expect(screen.getByRole("menuitem", { name: /archive board/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /delete board/i })).not.toBeInTheDocument();
  });

  it("shows only Delete Board for an archived board", async () => {
    render(<BoardHeader id={1} title="My Board" archived={true} />);

    fireEvent.click(screen.getByRole("button", { name: /board options/i }));

    expect(screen.getByRole("menuitem", { name: /delete board/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /archive board/i })).not.toBeInTheDocument();
  });
});
