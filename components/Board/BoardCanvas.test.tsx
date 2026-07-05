import { render, screen, act } from "@testing-library/react";
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
