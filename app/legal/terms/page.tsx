import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { AuthBackground } from "@/components/ui/auth-background";
import { getSiteUrl, SITE_HOST_DISPLAY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Правила использования сервиса «Автопилот», права и обязанности пользователей.",
  alternates: { canonical: getSiteUrl("/legal/terms") },
  openGraph: { url: getSiteUrl("/legal/terms") },
};

const publicationDate = "27 июля 2026";
const sections = [
  { id: "terms-definitions", label: "Термины" },
  { id: "terms-subject", label: "Предмет соглашения" },
  { id: "terms-rights", label: "Права и обязанности" },
  { id: "terms-payment", label: "Оплата" },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="relative isolate min-h-screen overflow-clip bg-[#f4f7fb] px-4 pb-16 pt-8 text-[#101828] sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
        <AuthBackground />

        <div className="relative mx-auto max-w-[1180px]">
          <header className="mb-6 overflow-hidden rounded-xl border border-[#d9e1ec] bg-white shadow-[0_18px_42px_rgba(18,39,76,.09)]">
            <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <span className="inline-flex rounded-full border border-[#cddfff] bg-[#eaf1ff] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#1546ad]">
                  Правовой документ
                </span>
                <h1 className="mt-5 font-heading text-3xl font-extrabold leading-[1.08] tracking-[-.05em] sm:text-4xl lg:text-[46px]">
                  Условия использования
                </h1>
                <p className="mt-5 max-w-[740px] text-base leading-7 text-[#526071]">
                  Правила работы с сервисом «Автопилот», обязанности пользователя и основные
                  условия предоставления функций личного кабинета.
                </p>
              </div>

              <dl className="grid content-start gap-4 rounded-xl border border-[#e5eaf1] bg-[#f8fbff] p-5 text-sm">
                <LegalFact term="Документ" description="Условия использования" />
                <LegalFact term="Дата редакции" description={publicationDate} />
                <LegalFact term="Статус" description="Действующая редакция" />
                <LegalFact term="Адрес документа" description={`https://${SITE_HOST_DISPLAY}/legal/terms`} />
              </dl>
            </div>
          </header>

          <details className="group mb-6 overflow-hidden rounded-xl border border-[#b9cff5] bg-white shadow-[0_12px_30px_rgba(18,39,76,.08)] lg:hidden">
            <summary className="flex min-h-14 cursor-pointer list-none select-none items-center justify-between gap-3 bg-[#eaf1ff] px-4 py-3.5 text-sm font-extrabold text-[#1546ad] hover:bg-[#dfeaff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2463eb] [&::-webkit-details-marker]:hidden">
              <span>Содержание условий</span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2463eb] text-white shadow-[0_6px_14px_rgba(36,99,235,.22)]">
                <ChevronDown aria-hidden="true" size={19} strokeWidth={2.5} className="transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <TermsNavigation mobile />
          </details>

          <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden lg:sticky lg:top-28 lg:block">
              <TermsNavigation />
            </aside>

            <article className="overflow-hidden rounded-xl border border-[#d9e1ec] bg-white shadow-[0_18px_42px_rgba(18,39,76,.09)]">
              <div className="divide-y divide-[#e5eaf1] px-6 sm:px-9 lg:px-12">
                <LegalSection id="terms-definitions" number="01" title="Термины">
                  <p>
                    «Автопилот» — программный сервис для обработки обращений клиентов,
                    подготовки ответов с помощью искусственного интеллекта и передачи диалогов
                    сотрудникам пользователя.
                  </p>
                  <p>
                    Пользователь — организация или физическое лицо, создавшее аккаунт и
                    использующее сервис в рамках выбранного тарифа.
                  </p>
                </LegalSection>

                <LegalSection id="terms-subject" number="02" title="Предмет соглашения">
                  <p>
                    Сервис предоставляет доступ к личному кабинету, базе знаний, каналам связи
                    и аналитике. Доступные функции и лимиты определяются тарифом пользователя.
                  </p>
                  <ul className="list-disc space-y-2 pl-5 marker:text-[#2463eb]">
                    <li>пользователь обеспечивает достоверность загружаемых данных;</li>
                    <li>проверяет ответы ассистента до включения автоматической отправки;</li>
                    <li>не использует сервис для нарушения закона и прав третьих лиц.</li>
                  </ul>
                  <blockquote className="rounded-xl border border-[#cddfff] bg-[#f8fbff] p-5 text-[15px] leading-7 text-[#526071]">
                    Автоматическая отправка ответов включается пользователем самостоятельно.
                    Пользователь отвечает за настройки базы знаний, порога уверенности и правил
                    эскалации.
                  </blockquote>
                </LegalSection>

                <LegalSection id="terms-rights" number="03" title="Права и обязанности">
                  <p>
                    Пользователь обязан сохранять конфиденциальность данных для входа. Сервис
                    вправе приостановить доступ при угрозе безопасности или существенном
                    нарушении условий.
                  </p>
                </LegalSection>

                <LegalSection id="terms-payment" number="04" title="Оплата">
                  <p>
                    Стоимость, расчётный период и лимиты указываются в кабинете. Оплаченные
                    услуги предоставляются в пределах выбранного тарифа.
                  </p>
                  <div className="rounded-xl border border-[#e5eaf1] bg-[#f8fbff] p-5 text-sm">
                    Вопросы по документу: {" "}
                    <a className="font-semibold text-[#1546ad] underline underline-offset-4" href="mailto:legal@xn--80aesmncewf.space">
                      legal@{SITE_HOST_DISPLAY}
                    </a>
                  </div>
                </LegalSection>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function TermsNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label={mobile ? "Разделы условий на мобильных устройствах" : "Разделы условий"}
      className={mobile ? "border-t border-[#d9e1ec] p-3" : "rounded-xl border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)]"}
    >
      {!mobile ? (
        <p className="px-2 pb-3 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">
          Содержание
        </p>
      ) : null}
      <ol className={mobile ? "grid gap-1 sm:grid-cols-2" : "space-y-1"}>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              className="group flex gap-2.5 rounded-lg px-2 py-2 text-[13px] leading-5 text-[#526071] transition hover:bg-[#eaf1ff] hover:text-[#1546ad] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2463eb]"
              href={`#${section.id}`}
            >
              <span className="w-5 shrink-0 font-bold tabular-nums text-[#94a0af] group-hover:text-[#2463eb]">
                {index + 1}
              </span>
              <span>{section.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 py-8 sm:py-10">
      <div className="mb-5 flex items-start gap-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eaf1ff] text-xs font-extrabold text-[#1546ad]">
          {number}
        </span>
        <h2 className="pt-1 font-heading text-xl font-extrabold tracking-[-.035em] sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-pretty text-[15px] leading-7 text-[#3f4c5d] sm:text-base">
        {children}
      </div>
    </section>
  );
}

function LegalFact({ term, description }: { term: string; description: string }) {
  return (
    <div>
      <dt className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#64717f]">
        {term}
      </dt>
      <dd className="mt-1 break-words font-semibold leading-5 text-[#101828]">{description}</dd>
    </div>
  );
}
