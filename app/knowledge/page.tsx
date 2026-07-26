import { BookOpen, ChevronRight, FileText, Link2, Plus, Search, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const sources = [
  { title: "Доставка и оплата", meta: "PDF · 24 страницы", updated: "сегодня" },
  { title: "Каталог услуг", meta: "Текст · 18 разделов", updated: "вчера" },
  { title: "Ответы на частые вопросы", meta: "Ссылка · 36 ответов", updated: "3 дня назад" },
];

export default function KnowledgePage() {
  return (
    <AppShell
      title="База знаний"
      description="Добавляйте материалы, на которых Автопилот строит ответы клиентам."
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="flex min-h-12 items-center gap-3 rounded-full bg-white px-5 shadow-[0_1px_2px_rgba(11,20,26,0.08)] focus-within:outline-2 focus-within:outline-[#00a884]">
            <Search aria-hidden="true" className="shrink-0 text-[#667781]" size={19} />
            <span className="sr-only">Поиск по базе знаний</span>
            <input className="min-w-0 flex-1 bg-transparent text-sm text-[#111b21] outline-none placeholder:text-[#8696a0]" placeholder="Найти документ или ответ" />
          </label>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00a884] px-5 text-sm font-semibold text-white transition hover:bg-[#008f72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008069]">
            <Plus aria-hidden="true" size={18} />
            Добавить источник
          </button>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_1px_2px_rgba(11,20,26,0.08)]">
            <div className="flex items-center justify-between border-b border-[#e9edef] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-[#111b21]">Документы</h2>
                <p className="mt-1 text-sm text-[#667781]">3 источника · 78 фрагментов</p>
              </div>
              <span className="rounded-full bg-[#e7fce8] px-3 py-1 text-xs font-semibold text-[#008069]">Готово</span>
            </div>
            <ul className="divide-y divide-[#e9edef]">
              {sources.map((source) => (
                <li key={source.title}>
                  <button className="flex min-h-20 w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#f7f8fa] focus-visible:outline-2 focus-visible:outline-[#00a884] sm:px-6">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-[#008069]">
                      <FileText aria-hidden="true" size={20} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[#111b21]">{source.title}</span>
                      <span className="mt-1 block text-xs text-[#667781]">{source.meta} · {source.updated}</span>
                    </span>
                    <ChevronRight aria-hidden="true" className="text-[#8696a0]" size={18} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#e9edef] p-4 text-center">
              <button className="rounded-full px-4 py-2 text-sm font-semibold text-[#008069] hover:bg-[#f0f2f5] focus-visible:outline-2 focus-visible:outline-[#00a884]">Все документы</button>
            </div>
          </section>

          <aside className="rounded-[26px] bg-[#d9fdd3] p-6 shadow-[0_1px_2px_rgba(11,20,26,0.08)]">
            <span className="flex size-11 items-center justify-center rounded-full bg-white/80 text-[#008069]">
              <Sparkles aria-hidden="true" size={20} />
            </span>
            <h2 className="mt-7 text-xl font-semibold text-[#111b21]">Проверить ответ</h2>
            <p className="mt-2 text-sm leading-6 text-[#3b4a54]">Задайте вопрос так, как его написал бы клиент.</p>
            <label className="mt-5 block">
              <span className="sr-only">Тестовый вопрос</span>
              <textarea className="min-h-28 w-full resize-none rounded-[18px] border-0 bg-white/90 p-4 text-sm text-[#111b21] outline-none placeholder:text-[#8696a0] focus:ring-2 focus:ring-[#00a884]" placeholder="Например: Когда приедет мой заказ?" />
            </label>
            <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#111b21] px-5 text-sm font-semibold text-white transition hover:bg-[#26343b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111b21]">Спросить Автопилот</button>
          </aside>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <button className="flex items-center gap-4 rounded-[22px] bg-white p-5 text-left shadow-[0_1px_2px_rgba(11,20,26,0.08)] transition hover:bg-[#f7f8fa] focus-visible:outline-2 focus-visible:outline-[#00a884]">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#f0f2f5] text-[#008069]"><BookOpen aria-hidden="true" size={19} /></span>
            <span><span className="block font-medium text-[#111b21]">Добавить текст</span><span className="mt-1 block text-sm text-[#667781]">Инструкция или готовый ответ</span></span>
          </button>
          <button className="flex items-center gap-4 rounded-[22px] bg-white p-5 text-left shadow-[0_1px_2px_rgba(11,20,26,0.08)] transition hover:bg-[#f7f8fa] focus-visible:outline-2 focus-visible:outline-[#00a884]">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#f0f2f5] text-[#008069]"><Link2 aria-hidden="true" size={19} /></span>
            <span><span className="block font-medium text-[#111b21]">Добавить ссылку</span><span className="mt-1 block text-sm text-[#667781]">Страница сайта или справка</span></span>
          </button>
        </section>
      </div>
    </AppShell>
  );
}
