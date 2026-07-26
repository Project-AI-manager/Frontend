"use client";

import {
  BarChart3,
  BrainCircuit,
  Cable,
  Inbox,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const primaryNavigation: NavigationItem[] = [
  { href: "/inbox", label: "Диалоги", icon: Inbox },
  { href: "/knowledge", label: "База знаний", icon: BrainCircuit },
  { href: "/channels", label: "Каналы", icon: Cable },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
];

const workspaceNavigation: NavigationItem[] = [
  { href: "/settings", label: "Настройки", icon: Settings },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

type AppShellProps = {
  title: string;
  description: string;
  /** Действия страницы в верхней панели: кнопки, фильтры, статусы. */
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  const pathname = usePathname() ?? "";
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMobileNavigationOpen) {
      return;
    }

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileNavigationOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileNavigationOpen]);

  return (
    <div className="min-h-screen bg-white text-ink">
      <a
        href="#main-content"
        className="wf-box fixed left-4 top-4 z-[70] -translate-y-24 px-4 py-2 text-sm focus:translate-y-0"
      >
        Перейти к содержимому
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-14 flex-none items-center border-b border-line px-4">
          <Brand />
        </div>

        <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 pt-4 pb-6">
          <Navigation
            pathname={pathname}
            label="Основная навигация"
            items={primaryNavigation}
          />

          <div className="mt-auto border-t border-line-soft pt-4">
            <Navigation
              pathname={pathname}
              label="Рабочее пространство"
              items={workspaceNavigation}
            />
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-60">
        <header className="border-b border-line bg-white">
          <div className="flex min-h-14 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setIsMobileNavigationOpen(true)}
              className="wf-btn shrink-0 lg:hidden"
              aria-label="Открыть меню"
              aria-controls="mobile-navigation"
              aria-expanded={isMobileNavigationOpen}
            >
              <Menu size={18} className="text-muted" />
            </button>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 basis-64">
                <h1 className="truncate text-lg font-semibold">{title}</h1>
                <p className="wf-muted mt-0.5 line-clamp-2 max-w-3xl text-sm leading-snug">
                  {description}
                </p>
              </div>

              {actions ? (
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {actions}
                </div>
              ) : null}
            </div>

            <Link
              href="/profile"
              aria-label="Открыть профиль"
              className="wf-btn shrink-0"
            >
              <UserRound size={18} className="text-muted" />
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {isMobileNavigationOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/20"
            onClick={() => setIsMobileNavigationOpen(false)}
          />
          <aside
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Меню кабинета"
            className="relative flex h-full w-[min(19rem,88vw)] flex-col border-r border-line bg-white"
          >
            <div className="flex h-14 flex-none items-center justify-between gap-3 border-b border-line px-4">
              <Brand />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsMobileNavigationOpen(false)}
                className="wf-btn shrink-0"
                aria-label="Закрыть меню"
              >
                <X size={18} className="text-muted" />
              </button>
            </div>

            <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 pt-4 pb-6">
              <Navigation
                pathname={pathname}
                label="Основная навигация"
                items={primaryNavigation}
                onNavigate={() => setIsMobileNavigationOpen(false)}
              />
              <div className="mt-auto border-t border-line-soft pt-4">
                <Navigation
                  pathname={pathname}
                  label="Рабочее пространство"
                  items={workspaceNavigation}
                  onNavigate={() => setIsMobileNavigationOpen(false)}
                />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Brand() {
  return (
    <Link
      href="/inbox"
      className="text-base font-semibold"
      aria-label="Автопилот — диалоги"
    >
      Автопилот
    </Link>
  );
}

function Navigation({
  pathname,
  label,
  items,
  onNavigate,
}: {
  pathname: string;
  label: string;
  items: NavigationItem[];
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label={label}>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = isNavigationItemActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                data-active={isActive ? "true" : undefined}
                className="wf-nav-item"
              >
                <item.icon size={18} className="shrink-0 text-muted" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
