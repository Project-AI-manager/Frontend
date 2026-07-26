import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-5 py-8 text-sm md:flex-row">
        <p><strong>Автопилот</strong> · черновой каркас продукта</p>
        <div className="flex gap-5 wire-muted">
          <Link href="/legal/privacy">Конфиденциальность</Link>
          <Link href="/legal/terms">Условия</Link>
        </div>
      </div>
    </footer>
  );
}
