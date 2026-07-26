"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type MarketingLink = {
  href: string;
  anchor: string;
  label: string;
};

const marketingLinks: MarketingLink[] = [
  { href: "/#features", anchor: "features", label: "Возможности" },
  { href: "/#how", anchor: "how", label: "Как работает" },
  { href: "/#pricing", anchor: "pricing", label: "Тарифы" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Сжатие пилюли при скролле + подсветка активного якоря лендинга.
  // На страницах без этих секций activeAnchor просто остаётся null.
  useEffect(() => {
    let frame = 0;

    const sync = () => {
      frame = 0;
      setIsScrolled(window.scrollY > 40);

      const line = window.innerHeight * 0.34;
      let current: string | null = null;

      for (const link of marketingLinks) {
        const section = document.getElementById(link.anchor);

        if (section && section.getBoundingClientRect().top <= line) {
          current = link.anchor;
        }
      }

      setActiveAnchor(current);
    };

    const schedule = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(sync);
      }
    };

    sync();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

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

  // Курсорный «прожектор»: CSS читает --nav-x / --nav-y в radial-gradient.
  const moveSpotlight = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const inner = event.currentTarget;
      const rect = inner.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      inner.style.setProperty("--nav-x", `${x.toFixed(2)}%`);
      inner.style.setProperty("--nav-y", `${y.toFixed(2)}%`);
    },
    [],
  );

  const resetSpotlight = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.currentTarget.style.setProperty("--nav-x", "50%");
      event.currentTarget.style.setProperty("--nav-y", "50%");
    },
    [],
  );

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
    <header className="pill-nav" data-scrolled={isScrolled ? "true" : "false"}>
      <div
        className="pill-nav-inner"
        onMouseMove={moveSpotlight}
        onMouseLeave={resetSpotlight}
      >
        <Link
          href="/"
          className="inline-flex h-11 flex-none items-center gap-2.5 rounded-full px-2.5 transition hover:bg-brand-soft"
        >
          <span className="brand-mark size-8" aria-hidden="true" />
          <span className="font-display text-sm font-extrabold text-ink">
            Автопилот
          </span>
        </Link>

        <nav
          aria-label="Разделы лендинга"
          className="hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex"
        >
          {marketingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="pill-link inline-flex items-center"
              data-active={activeAnchor === link.anchor ? "true" : undefined}
              aria-current={
                activeAnchor === link.anchor ? "location" : undefined
              }
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-none items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login" className="btn btn-ghost btn-sm">
              Войти
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Попробовать
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-controls="landing-navigation"
            aria-expanded={isMenuOpen}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-white text-ink-soft transition hover:border-brand hover:bg-brand-soft hover:text-brand md:hidden"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={closeMenu}
            className="pointer-events-auto fixed inset-0 -z-10 cursor-default bg-ink/25 backdrop-blur-[2px] md:hidden"
          />

          <div
            ref={menuRef}
            id="landing-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Главное меню"
            onKeyDown={keepFocusInMenu}
            className="panel pointer-events-auto mx-auto mt-2 w-[calc(100%-40px)] max-w-[980px] p-3 md:hidden"
          >
            <nav aria-label="Разделы лендинга, мобильное меню">
              <ul className="space-y-1">
                {marketingLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={
                        activeAnchor === link.anchor ? "location" : undefined
                      }
                      className={`flex min-h-11 items-center rounded-md border px-3 text-sm font-bold transition ${
                        activeAnchor === link.anchor
                          ? "border-brand/25 bg-brand-soft text-brand-dark"
                          : "border-transparent text-muted hover:bg-surface hover:text-ink"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-3 grid gap-2 border-t border-line-soft pt-3">
              <Link
                href="/login"
                onClick={closeMenu}
                className="btn btn-secondary w-full"
              >
                Войти
              </Link>
              <Link
                href="/register"
                onClick={closeMenu}
                className="btn btn-primary w-full"
              >
                Попробовать
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
