import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#14110f] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 text-sm lg:grid-cols-[1.2fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-black">
              Е
            </span>
            <span className="text-lg font-black">Едино</span>
          </div>
          <p className="mt-4 max-w-md text-white/60">
            AI-менеджер, который собирает обращения из каналов, ищет ответы в базе знаний и
            помогает команде отвечать быстрее.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-6 text-white/70 lg:justify-end">
          <Link href="/legal/privacy" className="transition hover:text-white">
            Политика конфиденциальности
          </Link>
          <Link href="/legal/terms" className="transition hover:text-white">
            Условия
          </Link>
          <span>© 2026 Едино</span>
        </div>
      </div>
    </footer>
  );
}
