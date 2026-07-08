import { db } from "@/lib/db";
import { boards } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NewBoardButton } from "./NewBoardButton";
import { ArchivedBoardsSection } from "./ArchivedBoardsSection";
import { BoardLink } from "./BoardLink";

export async function Sidebar() {
  const allBoards = await db
    .select()
    .from(boards)
    .where(eq(boards.archived, false))
    .orderBy(boards.createdAt);

  const archivedBoards = await db
    .select()
    .from(boards)
    .where(eq(boards.archived, true))
    .orderBy(boards.createdAt);

  return (
    <nav
      aria-label="Boards"
      className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <span className="font-heading text-xs font-bold tracking-widest text-sidebar-foreground uppercase">
          Boards
        </span>
        <NewBoardButton />
      </div>
      <ul className="flex-1 overflow-y-auto py-2">
        {allBoards.map((board) => (
          <li key={board.id}>
            <BoardLink board={board} />
          </li>
        ))}
      </ul>
      <ArchivedBoardsSection boards={archivedBoards} />
    </nav>
  );
}
