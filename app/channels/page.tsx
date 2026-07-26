import {
  Check,
  ChevronRight,
  MessageCircleMore,
  Plus,
  Radio,
  Smartphone,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const upcomingChannels = [
  { name: "VK Мессенджер", note: "Скоро", accent: "bg-[#2688eb]" },
  { name: "Avito", note: "В разработке", accent: "bg-[#965eeb]" },
  { name: "Чат на сайте", note: "Скоро", accent: "bg-[#ffb020]" },
];

export default function ChannelsPage() {
  return (
    <AppShell
      title="Каналы"
      description="Подключайте источники сообщений и управляйте ими в одном месте."
    >
      <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_1px_2px_rgba(11,20,26,0.08)]">
          <div className="flex items-center justify-between border-b border-[#e9edef] px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667781]">
                Активный канал
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[#111b21]">Telegram</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e7fce8] px-3 py-1.5 text-xs font-semibold text-[#008069]">
              <span className="size-2 rounded-full bg-[#25d366]" />
              Подключён
            </span>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-4 rounded-[20px] bg-[#f0f2f5] p-4">
              <div className="flex size-13 shrink-0 items-center justify-center rounded-full bg-[#008069] text-white">
                <Smartphone aria-hidden="true" size={23} strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#111b21]">Личный аккаунт</p>
                <p className="mt-0.5 text-sm text-[#667781]">
                  Сообщения синхронизируются автоматически
                </p>
              </div>
              <Check aria-label="Канал подключён" className="text-[#00a884]" size={21} />
            </div>

            <dl className="mt-3 divide-y divide-[#e9edef] px-1">
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-[#667781]">Режим подключения</dt>
                <dd className="text-right text-sm font-medium text-[#111b21]">
                  Личный аккаунт · MTProto
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-[#667781]">Последняя синхронизация</dt>
                <dd className="text-right text-sm font-medium text-[#111b21]">только что</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-[#667781]">Автопилот</dt>
                <dd className="text-right text-sm font-medium text-[#008069]">Включён</dd>
              </div>
            </dl>

            <button className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-[#d8dee1] px-5 text-sm font-semibold text-[#111b21] transition hover:bg-[#f0f2f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a884]">
              Настроить канал
            </button>
          </div>
        </section>

        <aside className="rounded-[26px] bg-[#d9fdd3] p-6 shadow-[0_1px_2px_rgba(11,20,26,0.08)]">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/80 text-[#008069]">
            <Radio aria-hidden="true" size={22} />
          </div>
          <h2 className="mt-7 text-xl font-semibold text-[#111b21]">Все обращения — в одном окне</h2>
          <p className="mt-2 text-sm leading-6 text-[#3b4a54]">
            Автопилот объединяет историю диалогов и применяет одну базу знаний во всех каналах.
          </p>
        </aside>

        <section className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(11,20,26,0.08)] sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#111b21]">Другие каналы</h2>
              <p className="mt-1 text-sm text-[#667781]">Подключайте их по мере необходимости.</p>
            </div>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#00a884] px-5 text-sm font-semibold text-white transition hover:bg-[#008f72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a884]">
              <Plus aria-hidden="true" size={18} />
              Добавить канал
            </button>
          </div>
          <ul className="mt-5 grid gap-2 md:grid-cols-3">
            {upcomingChannels.map((channel) => (
              <li key={channel.name}>
                <button className="flex w-full items-center gap-3 rounded-[18px] bg-[#f7f8fa] p-4 text-left transition hover:bg-[#f0f2f5] focus-visible:outline-2 focus-visible:outline-[#00a884]">
                  <span className={`flex size-10 items-center justify-center rounded-full text-white ${channel.accent}`}>
                    <MessageCircleMore aria-hidden="true" size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[#111b21]">{channel.name}</span>
                    <span className="mt-0.5 block text-xs text-[#667781]">{channel.note}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="text-[#8696a0]" size={18} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
