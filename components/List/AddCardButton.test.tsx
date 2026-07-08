import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddCardButton } from "@/components/List/AddCardButton";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/lib/actions/cards", () => ({
  createCard: jest.fn(),
}));

describe("AddCardButton", () => {
  it("opens the new card modal when clicked", async () => {
    const user = userEvent.setup();
    render(<AddCardButton listId={1} boardId={2} />);

    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add card/i }));

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });
});
