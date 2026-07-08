import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardModal } from "@/components/CardModal";
import { updateCard } from "@/lib/actions/cards";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/lib/actions/cards", () => ({
  updateCard: jest.fn(),
  deleteCard: jest.fn(),
  archiveCard: jest.fn(),
  restoreCard: jest.fn(),
}));

jest.mock("@/lib/actions/labels", () => ({
  createLabel: jest.fn(),
  renameLabel: jest.fn(),
  deleteLabel: jest.fn(),
  assignLabelToCard: jest.fn(),
  removeLabelFromCard: jest.fn(),
}));

describe("CardModal footer", () => {
  it("shows only Archive (no Delete) for an active card", () => {
    render(
      <CardModal id={1} title="Test Card" boardId={1} open={true} onClose={jest.fn()} />
    );

    expect(screen.getByRole("button", { name: /^archive$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^delete$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^restore$/i })).not.toBeInTheDocument();
  });

  it("shows Restore and Delete (no Archive) for an archived card", () => {
    render(
      <CardModal
        id={1}
        title="Test Card"
        boardId={1}
        open={true}
        onClose={jest.fn()}
        archived
      />
    );

    expect(screen.getByRole("button", { name: /^restore$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^archive$/i })).not.toBeInTheDocument();
  });
});

describe("CardModal description and due date", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("pre-fills description and due date from props", () => {
    render(
      <CardModal
        id={1}
        title="Test Card"
        boardId={1}
        open={true}
        onClose={jest.fn()}
        description="Existing description"
        dueDate="2026-08-01"
      />
    );

    expect(screen.getByLabelText(/description/i)).toHaveValue("Existing description");
    expect(screen.getByLabelText(/due date/i)).toHaveValue("2026-08-01");
  });

  it("saves edited title, description and due date via updateCard", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <CardModal
        id={1}
        title="Test Card"
        boardId={1}
        open={true}
        onClose={onClose}
        description="Old description"
        dueDate="2026-08-01"
      />
    );

    await user.clear(screen.getByLabelText(/description/i));
    await user.type(screen.getByLabelText(/description/i), "New description");
    await user.clear(screen.getByLabelText(/due date/i));
    await user.type(screen.getByLabelText(/due date/i), "2026-09-15");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(updateCard).toHaveBeenCalledWith(
      1,
      { title: "Test Card", description: "New description", dueDate: "2026-09-15" },
      1
    );
    expect(onClose).toHaveBeenCalled();
  });
});
