import { AlertCircle, CheckCircle2, Copy, Send, Smartphone } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const syncItems = [
  ["Статус", "Демо-подключение", "ok"],
  ["Последняя синхронизация", "ещё не запускалась", "warn"],
  ["Входящие сообщения", "0 новых событий", "ok"],
];

export default function ChannelsPage() {
  return (
    <AppShell
      title="Каналы"
      description="В MVP подключаем только Telegram. Max, Avito и другие каналы оставляем на следующие этапы."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="glass-card rounded-[1.75rem] p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
                Первый канал
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Telegram</h2>
              <p className="mt-2 max-w-2xl text-neutral-600">
                Подключение через токен бота. После подключения backend сможет принимать события
                и синхронизировать чаты в inbox.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={16} />
              В плане MVP
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {syncItems.map(([label, value, type]) => (
              <div key={label} className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                {type === "ok" ? (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={20} className="text-orange-500" />
                )}
                <p className="mt-4 text-sm text-neutral-500">{label}</p>
                <p className="mt-1 font-black">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] bg-[#17130f] p-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-black">
                <Send size={19} />
              </span>
              <div>
                <h3 className="font-black">Подключение Telegram-бота</h3>
                <p className="text-sm text-white/55">UI-заготовка для следующей backend-задачи</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/35"
                placeholder="123456:ABC-telegram-bot-token"
              />
              <button className="rounded-2xl bg-orange-400 px-5 py-3 text-sm font-black text-black">
                Сохранить
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Smartphone size={20} />
              </span>
              <div>
                <h2 className="font-black">Что будет дальше</h2>
                <p className="text-sm text-neutral-500">Синхронизация чатов</p>
              </div>
            </div>

            <ol className="mt-5 space-y-3 text-sm">
              {["Сохранить токен Telegram", "Получить список чатов", "Создать клиентов и диалоги", "Отображать сообщения в inbox"].map(
                (item, index) => (
                  <li key={item} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ),
              )}
            </ol>
          </div>

          <div className="glass-card rounded-[1.75rem] p-5">
            <h2 className="font-black">Webhook URL</h2>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-3 text-sm text-neutral-500">
              <code className="min-w-0 flex-1 truncate">/api/v1/channels/webhook/telegram</code>
              <Copy size={16} />
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
