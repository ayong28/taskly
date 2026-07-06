import { render, screen, act, fireEvent, within } from "@testing-library/react";
import { BoardCanvas } from "@/components/Board/BoardCanvas";

// dnd-kit's real sensors need genuine pointer/layout events, which jsdom can't
// produce reliably. Since this test is only about *our* wiring (does BoardCanvas
// render the dragged card inside DragOverlay?), replace DndContext/DragOverlay
// with simple stand-ins and drive them directly by capturing their callbacks.
let capturedDragStart: ((e: { active: { id: string } }) => void) | null = null;
let capturedDragEnd: ((e: { active: { id: string }; over: null }) => void) | null = null;

jest.mock("@dnd-kit/core", () => ({
  DndContext: ({
    children,
    onDragStart,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragStart?: (e: { active: { id: string } }) => void;
    onDragEnd?: (e: { active: { id: string }; over: null }) => void;
  }) => {
    capturedDragStart = onDragStart ?? null;
    capturedDragEnd = onDragEnd ?? null;
    return <div>{children}</div>;
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
  useDroppable: () => ({ setNodeRef: () => {} }),
  useSensor: () => null,
  useSensors: () => [],
  PointerSensor: class {},
  closestCenter: () => [],
}));

jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: () => null,
  arrayMove: <T,>(arr: T[], from: number, to: number) => {
    const copy = arr.slice();
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  },
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/lib/actions/dnd", () => ({
  moveCard: jest.fn(),
  moveList: jest.fn(),
}));
jest.mock("@/lib/actions/cards", () => ({
  createCard: jest.fn(),
  renameCard: jest.fn(),
  deleteCard: jest.fn(),
  archiveCard: jest.fn(),
  restoreCard: jest.fn(),
}));
jest.mock("@/lib/actions/lists", () => ({
  createList: jest.fn(),
  renameList: jest.fn(),
  deleteList: jest.fn(),
}));
jest.mock("@/lib/actions/labels", () => ({
  createLabel: jest.fn(),
  renameLabel: jest.fn(),
  deleteLabel: jest.fn(),
  assignLabelToCard: jest.fn(),
  removeLabelFromCard: jest.fn(),
}));

describe("BoardCanvas drag overlay", () => {
  const lists = [{ id: 1, title: "To Do", boardId: 1, position: 0 }];
  const initialCardsByList = new Map([
    [1, [{ id: 1, title: "Test Card", listId: 1, position: 0 }]],
  ]);

  it("shows a duplicate of the card being dragged inside the DragOverlay", () => {
    render(
      <BoardCanvas boardId={1} lists={lists} initialCardsByList={initialCardsByList} />
    );

    // Only the in-list tile exists before a drag starts.
    expect(screen.getAllByText("Test Card")).toHaveLength(1);

    act(() => {
      capturedDragStart?.({ active: { id: "card-1" } });
    });

    // A second copy should now render inside the DragOverlay, following the pointer.
    const overlay = screen.getByTestId("drag-overlay");
    expect(overlay).toHaveTextContent("Test Card");
    expect(screen.getAllByText("Test Card")).toHaveLength(2);

    act(() => {
      capturedDragEnd?.({ active: { id: "card-1" }, over: null });
    });

    // Overlay clears once the drag ends.
    expect(screen.getAllByText("Test Card")).toHaveLength(1);
  });
});

describe("BoardCanvas filtering", () => {
  const lists = [{ id: 1, title: "To Do", boardId: 1, position: 0 }];
  const allLabels = [
    { id: 1, name: "Bug", color: "red" },
    { id: 2, name: "Urgent", color: "orange" },
  ];
  const initialCardsByList = new Map([
    [
      1,
      [
        { id: 1, title: "Bug Card", listId: 1, position: 0 },
        { id: 2, title: "Other Card", listId: 1, position: 1 },
      ],
    ],
  ]);
  const cardLabelIds = new Map([[1, [1]]]);

  it("hides cards that don't match the selected label, keeping them mounted", () => {
    render(
      <BoardCanvas
        boardId={1}
        lists={lists}
        initialCardsByList={initialCardsByList}
        allLabels={allLabels}
        cardLabelIds={cardLabelIds}
      />
    );

    fireEvent.change(screen.getByLabelText("Filter by label"), { target: { value: "1" } });

    expect(screen.getByText("Bug Card").closest("[data-card-wrapper]")).not.toHaveClass("hidden");
    expect(screen.getByText("Other Card").closest("[data-card-wrapper]")).toHaveClass("hidden");
  });
});

describe("BoardCanvas special lists", () => {
  it("renders a special list's header without a list-options menu", () => {
    const lists = [
      { id: 1, title: "To Do", boardId: 1, position: 0 },
      { id: 2, title: "Archived", boardId: 1, position: 1, special: true },
    ];
    const initialCardsByList = new Map([
      [1, []],
      [2, [{ id: 5, title: "Old Card", listId: 2, position: 0, archived: true }]],
    ]);

    render(
      <BoardCanvas boardId={1} lists={lists} initialCardsByList={initialCardsByList} />
    );

    // The archived card renders normally, as a card belonging to the Archived list.
    expect(screen.getByText("Old Card")).toBeInTheDocument();

    const archivedListCol = screen.getByText("Old Card").closest('[aria-label="Archived list"]');
    expect(archivedListCol).not.toBeNull();
    expect(
      within(archivedListCol as HTMLElement).queryByRole("button", { name: /list options/i })
    ).not.toBeInTheDocument();
  });
});
