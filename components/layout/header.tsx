import Link from "next/link";

const marketingLinks = [
  { href: "/#features", label: "Возможности" },
  { href: "/#how", label: "Как работает" },
  { href: "/#pricing", label: "Тарифы" },
];

export function Header() {
  return (
    <header className="sticky top-4 z-40 h-0 px-5 lg:px-8">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 overflow-hidden rounded-full border border-[rgba(36,99,235,0.2)] bg-white/90 px-3 py-2 shadow-[0_18px_44px_rgba(18,39,76,0.13)] backdrop-blur-xl">
        <Link
          href="/"
          className="flex h-11 items-center gap-3 rounded-full px-2 pr-4 transition hover:bg-blue-50"
        >
          <span className="brand-mark size-8" />
          <span className="text-sm font-black tracking-tight text-[#101828]">
            Автопилот
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-2 text-sm font-bold text-[#526071] md:flex">
          {marketingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 transition hover:bg-blue-50 hover:text-[#2463eb]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm font-semibold">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-[#526071] transition hover:bg-blue-50 hover:text-[#2463eb] sm:block"
          >
            Войти
          </Link>
          <Link href="/register" className="primary-button h-11 px-5 text-sm">
            Попробовать
          </Link>
        </div>
      </div>
    </header>
  );
}
