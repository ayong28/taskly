"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BoardLink({ board }: { board: { id: number; title: string; color: string } }) {
  const pathname = usePathname();
  const isActive = pathname === `/board/${board.id}`;

  return (
    <Link
      href={`/board/${board.id}`}
      aria-current={isActive ? "page" : undefined}
      className={
        isActive
          ? "group flex items-center gap-2.5 border-l-2 border-accent bg-sidebar-accent px-4 py-2 text-sm text-sidebar-foreground shadow-[var(--glow-magenta)] transition-colors"
          : "group flex items-center gap-2.5 border-l-2 border-transparent px-4 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:border-primary hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: board.color, boxShadow: `0 0 6px ${board.color}` }}
      />
      {board.title}
    </Link>
  );
}
