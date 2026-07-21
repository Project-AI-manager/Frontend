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
  children: ReactNode;
};

export function AppShell({ title, description, children }: AppShellProps) {
  const pathname = usePathname();
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
    <div className="min-h-screen bg-[#f7f9fc] text-[#101828]">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[70] -translate-y-24 rounded-lg bg-[#101828] px-4 py-2 text-sm font-bold text-white transition focus:translate-y-0"
      >
        Перейти к содержимому
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[#d9e1ec] bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-[#e5eaf1] px-5">
          <Brand />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3 py-5">
          <Navigation
            pathname={pathname}
            label="Основная навигация"
            items={primaryNavigation}
          />

          <div className="mt-auto border-t border-[#e5eaf1] pt-4">
            <Navigation
              pathname={pathname}
              label="Рабочее пространство"
              items={workspaceNavigation}
            />
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-[#d9e1ec] bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setIsMobileNavigationOpen(true)}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#d9e1ec] bg-white text-[#344054] transition hover:border-[#b9c9e3] hover:bg-[#f4f7fb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2463eb]/15 lg:hidden"
              aria-label="Открыть меню"
              aria-controls="mobile-navigation"
              aria-expanded={isMobileNavigationOpen}
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1 py-3">
              <p className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
                {title}
              </p>
              <p className="mt-0.5 hidden max-w-3xl truncate text-sm text-[#667085] sm:block">
                {description}
              </p>
            </div>

            <Link
              href="/profile"
              aria-label="Открыть профиль"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#d9e1ec] bg-[#f4f7fb] text-[#2463eb] transition hover:border-[#a9bde0] hover:bg-[#eaf1ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2463eb]/15"
            >
              <UserRound size={18} />
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {isMobileNavigationOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#101828]/35 backdrop-blur-[2px]"
            aria-label="Закрыть меню"
            onClick={() => setIsMobileNavigationOpen(false)}
          />
          <aside
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Меню кабинета"
            className="relative flex h-full w-[min(19rem,88vw)] flex-col bg-white shadow-[24px_0_70px_rgba(16,24,40,0.22)]"
          >
            <div className="flex h-16 items-center justify-between border-b border-[#e5eaf1] px-5">
              <Brand />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsMobileNavigationOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-lg text-[#526071] transition hover:bg-[#f4f7fb] hover:text-[#101828] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2463eb]/15"
                aria-label="Закрыть меню"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-5">
              <Navigation
                pathname={pathname}
                label="Основная навигация"
                items={primaryNavigation}
                onNavigate={() => setIsMobileNavigationOpen(false)}
              />
              <div className="mt-auto border-t border-[#e5eaf1] pt-4">
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
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2463eb]/15"
      aria-label="Автопилот — диалоги"
    >
      <span className="brand-mark size-8" aria-hidden="true" />
      <span className="text-lg font-black tracking-tight">Автопилот</span>
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
                className={`group flex min-h-10 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2463eb]/15 ${
                  isActive
                    ? "border-[#c9d8f5] bg-[#eaf1ff] text-[#1546ad]"
                    : "border-transparent text-[#526071] hover:bg-[#f4f7fb] hover:text-[#101828]"
                }`}
              >
                <item.icon
                  size={18}
                  className={isActive ? "text-[#2463eb]" : "text-[#7d8998] group-hover:text-[#526071]"}
                />
                <span>{item.label}</span>
                {isActive ? (
                  <span
                    className="ml-auto size-1.5 rounded-full bg-[#2463eb]"
                    aria-hidden="true"
                  />
                ) : null}
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
