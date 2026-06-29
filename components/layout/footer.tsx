import Link from "next/link";

// Подвал сайта (общий компонент). Дизайн — TODO.
export function Footer() {
  return (
    <footer className="w-full border-t">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm">
        <span>© 2026 Едино</span>
        <div className="flex gap-4">
          <Link href="/legal/privacy">Политика конфиденциальности</Link>
          <Link href="/legal/terms">Условия</Link>
        </div>
      </div>
    </footer>
  );
}
