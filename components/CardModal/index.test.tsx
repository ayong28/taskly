import { render, screen } from "@testing-library/react";
import { CardModal } from "@/components/CardModal";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/lib/actions/cards", () => ({
  renameCard: jest.fn(),
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
