import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewCardModal } from "@/components/List/NewCardModal";
import { createCard } from "@/lib/actions/cards";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/lib/actions/cards", () => ({
  createCard: jest.fn(),
}));

describe("NewCardModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a card with the entered title and closes", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<NewCardModal listId={1} boardId={2} open={true} onClose={onClose} />);

    await user.type(screen.getByLabelText(/title/i), "Write tests");
    await user.click(screen.getByRole("button", { name: /^add card$/i }));

    await waitFor(() => {
      expect(createCard).toHaveBeenCalledWith(1, "Write tests", 2);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not create a card when title is empty", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<NewCardModal listId={1} boardId={2} open={true} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /^add card$/i }));

    expect(createCard).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes without creating a card on Cancel", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<NewCardModal listId={1} boardId={2} open={true} onClose={onClose} />);

    await user.type(screen.getByLabelText(/title/i), "Should not save");
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(createCard).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
