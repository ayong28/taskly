import Link from "next/link";
import { db } from "@/lib/db";
import { boards } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NewBoardButton } from "./NewBoardButton";

export async function Sidebar() {
  const allBoards = await db
    .select()
    .from(boards)
    .where(eq(boards.archived, false))
    .orderBy(boards.createdAt);

  return (
    <nav
      aria-label="Boards"
      className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-700">Boards</span>
        <NewBoardButton />
      </div>
      <ul className="flex-1 overflow-y-auto py-2">
        {allBoards.map((board) => (
          <li key={board.id}>
            <Link
              href={`/board/${board.id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              <span
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: board.color }}
              />
              {board.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
