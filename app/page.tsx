import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { boards } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function HomePage() {
  const allBoards = await db
    .select()
    .from(boards)
    .where(eq(boards.archived, false))
    .orderBy(boards.createdAt);

  if (allBoards.length > 0) {
    redirect(`/board/${allBoards[0].id}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center text-gray-500">
      <p>There are no boards in the database.</p>
    </div>
  );
}
