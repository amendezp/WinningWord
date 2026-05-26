import Link from "next/link";

export function TopBar() {
  return (
    <header className="h-14 border-b border-stone-200 px-6 flex items-center justify-between bg-paper/80 backdrop-blur">
      <Link href="/" className="text-base font-medium tracking-wide text-stone-800">
        WinningWord
      </Link>
      <nav className="flex items-center gap-5 text-sm text-stone-500">
        <Link href="/rules" className="hover:text-stone-900">
          Rules
        </Link>
      </nav>
    </header>
  );
}
