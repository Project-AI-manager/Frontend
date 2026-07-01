import Link from "next/link";

const marketingLinks = [
  { href: "/#problem", label: "Проблема" },
  { href: "/#market", label: "Рынок" },
  { href: "/#model", label: "Модель" },
  { href: "/#traction", label: "Трекшн" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-blue-700 text-sm font-black text-white shadow-lg shadow-blue-700/20">
            Е
          </span>
          <span className="text-lg font-black tracking-tight text-slate-950">Едино</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {marketingLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-blue-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-slate-700 transition hover:bg-slate-100 sm:block">
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-blue-700 px-5 py-2.5 text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            MVP
          </Link>
        </div>
      </div>
    </header>
  );
}
