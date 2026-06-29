import Link from "next/link";

// Шапка сайта (общий компонент). Дизайн — TODO: начинаем отсюда.
// Структура-скелет: логотип · навигация · действия. Без оформления.
export function Header() {
  return (
    <header className="w-full border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          Едино
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/#features">Возможности</Link>
          <Link href="/#how">Как работает</Link>
          <Link href="/#pricing">Тарифы</Link>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <Link href="/login">Войти</Link>
          <Link href="/register">Попробовать</Link>
        </div>
      </div>
    </header>
  );
}
