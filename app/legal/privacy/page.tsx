import {
  CalendarCheck,
  ChevronDown,
  ListTree,
  ShieldCheck,
} from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

/** Дата последней правки документа. Обновляется вместе с текстом политики. */
const LAST_UPDATED = "26 июля 2026";

type DocumentSection = {
  id: string;
  title: string;
};

/** Разделы документа: один источник и для оглавления, и для якорей в тексте. */
const SECTIONS: DocumentSection[] = [
  { id: "status", title: "Статус документа" },
  { id: "development-data", title: "Данные на этапе разработки" },
  { id: "channels", title: "Внешние каналы и интеграции" },
];

/** Список ссылок оглавления. Одинаков для мобильной шторки и боковой колонки. */
function OutlineLinks() {
  return (
    <ol className="space-y-1">
      {SECTIONS.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="group/link flex items-start gap-3 rounded-md px-3 py-2 transition duration-200 hover:translate-x-1 hover:bg-white"
          >
            <span className="micro-label mt-[3px] w-3 shrink-0 text-right">
              {index + 1}
            </span>
            {/* Цвет держим на span: глобальное правило a { color: inherit }
                перебивает утилиты цвета, навешенные прямо на ссылку. */}
            <span className="text-sm leading-6 font-semibold text-muted transition-colors duration-200 group-hover/link:text-brand">
              {section.title}
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="grid-backdrop pt-24 pb-20 lg:pt-28 lg:pb-24">
        <div className="mx-auto w-full max-w-5xl px-5 lg:px-8">
          <header>
            <span className="icon-badge" aria-hidden="true">
              <ShieldCheck size={22} />
            </span>

            <p className="section-kicker mt-5">Документы</p>

            <h1 className="mt-3 text-3xl leading-[1.08] font-extrabold tracking-[-0.04em] text-balance text-ink sm:text-4xl lg:text-5xl">
              Политика конфиденциальности
            </h1>

            <p className="mt-5">
              <span className="chip chip-grey">
                <CalendarCheck size={13} aria-hidden="true" />
                Обновлено {LAST_UPDATED}
              </span>
            </p>
          </header>

          <div className="divider mt-7" />

          <div className="mt-7 grid items-start gap-5 lg:grid-cols-[0.28fr_0.72fr] lg:gap-6">
            <details className="soft-panel group p-2 lg:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-md px-3 text-sm font-bold text-ink-soft [&::-webkit-details-marker]:hidden">
                <ListTree size={16} className="text-brand" aria-hidden="true" />
                Разделы документа
                <span
                  aria-hidden="true"
                  className="ml-auto inline-flex text-faint transition-transform duration-200 group-open:rotate-180"
                >
                  <ChevronDown size={16} />
                </span>
              </summary>
              <nav aria-label="Разделы документа" className="mt-2">
                <OutlineLinks />
              </nav>
            </details>

            <nav
              aria-label="Разделы документа, боковое оглавление"
              className="soft-panel hidden p-3 lg:sticky lg:top-28 lg:block"
            >
              <p className="micro-label px-3 pt-1 pb-2">Разделы</p>
              <OutlineLinks />
            </nav>

            <article className="panel p-7 lg:p-10">
              <div className="space-y-8">
                <section id="status" className="scroll-mt-28">
                  <h2 className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink sm:text-2xl">
                    Статус документа
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-ink-soft">
                    Это черновая страница для MVP. Здесь будет описание того,
                    какие данные пользователей, компаний, клиентов и сообщений
                    хранит сервис, как используются токены авторизации и какие
                    права есть у владельца аккаунта.
                  </p>
                </section>

                <section
                  id="development-data"
                  className="scroll-mt-28 border-t border-line-soft pt-8"
                >
                  <h2 className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink sm:text-2xl">
                    Данные на этапе разработки
                  </h2>
                  <p className="mt-4 leading-7 text-muted">
                    На этапе разработки сервис использует тестовые данные, mock
                    AI-провайдера и локальные окружения. Production-политика
                    будет оформлена перед публичным запуском.
                  </p>
                </section>

                <section
                  id="channels"
                  className="scroll-mt-28 border-t border-line-soft pt-8"
                >
                  <h2 className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink sm:text-2xl">
                    Внешние каналы и интеграции
                  </h2>
                  <p className="mt-4 leading-7 text-muted">
                    Для интеграций с Telegram и другими каналами потребуется
                    отдельное описание обработки внешних идентификаторов и
                    сообщений клиентов.
                  </p>
                </section>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
