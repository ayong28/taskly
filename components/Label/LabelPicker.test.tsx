import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabelPicker } from "@/components/Label/LabelPicker";
import { createLabel, assignLabelToCard, removeLabelFromCard } from "@/lib/actions/labels";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

// base-ui's Menu relies on layout/observer APIs jsdom doesn't provide, so a
// real click on the trigger never opens the popup in this environment.
// Replace it with plain pass-through elements so the test exercises our own
// wiring (which row calls which action) instead of the third-party primitive.
jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

jest.mock("@/lib/actions/labels", () => ({
  createLabel: jest.fn(),
  renameLabel: jest.fn(),
  deleteLabel: jest.fn(),
  assignLabelToCard: jest.fn(),
  removeLabelFromCard: jest.fn(),
}));

const allLabels = [
  { id: 1, name: "Urgent", color: "red" },
  { id: 2, name: "Docs", color: "blue" },
];

async function openPicker() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /labels/i }));
  return user;
}

describe("LabelPicker", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists every global label as a row", async () => {
    render(
      <LabelPicker cardId={10} boardId={1} allLabels={allLabels} assignedLabelIds={[]} />
    );
    await openPicker();

    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("Docs")).toBeInTheDocument();
  });

  it("clicking an unassigned label row assigns it to the card", async () => {
    render(
      <LabelPicker cardId={10} boardId={1} allLabels={allLabels} assignedLabelIds={[]} />
    );
    const user = await openPicker();

    await user.click(screen.getByText("Urgent"));

    expect(assignLabelToCard).toHaveBeenCalledWith(10, 1, 1);
    expect(removeLabelFromCard).not.toHaveBeenCalled();
  });

  it("clicking an already-assigned label row removes it from the card", async () => {
    render(
      <LabelPicker cardId={10} boardId={1} allLabels={allLabels} assignedLabelIds={[1]} />
    );
    const user = await openPicker();

    await user.click(screen.getByText("Urgent"));

    expect(removeLabelFromCard).toHaveBeenCalledWith(10, 1, 1);
    expect(assignLabelToCard).not.toHaveBeenCalled();
  });

  it("disables the create button until a name is entered", async () => {
    render(
      <LabelPicker cardId={10} boardId={1} allLabels={allLabels} assignedLabelIds={[]} />
    );
    await openPicker();

    expect(screen.getByRole("button", { name: /create label/i })).toBeDisabled();
  });

  it("creating a new label calls createLabel with the typed name and chosen color, then assigns it to the card", async () => {
    (createLabel as jest.Mock).mockResolvedValue({ id: 99, name: "Blocked", color: "orange" });

    render(
      <LabelPicker cardId={10} boardId={1} allLabels={allLabels} assignedLabelIds={[]} />
    );
    const user = await openPicker();

    await user.type(screen.getByPlaceholderText(/new label/i), "Blocked");
    await user.click(screen.getByTestId("swatch-orange"));
    await user.click(screen.getByRole("button", { name: /create label/i }));

    expect(createLabel).toHaveBeenCalledWith("Blocked", "orange", 1);
    expect(assignLabelToCard).toHaveBeenCalledWith(10, 99, 1);
  });
});
