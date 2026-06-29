import { Bot, Building2, CreditCard, SlidersHorizontal, UsersRound } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const settingsBlocks = [
  {
    icon: Bot,
    title: "Поведение AI",
    text: "System prompt, тон общения, правила продаж и запрет на выдуманные условия.",
  },
  {
    icon: SlidersHorizontal,
    title: "Автоответы",
    text: "Порог уверенности, ручная проверка и режим безопасного запуска.",
  },
  {
    icon: UsersRound,
    title: "Команда",
    text: "Владелец, менеджеры, роли и доступ к рабочему кабинету.",
  },
  {
    icon: CreditCard,
    title: "Тариф и лимиты",
    text: "Доступные каналы, лимит диалогов и использование за текущий месяц.",
  },
];

export default function SettingsPage() {
  return (
    <AppShell
      title="Настройки"
      description="Управление компанией, AI-поведением, лимитами и командой."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4 md:grid-cols-2">
          {settingsBlocks.map((block) => (
            <article key={block.title} className="glass-card rounded-[1.75rem] p-6">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                <block.icon size={22} />
              </span>
              <h2 className="mt-5 text-xl font-black">{block.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{block.text}</p>
              <button className="mt-5 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold">
                Открыть
              </button>
            </article>
          ))}
        </section>

        <aside className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-black text-white">
                <Building2 size={22} />
              </span>
              <div>
                <h2 className="font-black">ООО Север</h2>
                <p className="text-sm text-neutral-500">demo-sever</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              {[
                ["Провайдер LLM", "mock"],
                ["Порог уверенности", "80%"],
                ["Автоответы", "выключены"],
                ["Embedding", "multilingual-e5"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-black/5 pb-3 last:border-0">
                  <span className="text-neutral-500">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-black p-6 text-white">
            <h2 className="text-xl font-black">Безопасный старт</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Пока AI не подключён к реальному провайдеру, интерфейс показывает mock-режим и
              оставляет контроль ответа за менеджером.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
