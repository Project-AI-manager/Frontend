import { BrainCircuit, FileText, Plus, Search, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const documents = [
  ["FAQ: доставка и оплата", "manual", "ready", "2 чанка"],
  ["Скрипт квалификации лида", "manual", "ready", "1 чанк"],
  ["Telegram onboarding", "md", "processing", "индексация"],
];

const candidates = [
  "Можно ли настроить отдельные правила для VIP-клиентов?",
  "Как быстро подключается Telegram?",
  "Можно ли проверить ответы до автоответа?",
];

export default function KnowledgePage() {
  return (
    <AppShell
      title="База знаний"
      description="Документы, источники ответов и очередь кандидатов для обучения ассистента."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-black">Документы</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Ручные материалы уже сохраняются в БД и режутся на чанки.
                </p>
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white">
                <Plus size={16} />
                Добавить документ
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-black/10 bg-white">
              {documents.map(([title, type, status, chunks]) => (
                <div key={title} className="grid gap-3 border-b border-black/5 p-4 last:border-0 md:grid-cols-[1fr_120px_120px_120px] md:items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                      <FileText size={18} />
                    </span>
                    <div>
                      <p className="font-black">{title}</p>
                      <p className="text-sm text-neutral-500">Обновлено сегодня</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-500">{type}</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-center text-xs font-bold text-emerald-700">
                    {status}
                  </span>
                  <span className="text-sm font-semibold text-neutral-500">{chunks}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-black text-white">
                <Search size={18} />
              </span>
              <div>
                <h2 className="text-xl font-black">Проверить ответ</h2>
                <p className="text-sm text-neutral-500">Playground для вопроса клиента и источников.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl border border-black/10 bg-white p-4">
                <p className="text-sm font-bold text-neutral-500">Вопрос клиента</p>
                <p className="mt-3 text-lg font-black">Сколько занимает подключение Telegram?</p>
              </div>
              <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-orange-700">
                  <Sparkles size={16} />
                  Ответ AI
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-700">
                  В демо-режиме подключение занимает около 15 минут после выдачи токена.
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="glass-card rounded-[1.75rem] p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <BrainCircuit size={20} />
            </span>
            <div>
              <h2 className="font-black">Кандидаты</h2>
              <p className="text-sm text-neutral-500">Очередь автообучения</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {candidates.map((candidate) => (
              <div key={candidate} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold leading-6">{candidate}</p>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white">
                    Принять
                  </button>
                  <button className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold">
                    Позже
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
