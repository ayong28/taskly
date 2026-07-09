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
      <Image
        src="/taskly-logo.png"
        alt=""
        width={64}
        height={64}
        priority
        className="absolute top-1/2 left-6 -translate-y-1/2 drop-shadow-[0_0_12px_rgba(255,0,229,0.5)]"
      />
    </header>
  );
}
