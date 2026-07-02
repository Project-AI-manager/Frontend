import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#d9e1ec] bg-white text-[#101828]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 text-sm lg:grid-cols-[1.2fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="brand-mark size-10" />
            <span className="text-lg font-black">Автопилот</span>
          </div>
          <p className="mt-4 max-w-md leading-6 text-[#526071]">
            AI-менеджер, который собирает обращения из каналов, ищет ответы в
            базе знаний и помогает команде отвечать быстрее.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-6 text-[#526071] lg:justify-end">
          <Link
            href="/legal/privacy"
            className="transition hover:text-[#2463eb]"
          >
            Политика конфиденциальности
          </Link>
          <Link href="/legal/terms" className="transition hover:text-[#2463eb]">
            Условия
          </Link>
          <span>© 2026 Автопилот</span>
        </div>
      </div>
    </footer>
  );
}
