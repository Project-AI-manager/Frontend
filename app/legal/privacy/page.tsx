import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { AuthBackground } from "@/components/ui/auth-background";
import { getSiteUrl, SITE_HOST_DISPLAY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Политика в отношении обработки персональных данных",
  description:
    "Порядок обработки и защиты персональных данных оператором сервиса «Автопилот».",
  alternates: { canonical: getSiteUrl("/legal/privacy") },
  openGraph: { url: getSiteUrl("/legal/privacy") },
};

const publicationDate = "7 августа 2026";
const operatorEmail = "timurzakirov@kpfu.ru";

const sections = [
  { id: "privacy-general", label: "Общие положения" },
  { id: "privacy-definitions", label: "Основные понятия" },
  { id: "privacy-data", label: "Какие данные обрабатываются" },
  { id: "privacy-purposes", label: "Цели обработки" },
  { id: "privacy-grounds", label: "Правовые основания" },
  { id: "privacy-conditions", label: "Порядок и условия" },
  { id: "privacy-retention", label: "Сроки хранения" },
  { id: "privacy-cookies", label: "Cookie и аналитика" },
  { id: "privacy-rights", label: "Права субъекта" },
  { id: "privacy-security", label: "Меры защиты" },
  { id: "privacy-changes", label: "Отзыв и изменения" },
  { id: "privacy-liability", label: "Ответственность" },
  { id: "privacy-details", label: "Реквизиты Оператора" },
];

export default function PrivacyPage() {
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
                <h1 className="mt-5 max-w-[760px] font-heading text-3xl font-extrabold leading-[1.08] tracking-[-.05em] sm:text-4xl lg:text-[46px]">
                  Политика в отношении обработки персональных данных
                </h1>
                <p className="mt-5 max-w-[740px] text-base leading-7 text-[#526071]">
                  Документ определяет, какие персональные данные обрабатывает ИП Закиров Т. А.,
                  для чего они используются, как защищаются и каким образом субъект может
                  реализовать свои права.
                </p>
              </div>

              <dl className="grid content-start gap-4 rounded-xl border border-[#e5eaf1] bg-[#f8fbff] p-5 text-sm">
                <LegalFact term="Оператор" description="ИП Закиров Т. А." />
                <LegalFact term="Дата публикации" description={publicationDate} />
                <LegalFact term="Версия" description="Действующая редакция" />
                <LegalFact term="Адрес документа" description={`https://${SITE_HOST_DISPLAY}/legal/privacy`} />
              </dl>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#e5eaf1] bg-[#f8fbff] px-6 py-4 text-sm text-[#526071] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
              <span>Основание: Федеральный закон от 27.07.2006 № 152-ФЗ</span>
              <a className="font-semibold text-[#1546ad] underline decoration-[#1546ad]/35 underline-offset-4 hover:text-[#2463eb]" href={`mailto:${operatorEmail}`}>
                Связаться с Оператором
              </a>
            </div>
          </header>

          <details className="group mb-6 overflow-hidden rounded-xl border border-[#b9cff5] bg-white shadow-[0_12px_30px_rgba(18,39,76,.08)] lg:hidden">
            <summary className="flex min-h-14 cursor-pointer list-none select-none items-center justify-between gap-3 bg-[#eaf1ff] px-4 py-3.5 text-sm font-extrabold text-[#1546ad] hover:bg-[#dfeaff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2463eb] [&::-webkit-details-marker]:hidden">
              <span>Содержание политики</span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2463eb] text-white shadow-[0_6px_14px_rgba(36,99,235,.22)]">
                <ChevronDown aria-hidden="true" size={19} strokeWidth={2.5} className="transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <nav aria-label="Разделы политики на мобильных устройствах" className="border-t border-[#d9e1ec] p-3">
              <ol className="grid gap-1 sm:grid-cols-2">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      className="flex gap-2.5 rounded-lg px-2 py-2 text-[13px] leading-5 text-[#526071] transition hover:bg-[#eaf1ff] hover:text-[#1546ad] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2463eb]"
                      href={`#${section.id}`}
                    >
                      <span className="w-5 shrink-0 font-bold tabular-nums text-[#94a0af]">
                        {index + 1}
                      </span>
                      <span>{section.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>

          <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden lg:sticky lg:top-28 lg:block">
              <nav aria-label="Разделы политики" className="rounded-xl border border-[#d9e1ec] bg-white p-4 shadow-[0_12px_30px_rgba(18,39,76,.06)]">
                <p className="px-2 pb-3 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">
                  Содержание
                </p>
                <ol className="space-y-1">
                  {sections.map((section, index) => (
                    <li key={section.id}>
                      <a className="group flex gap-2.5 rounded-lg px-2 py-2 text-[13px] leading-5 text-[#526071] transition hover:bg-[#eaf1ff] hover:text-[#1546ad] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2463eb]" href={`#${section.id}`}>
                        <span className="w-5 shrink-0 font-bold tabular-nums text-[#94a0af] group-hover:text-[#2463eb]">
                          {index + 1}
                        </span>
                        <span>{section.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>

            <article className="overflow-hidden rounded-xl border border-[#d9e1ec] bg-white shadow-[0_18px_42px_rgba(18,39,76,.09)]">
              <div className="space-y-0 divide-y divide-[#e5eaf1] px-6 sm:px-9 lg:px-12">
                <LegalSection id="privacy-general" number="01" title="Общие положения">
                  <p>
                    Настоящая Политика в отношении обработки персональных данных (далее —
                    Политика) разработана в соответствии с Федеральным законом от 27.07.2006
                    № 152-ФЗ «О персональных данных».
                  </p>
                  <p>
                    Политика определяет порядок обработки персональных данных и меры по
                    обеспечению их безопасности, которые принимает ИП Закиров Т. А. (далее —
                    Оператор) в отношении посетителей сайта и пользователей сервиса
                    «Автопилот».
                  </p>
                  <OperatorNotice />
                </LegalSection>

                <LegalSection id="privacy-definitions" number="02" title="Основные понятия">
                  <Definition term="Персональные данные">
                    любая информация, относящаяся к прямо или косвенно определённому
                    физическому лицу — субъекту персональных данных.
                  </Definition>
                  <Definition term="Обработка персональных данных">
                    любое действие или совокупность действий с персональными данными, включая
                    сбор, запись, систематизацию, накопление, хранение, уточнение, использование,
                    передачу, обезличивание, блокирование и удаление.
                  </Definition>
                  <Definition term="Субъект персональных данных">
                    посетитель сайта, пользователь сервиса или иное физическое лицо, чьи данные
                    были переданы Оператору на законном основании.
                  </Definition>
                </LegalSection>

                <LegalSection id="privacy-data" number="03" title="Какие данные и чьи мы обрабатываем">
                  <p>
                    Оператор обрабатывает данные, которые посетители и пользователи добровольно
                    указывают в формах сайта или передают при работе с сервисом.
                  </p>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    <DataItem>фамилия, имя и контактные данные;</DataItem>
                    <DataItem>номер телефона и адрес электронной почты;</DataItem>
                    <DataItem>сведения, указанные в обращениях и заявках;</DataItem>
                    <DataItem>иные данные, добровольно переданные Оператору.</DataItem>
                  </ul>
                  <p>
                    Также могут автоматически обрабатываться технические данные: IP-адрес,
                    файлы cookie, сведения о браузере и устройстве, журналы безопасности и данные
                    систем аналитики.
                  </p>
                </LegalSection>

                <LegalSection id="privacy-purposes" number="04" title="Цели обработки">
                  <ul className="list-disc space-y-2 pl-5 marker:text-[#2463eb]">
                    <li>обработка заявок и обращений;</li>
                    <li>обратная связь с клиентом;</li>
                    <li>выполнение договорных обязательств;</li>
                    <li>направление рассылок при наличии соответствующего согласия;</li>
                    <li>аналитика, безопасность и улучшение работы сайта и сервиса.</li>
                  </ul>
                </LegalSection>

                <LegalSection id="privacy-grounds" number="05" title="Правовые основания">
                  <p>
                    Правовыми основаниями являются Федеральный закон № 152-ФЗ, согласие
                    субъекта персональных данных, договор, стороной или выгодоприобретателем по
                    которому является субъект, а также иные основания, предусмотренные
                    законодательством Российской Федерации.
                  </p>
                </LegalSection>

                <LegalSection id="privacy-conditions" number="06" title="Порядок и условия обработки">
                  <p>
                    Обработка ведётся как с использованием средств автоматизации, так и без них.
                    Оператор не раскрывает и не распространяет персональные данные без законного
                    основания или согласия субъекта.
                  </p>
                  <p>
                    Данные могут быть предоставлены лицам, обеспечивающим работу сайта и сервиса,
                    в объёме, необходимом для исполнения договора и только при наличии
                    соответствующего правового основания. Трансграничная передача персональных
                    данных не осуществляется.
                  </p>
                </LegalSection>

                <LegalSection id="privacy-retention" number="07" title="Сроки обработки и хранения">
                  <p>
                    Персональные данные обрабатываются до достижения целей обработки, отзыва
                    согласия субъектом или истечения сроков, установленных законодательством.
                    После этого данные удаляются или обезличиваются, если их дальнейшее хранение
                    не требуется по закону.
                  </p>
                </LegalSection>

                <LegalSection id="privacy-cookies" number="08" title="Файлы cookie и аналитика">
                  <p>
                    Сайт может использовать файлы cookie и системы аналитики для корректной
                    работы, обеспечения безопасности, выполнения договоров и улучшения сервиса.
                    Настройки cookie можно изменить в браузере; ограничение cookie может повлиять
                    на работу отдельных функций сайта.
                  </p>
                </LegalSection>

                <LegalSection id="privacy-rights" number="09" title="Права субъекта персональных данных">
                  <p>Субъект вправе:</p>
                  <ul className="list-disc space-y-2 pl-5 marker:text-[#2463eb]">
                    <li>получать информацию об обработке своих персональных данных;</li>
                    <li>требовать уточнения, блокирования или удаления данных;</li>
                    <li>отозвать согласие на обработку персональных данных;</li>
                    <li>обжаловать действия Оператора в установленном законом порядке.</li>
                  </ul>
                  <p>
                    Запрос можно направить на адрес электронной почты{" "}
                    <a href={`mailto:${operatorEmail}`}>{operatorEmail}</a>. Оператор может
                    запросить сведения, необходимые для подтверждения личности заявителя.
                  </p>
                </LegalSection>

                <LegalSection id="privacy-security" number="10" title="Меры защиты">
                  <p>
                    Оператор принимает необходимые организационные и технические меры для защиты
                    персональных данных от неправомерного или случайного доступа, уничтожения,
                    изменения, блокирования, копирования, предоставления, распространения и иных
                    неправомерных действий.
                  </p>
                </LegalSection>

                <LegalSection id="privacy-changes" number="11" title="Отзыв согласия и изменение Политики">
                  <p>
                    Согласие на обработку персональных данных можно отозвать письмом на{" "}
                    <a href={`mailto:${operatorEmail}`}>{operatorEmail}</a>. Отзыв не влияет на
                    законность обработки, выполненной до его получения.
                  </p>
                  <p>
                    Оператор вправе изменять Политику. Новая редакция вступает в силу с момента
                    публикации на сайте, если в ней не указан иной срок.
                  </p>
                </LegalSection>

                <LegalSection id="privacy-liability" number="12" title="Ответственность сторон">
                  <p>
                    Ответственность Оператора и субъектов персональных данных определяется
                    законодательством Российской Федерации. Оператор не отвечает за последствия
                    обстоятельств непреодолимой силы и противоправных действий третьих лиц, если
                    принял требуемые законом меры защиты.
                  </p>
                </LegalSection>

                <LegalSection id="privacy-details" number="13" title="Реквизиты Оператора">
                  <dl className="grid gap-4 rounded-xl border border-[#d9e1ec] bg-[#f8fbff] p-5 sm:grid-cols-2">
                    <LegalFact term="Оператор" description="ИП Закиров Т. А." />
                    <LegalFact term="Электронная почта" description={operatorEmail} href={`mailto:${operatorEmail}`} />
                    <LegalFact term="ИНН" description="Будет указан после регистрации ИП" />
                    <LegalFact term="ОГРНИП" description="Будет указан после регистрации ИП" />
                    <LegalFact term="Адрес" description="Будет указан после регистрации ИП" />
                    <LegalFact term="Дата публикации" description={publicationDate} />
                  </dl>
                  <p className="text-sm text-[#64717f]">
                    Действующая редакция постоянно доступна по адресу{" "}
                    <a href={getSiteUrl("/legal/privacy")}>{getSiteUrl("/legal/privacy")}</a>.
                  </p>
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
      <div className="space-y-4 text-pretty text-[15px] leading-7 text-[#3f4c5d] sm:text-base [&_a]:font-semibold [&_a]:text-[#1546ad] [&_a]:underline [&_a]:decoration-[#1546ad]/35 [&_a]:underline-offset-4 [&_a:hover]:text-[#2463eb]">
        {children}
      </div>
    </section>
  );
}

function OperatorNotice() {
  return (
    <div className="rounded-xl border border-[#cddfff] bg-[#f8fbff] p-5">
      <p className="text-xs font-extrabold uppercase tracking-[.11em] text-[#1546ad]">
        Важно о реквизитах
      </p>
      <p className="mt-2">
        В присланном документе ИНН, ОГРНИП и адрес были оставлены как незаполненные
        поля. На странице они честно помечены как данные, которые будут указаны после
        регистрации ИП, чтобы вместо реальных реквизитов не публиковались шаблонные
        значения.
      </p>
    </div>
  );
}

function Definition({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <p>
      <strong className="font-bold text-[#101828]">{term}</strong> — {children}
    </p>
  );
}

function DataItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-lg border border-[#e5eaf1] bg-[#f8fbff] p-4">
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#2463eb]" />
      <span>{children}</span>
    </li>
  );
}

function LegalFact({
  term,
  description,
  href,
}: {
  term: string;
  description: string;
  href?: string;
}) {
  return (
    <div>
      <dt className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#64717f]">
        {term}
      </dt>
      <dd className="mt-1 break-words font-semibold leading-5 text-[#101828]">
        {href ? <a href={href}>{description}</a> : description}
      </dd>
    </div>
  );
}
