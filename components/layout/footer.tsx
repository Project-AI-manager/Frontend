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
    <footer className="border-t border-line bg-white text-ink">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-md">
            <p className="text-base font-semibold">Автопилот</p>
            <p className="wf-muted mt-2 text-sm leading-6">
              AI-менеджер, который собирает обращения из каналов, ищет ответы в
              базе знаний и помогает команде отвечать быстрее.
            </p>
          </div>

          <FooterColumn title="Продукт" links={productLinks} />
          <FooterColumn title="Правовое" links={legalLinks} />
        </div>

        <div className="wf-divider mt-8" />

        <p className="wf-muted mt-6 text-sm">© 2026 Автопилот</p>
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
