import Link from "next/link";

import { workspaceName } from "@/lib/demo-data";

const appLinks = [
  { href: "/inbox", label: "Диалоги" },
  { href: "/knowledge", label: "База знаний" },
  { href: "/analytics", label: "Аналитика" },
  { href: "/channels", label: "Каналы" },
  { href: "/settings", label: "Настройки" },
];

export function Logo() {
  return (
    <Link href="/" className="font-display text-2xl font-black tracking-tight text-ink">
      Едино
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-ink/70 md:flex">
            <a href="/#features" className="hover:text-brand">
              Возможности
            </a>
            <a href="/#how" className="hover:text-brand">
              Как работает
            </a>
            <a href="/#pricing" className="hover:text-brand">
              Тарифы
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface sm:block">
            Войти
          </Link>
          <Link href="/register" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
            Попробовать
          </Link>
        </div>
      </div>
    </header>
  );
}

export function AppHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-2 lg:flex">
            {appLinks.map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-brand text-white" : "text-ink/70 hover:bg-surface hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm font-medium text-ink/70 sm:inline">{workspaceName}</span>
          <Link
            href="/profile"
            className="grid h-10 w-10 place-items-center rounded-full bg-surface font-bold text-brand ring-1 ring-border"
            aria-label="Профиль"
          >
            Т
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PageShell({
  active,
  title,
  subtitle,
  children,
}: {
  active?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <AppHeader active={active} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand">Кабинет</p>
          <h1 className="font-display text-4xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 max-w-3xl text-lg text-ink/65">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Авто" || status === "Активен" || status === "Готов"
      ? "bg-status-auto-bg text-status-auto-fg"
      : status === "Нужен менеджер" || status === "Требует настройки" || status === "Обрабатывается"
        ? "bg-status-escalate-bg text-status-escalate-fg"
        : "bg-status-closed-bg text-status-closed-fg";

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{status}</span>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[10px] border border-border bg-surface p-6 shadow-sm ${className}`}>{children}</section>;
}
