import { ChevronDown } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

/** Дата последней правки документа. Обновляется вместе с текстом условий. */
const LAST_UPDATED = "26 июля 2026";

type DocumentSection = {
  id: string;
  title: string;
};

/** Разделы документа: один источник и для оглавления, и для якорей в тексте. */
const SECTIONS: DocumentSection[] = [
  { id: "status", title: "Статус документа" },
  { id: "ai-drafts", title: "AI-ответы и проверка" },
  { id: "auto-send", title: "Автоматическая отправка" },
];

/** Список ссылок оглавления. Одинаков для мобильной шторки и боковой колонки. */
function OutlineLinks() {
  return (
    <ol className="space-y-1">
      {SECTIONS.map((section, index) => (
        <li key={section.id}>
          <a href={`#${section.id}`} className="wf-nav-item">
            <span className="wf-muted w-4 shrink-0 text-right text-xs tabular-nums">
              {index + 1}
            </span>
            {section.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-5xl">
          <header>
            <p className="wf-kicker">Документы</p>

            <h1 className="wf-title mt-3 text-2xl text-balance">
              Условия использования
            </h1>

            <p className="wf-muted mt-2 text-sm">Обновлено {LAST_UPDATED}</p>
          </header>

          <div className="wf-divider my-6" />

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)]">
            <details className="wf-box group p-2 lg:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                Разделы документа
                <span
                  aria-hidden="true"
                  className="wf-muted ml-auto inline-flex group-open:rotate-180"
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
              className="wf-box hidden p-3 lg:sticky lg:top-6 lg:block"
            >
              <p className="wf-kicker px-3 pt-1 pb-2">Разделы</p>
              <OutlineLinks />
            </nav>

            <article className="space-y-8">
              <section id="status" className="scroll-mt-6">
                <h2 className="text-lg font-semibold">Статус документа</h2>
                <p className="mt-3 leading-7">
                  Это MVP-заготовка условий. Здесь будут правила использования
                  кабинета, AI-черновиков, базы знаний, каналов связи и
                  ограничений тарифа.
                </p>
              </section>

              <section
                id="ai-drafts"
                className="scroll-mt-6 border-t border-line pt-8"
              >
                <h2 className="text-lg font-semibold">AI-ответы и проверка</h2>
                <p className="mt-3 leading-7">
                  AI-ответы на текущем этапе считаются подсказками для менеджера.
                  Пользователь отвечает за проверку фактов, источников и
                  финального текста перед отправкой клиенту.
                </p>
              </section>

              <section
                id="auto-send"
                className="scroll-mt-6 border-t border-line pt-8"
              >
                <h2 className="text-lg font-semibold">
                  Автоматическая отправка
                </h2>
                <p className="mt-3 leading-7">
                  Автоматическая отправка ответов должна включаться только после
                  настройки порога уверенности, базы знаний и правил эскалации.
                </p>
              </section>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
