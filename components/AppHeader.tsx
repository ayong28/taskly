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
      <div
        className="absolute top-1/2 left-6 -translate-y-1/2 overflow-hidden rounded-xl"
        style={{
          boxShadow:
            "0 0 0 1px color-mix(in oklab, #00f0ff 40%, transparent), 0 0 18px color-mix(in oklab, #ff00e5 45%, transparent)",
        }}
      >
        <Image
          src="/taskly-logo.png"
          alt=""
          width={64}
          height={64}
          priority
          className="block"
        />
      </div>
    </header>
  );
}
