import { ArrowDownRight, ArrowUpRight, Clock3, MessageCircle, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const metrics = [
  { label: "Диалогов", value: "248", change: "+18%", trend: "up" },
  { label: "Ответил AI", value: "82%", change: "+7%", trend: "up" },
  { label: "Передано команде", value: "45", change: "−12%", trend: "down" },
];

const activity = [36, 52, 43, 72, 61, 84, 67];

export default function AnalyticsPage() {
  return (
    <AppShell
      title="Аналитика"
      description="Главное о диалогах, автоматизации и качестве ответов."
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <section aria-label="Ключевые показатели" className="grid gap-3 md:grid-cols-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(11,20,26,0.08)]">
              <p className="text-sm text-[#667781]">{metric.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <strong className="text-3xl font-medium tracking-tight text-[#111b21]">{metric.value}</strong>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e7fce8] px-2.5 py-1 text-xs font-semibold text-[#008069]">
                  {metric.trend === "up" ? <ArrowUpRight aria-hidden="true" size={13} /> : <ArrowDownRight aria-hidden="true" size={13} />}
                  {metric.change}
                </span>
              </div>
            </article>
          ))}
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.5fr)]">
          <section className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(11,20,26,0.08)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#111b21]">Обращения за неделю</h2>
                <p className="mt-1 text-sm text-[#667781]">Входящие сообщения по всем каналам</p>
              </div>
              <button className="rounded-full bg-[#f0f2f5] px-4 py-2 text-sm font-medium text-[#3b4a54] focus-visible:outline-2 focus-visible:outline-[#00a884]">
                7 дней
              </button>
            </div>
            <div className="mt-8 flex h-56 items-end gap-3 rounded-[18px] bg-[#f7f8fa] px-4 pb-4 pt-8 sm:gap-5 sm:px-6">
              {activity.map((height, index) => (
                <div key={index} className="flex h-full flex-1 flex-col justify-end gap-2">
                  <div className="w-full rounded-t-[10px] bg-[#00a884] transition-opacity hover:opacity-80" style={{ height: `${height}%` }} />
                  <span className="text-center text-xs text-[#667781]">{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][index]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] bg-[#111b21] p-6 text-white shadow-[0_1px_2px_rgba(11,20,26,0.12)]">
            <div className="flex size-11 items-center justify-center rounded-full bg-[#00a884]">
              <Clock3 aria-hidden="true" size={20} />
            </div>
            <p className="mt-8 text-sm text-white/60">Среднее время ответа</p>
            <p className="mt-2 text-4xl font-medium tracking-tight">18 сек</p>
            <p className="mt-4 text-sm leading-6 text-white/70">На 12 секунд быстрее, чем на прошлой неделе.</p>
          </section>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-4 rounded-[22px] bg-[#d9fdd3] p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#008069]">
              <Sparkles aria-hidden="true" size={19} />
            </span>
            <div>
              <h2 className="font-semibold text-[#111b21]">Качество ответов</h2>
              <p className="mt-1 text-sm leading-6 text-[#3b4a54]">94% диалогов завершились без повторного вопроса.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(11,20,26,0.08)]">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-[#008069]">
              <MessageCircle aria-hidden="true" size={19} />
            </span>
            <div>
              <h2 className="font-semibold text-[#111b21]">Частая тема</h2>
              <p className="mt-1 text-sm leading-6 text-[#667781]">Условия доставки — 32 обращения за неделю.</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
