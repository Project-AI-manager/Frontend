import Link from "next/link";

const marketingLinks = [
  { href: "/#problem", label: "Проблема" },
  { href: "/#solution", label: "Решение" },
  { href: "/#model", label: "Тарифы" },
  { href: "/#traction", label: "Трекшн" },
];

export function Header() {
  return (
    <div className="pointer-events-none sticky top-4 z-40 flex w-full justify-center px-4">
      <header className="pointer-events-auto flex w-full max-w-[860px] items-center justify-between rounded-full border border-[rgba(36,99,235,0.2)] bg-white/85 px-3 py-2 shadow-[0_16px_42px_rgba(18,39,76,0.13),inset_0_1px_0_rgba(255,255,255,0.94)] backdrop-blur-xl">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-full px-3 py-1.5 transition hover:bg-blue-50"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition group-hover:-translate-y-0.5">
            А
          </span>
          <span className="text-sm font-black tracking-tight text-slate-900">
            Автопилот
          </span>
        </Link>

        <nav
          aria-label="Разделы лендинга"
          className="hidden items-center gap-2 text-[14px] font-semibold text-slate-500 md:flex"
        >
          {marketingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 transition hover:bg-blue-50 hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 text-sm font-semibold sm:gap-2">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:px-4"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-blue-600 px-3 py-2 text-white shadow-[0_11px_25px_rgba(36,99,235,0.2)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_15px_30px_rgba(36,99,235,0.28)] sm:px-4"
          >
            Регистрация
          </Link>
        </div>
      </header>
    </div>
  );
}
