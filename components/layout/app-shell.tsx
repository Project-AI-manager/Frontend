"use client";

import {
  BarChart3,
  BookOpenText,
  MessageCircleMore,
  RadioTower,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const primaryNavigation = [
  { href: "/inbox", label: "Диалоги", icon: MessageCircleMore },
  { href: "/knowledge", label: "База знаний", icon: BookOpenText },
  { href: "/channels", label: "Каналы", icon: RadioTower },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
];

type AppShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  showTopbar?: boolean;
};

export function AppShell({ title, description, children, showTopbar = true }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <nav aria-label="Кабинет" className="app-primary-nav">
          {primaryNavigation.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="app-nav-link"
                data-active={isActive || undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon aria-hidden="true" size={22} strokeWidth={1.9} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="app-utility-nav">
          <Link
            href="/settings"
            className="app-nav-link"
            data-active={pathname === "/settings" || undefined}
            aria-current={pathname === "/settings" ? "page" : undefined}
          >
            <Settings aria-hidden="true" size={22} strokeWidth={1.9} />
            <span>Настройки</span>
          </Link>
          <Link
            href="/profile"
            className="app-profile-link"
            data-active={pathname === "/profile" || undefined}
            aria-label="Профиль"
          >
            <UserRound aria-hidden="true" size={19} strokeWidth={1.9} />
          </Link>
        </div>
      </aside>

      <section className="app-workspace">
        {showTopbar ? (
          <header className="app-topbar">
            <div className="min-w-0">
              <p className="app-eyebrow">Автопилот</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            <div className="app-status" aria-label="Статус AI: на линии">
              <span aria-hidden="true" />
              AI на линии
            </div>
          </header>
        ) : null}
        <main className={`app-main${showTopbar ? "" : " app-main--full"}`}>{children}</main>
      </section>
    </div>
  );
}
