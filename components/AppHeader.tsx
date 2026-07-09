import Image from "next/image";

export function AppHeader() {
  return (
    <header className="relative h-28 w-full shrink-0 overflow-hidden border-b border-sidebar-border">
      <Image
        src="/header-placeholder.svg"
        alt="Taskly"
        fill
        priority
        className="object-cover"
      />
    </header>
  );
}
