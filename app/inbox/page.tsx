import { Bot, CheckCircle2, Clock, Send, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

const conversations = [
  {
    name: "Алина Петрова",
    message: "Можно подключить Telegram и проверить ответы до запуска?",
    status: "Открыт",
    time: "8 мин",
    tone: "bg-orange-100 text-orange-700",
  },
  {
    name: "Павел Смирнов",
    message: "Сколько стоит демо и есть ли ограничение по диалогам?",
    status: "AI ответил",
    time: "1 час",
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Мария Волкова",
    message: "Нужны правила для VIP-клиентов и CRM.",
    status: "Эскалация",
    time: "3 часа",
    tone: "bg-indigo-100 text-indigo-700",
  },
];

const messages = [
  ["customer", "Здравствуйте! Можно подключить Telegram и проверить ответы до запуска?"],
  ["manager", "Да, мы подключим тестовый Telegram-аккаунт и загрузим базу знаний."],
  ["customer", "А сколько времени занимает настройка?"],
];

export default function InboxPage() {
  return (
    <AppShell
      title="Диалоги"
      description="Единая лента обращений, AI-черновик и контекст клиента в одном рабочем окне."
    >
      <div className="grid gap-5 xl:grid-cols-[360px_1fr_320px]">
        <section className="glass-card rounded-[1.75rem] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Входящие</h2>
            <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">3 новых</span>
          </div>

          <div className="mt-5 space-y-3">
            {conversations.map((conversation) => (
              <article key={conversation.name} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{conversation.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-600">
                      {conversation.message}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400">{conversation.time}</span>
                </div>
                <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${conversation.tone}`}>
                  {conversation.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card overflow-hidden rounded-[1.75rem]">
          <div className="border-b border-black/10 bg-white/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Алина Петрова</h2>
                <p className="mt-1 text-sm text-neutral-500">Telegram · tg-1001 · новый лид</p>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                Требует ответа
              </span>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {messages.map(([role, text]) => (
              <div key={text} className={role === "manager" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    role === "manager"
                      ? "max-w-[78%] rounded-[1.5rem] bg-black px-5 py-3 text-sm leading-6 text-white"
                      : "max-w-[78%] rounded-[1.5rem] bg-white px-5 py-3 text-sm leading-6 shadow-sm"
                  }
                >
                  {text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-black/10 bg-white/70 p-5">
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-orange-700">
                <Sparkles size={16} />
                AI-черновик
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-700">
                Подключение Telegram в демо-режиме занимает около 15 минут после выдачи токена.
                Можно проверить ответы до включения автоответов.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
                  <Send size={15} />
                  Отправить
                </button>
                <button className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold">
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-5">
            <h2 className="font-black">Контекст клиента</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Источник", "Telegram"],
                ["Статус", "Новый лид"],
                ["Интерес", "Подключение канала"],
                ["Ответственный", "Анна Менеджер"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-black/5 pb-3 last:border-0">
                  <span className="text-neutral-500">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[1.75rem] p-5">
            <h2 className="font-black">Сигналы AI</h2>
            <div className="mt-4 space-y-3">
              <Signal icon={<CheckCircle2 size={16} />} title="2 источника найдены" />
              <Signal icon={<Bot size={16} />} title="Уверенность 91%" />
              <Signal icon={<Clock size={16} />} title="SLA ответа: 4 минуты" />
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Signal({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-semibold shadow-sm">
      <span className="text-orange-500">{icon}</span>
      {title}
    </div>
  );
}
