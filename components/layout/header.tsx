import Link from "next/link";

const links = [
  { href: "/#product", label: "Продукт" },
  { href: "/#workflow", label: "Как работает" },
  { href: "/#pricing", label: "Тарифы" },
];

export function Header() {
  return (
    <header className="border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-8 px-5">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <span className="flex size-9 items-center justify-center border border-black text-xs">АП</span>
          <span>Автопилот</span>
        </Link>
        <nav className="ml-auto hidden gap-6 text-sm md:flex" aria-label="Главная навигация">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="flex gap-2">
          <Link href="/login" className="wire-button">Войти</Link>
          <Link href="/register" className="wire-button-dark">Попробовать</Link>
        </div>
      </div>
    </header>
  );
}
