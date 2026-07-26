"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type MarketingLink = {
  href: string;
  label: string;
};

const marketingLinks: MarketingLink[] = [
  { href: "/#features", label: "Возможности" },
  { href: "/#how", label: "Как работает" },
  { href: "/#pricing", label: "Тарифы" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Мобильное меню: фокус внутрь при открытии, Escape — назад на бургер,
  // переход на десктопную ширину закрывает шторку.
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        toggleRef.current?.focus();
      }
    }

    const desktop = window.matchMedia("(min-width: 768px)");

    function closeOnDesktop() {
      if (desktop.matches) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [isMenuOpen]);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  // Шторка помечена как модальная, поэтому Tab не должен уводить фокус
  // на фон: замыкаем его между первым и последним элементом меню.
  const keepFocusInMenu = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );

      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [],
  );

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex-none text-base font-semibold text-ink">
          Автопилот
        </Link>

        <nav
          aria-label="Разделы лендинга"
          className="hidden min-w-0 flex-1 items-center justify-end gap-5 md:flex"
        >
          {marketingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-none items-center gap-2 md:ml-4">
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login" className="wf-btn">
              Войти
            </Link>
            <Link href="/register" className="wf-btn wf-btn-primary">
              Попробовать
            </Link>
          </div>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-controls="landing-navigation"
            aria-expanded={isMenuOpen}
            className="wf-btn shrink-0 md:hidden"
          >
            {isMenuOpen ? (
              <X size={18} className="text-muted" />
            ) : (
              <Menu size={18} className="text-muted" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={closeMenu}
            className="fixed inset-0 z-40 cursor-default bg-ink/20 md:hidden"
          />

          <div
            ref={menuRef}
            id="landing-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Главное меню"
            onKeyDown={keepFocusInMenu}
            className="relative z-50 border-t border-line bg-white px-4 py-4 sm:px-6 md:hidden"
          >
            <nav aria-label="Разделы лендинга, мобильное меню">
              <ul className="space-y-1">
                {marketingLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      className="wf-nav-item"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-4 grid gap-2 border-t border-line-soft pt-4">
              <Link href="/login" onClick={closeMenu} className="wf-btn w-full">
                Войти
              </Link>
              <Link
                href="/register"
                onClick={closeMenu}
                className="wf-btn wf-btn-primary w-full"
              >
                Попробовать
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
