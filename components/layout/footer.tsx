import Link from "next/link";

type FooterLink = {
  href: string;
  label: string;
};

const productLinks: FooterLink[] = [
  { href: "/#features", label: "Возможности" },
  { href: "/#how", label: "Как работает" },
  { href: "/#pricing", label: "Тарифы" },
];

const legalLinks: FooterLink[] = [
  { href: "/legal/terms", label: "Условия" },
  { href: "/legal/privacy", label: "Политика конфиденциальности" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#f4f7fb] text-slate-900 pb-8 pt-16">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 text-sm lg:grid-cols-[1.2fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20">
              А
            </span>
            <span className="text-lg font-black tracking-tight">Автопилот</span>
          </div>
          <p className="mt-4 max-w-md text-slate-600 leading-relaxed">
            AI-сотрудник для МСП: единое окно обращений, RAG по базе знаний, эскалация
            менеджеру и самообучение на реальных диалогах.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-6 font-semibold text-slate-500 lg:justify-end mt-4 lg:mt-0">
          <Link href="/legal/privacy" className="transition hover:text-blue-600">
            Политика конфиденциальности
          </Link>
          <Link href="/legal/terms" className="transition hover:text-blue-600">
            Условия
          </Link>
          <span>© 2026 Автопилот</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div className="min-w-0">
      <p className="wf-kicker">{title}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="wf-muted inline-flex min-h-9 items-center"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
