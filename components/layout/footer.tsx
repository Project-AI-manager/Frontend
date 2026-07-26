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
    <footer className="border-t border-line bg-surface text-ink">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <span className="brand-mark size-10" aria-hidden="true" />
              <span className="font-display text-lg font-extrabold">
                Автопилот
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              AI-менеджер, который собирает обращения из каналов, ищет ответы в
              базе знаний и помогает команде отвечать быстрее.
            </p>
          </div>

          <FooterColumn title="Продукт" links={productLinks} />
          <FooterColumn title="Правовое" links={legalLinks} />
        </div>

        <div className="divider mt-12" />

        <p className="mt-6 text-sm text-muted">© 2026 Автопилот</p>
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
      <p className="font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-ink">
        {title}
      </p>
      <ul className="mt-4 space-y-1 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-10 items-center text-muted transition hover:text-brand"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
