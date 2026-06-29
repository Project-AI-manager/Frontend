import Link from "next/link";

const marketingLinks = [
  { href: "/#features", label: "Возможности" },
  { href: "/#how", label: "Как работает" },
  { href: "/#pricing", label: "Тарифы" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#fffaf2]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-black text-sm font-black text-white shadow-lg shadow-black/15">
            Е
          </span>
          <span className="text-lg font-black tracking-tight">Едино</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
          {marketingLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-black">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-neutral-700 transition hover:bg-black/5 sm:block">
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-black px-5 py-2.5 text-white shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Попробовать
          </Link>
        </div>
      </div>
    </header>
  );
}
