import Link from "next/link";
import { db } from "@/lib/db";
import { boards } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NewBoardButton } from "./NewBoardButton";
import { ArchivedBoardsSection } from "./ArchivedBoardsSection";

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
            <Link
              href={`/board/${board.id}`}
              className="group flex items-center gap-2.5 border-l-2 border-transparent px-4 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:border-primary hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: board.color, boxShadow: `0 0 6px ${board.color}` }}
              />
              {board.title}
            </Link>
          </li>
        ))}
      </ul>
      <ArchivedBoardsSection boards={archivedBoards} />
    </nav>
  );
}
