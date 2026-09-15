import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-white/5 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-ember to-forge text-sm font-black text-ink shadow-glow">
            F
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-snow">
            Forge
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-mist">
          <a
            href="https://github.com/Loreonsol/forge"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-snow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
