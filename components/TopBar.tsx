import Link from "next/link";
import { ProviderToggle } from "./ProviderToggle";

export function TopBar() {
  return (
    <header className="h-14 border-b border-stone-200 px-6 flex items-center justify-between bg-paper/80 backdrop-blur">
      <Link href="/" className="flex items-baseline gap-3 group">
        <span className="text-base font-medium tracking-wide text-stone-800">
          WinningWord
        </span>
        <span className="hidden sm:inline font-serif italic text-sm text-stone-500 group-hover:text-stone-700 transition-colors">
          you are what you write
        </span>
      </Link>
      <nav className="flex items-center gap-5 text-sm text-stone-500">
        <ProviderToggle />
        <Link href="/rules" className="hover:text-stone-900">
          Rules
        </Link>
      </nav>
    </header>
  );
}
