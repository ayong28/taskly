import Image from "next/image";

export function AppHeader() {
  return (
    <header className="flex h-28 w-full shrink-0 overflow-hidden border-b border-sidebar-border">
      <div className="relative flex w-[10%] shrink-0 items-center justify-center overflow-hidden bg-sidebar">
        <div
          className="overflow-hidden rounded-xl"
          style={{
            boxShadow:
              "0 0 0 1px color-mix(in oklab, #00f0ff 40%, transparent), 0 0 18px color-mix(in oklab, #ff00e5 45%, transparent)",
          }}
        >
          <Image
            src="/taskly-logo.png"
            alt="Taskly"
            width={64}
            height={64}
            priority
            className="block"
          />
        </div>
      </div>
      <div className="relative w-[90%] grow overflow-hidden">
        <Image
          src="/header-placeholder.svg"
          alt=""
          fill
          priority
          className="object-cover"
        />
      </div>
    </header>
  );
}
