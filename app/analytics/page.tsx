import { ArrowUpRight, BarChart3, MessageCircle, Timer, Zap } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const metrics = [
  { label: "Диалогов", value: "128", delta: "+18%", icon: MessageCircle },
  { label: "AI-ответов", value: "64", delta: "+31%", icon: Zap },
  { label: "Среднее время", value: "3м 12с", delta: "-22%", icon: Timer },
  { label: "Эскалаций", value: "12", delta: "-8%", icon: BarChart3 },
];

const bars = [42, 68, 54, 86, 72, 96, 64];

export default function AnalyticsPage() {
  return (
    <AppShell
      title="Аналитика"
      description="Метрики качества, скорости ответа и роста базы знаний для контроля MVP."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="glass-card rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                <metric.icon size={20} />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                {metric.delta}
                <ArrowUpRight size={13} />
              </span>
            </div>
            <p className="mt-5 text-sm text-neutral-500">{metric.label}</p>
            <p className="mt-1 text-3xl font-black">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="glass-card rounded-[1.75rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Активность за неделю</h2>
              <p className="mt-1 text-sm text-neutral-500">Демо-график для будущих данных backend.</p>
            </div>
            <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">7 дней</span>
          </div>

          <div className="mt-8 flex h-72 items-end gap-3 rounded-[1.5rem] bg-white p-5">
            {bars.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div
                  className="w-full rounded-t-3xl bg-gradient-to-t from-orange-500 to-orange-300"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs font-bold text-neutral-400">{index + 1}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="glass-card rounded-[1.75rem] p-6">
          <h2 className="text-xl font-black">Топ тем эскалаций</h2>
          <div className="mt-5 space-y-4">
            {[
              ["CRM-интеграция", 42],
              ["VIP-правила", 28],
              ["Юридические условия", 18],
              ["Нет источника", 12],
            ].map(([topic, value]) => (
              <div key={topic as string}>
                <div className="flex justify-between text-sm font-bold">
                  <span>{topic as string}</span>
                  <span>{value as number}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-black" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
