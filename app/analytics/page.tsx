import { Card, PageShell } from "@/components/navigation";
import { metrics } from "@/lib/demo-data";

const topics = [
  ["Рассрочка", "34%"],
  ["Возврат", "22%"],
  ["Индивидуальная цена", "18%"],
  ["Нет контекста в БЗ", "14%"],
];

export default function AnalyticsPage() {
  return (
    <PageShell
      active="/analytics"
      title="Аналитика"
      subtitle="Первые метрики MVP: скорость ответа, доля автоматизации, лимит диалогов и причины эскалации."
    >
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm font-bold text-ink/50">{metric.label}</p>
            <p className="mt-3 font-display text-3xl font-black">{metric.value}</p>
            <p className="mt-2 text-sm text-brand">{metric.hint}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="font-display text-2xl font-black">Диалоги по дням</h2>
          <div className="mt-8 flex h-64 items-end gap-3">
            {[38, 52, 44, 68, 73, 59, 81, 96, 74, 88, 102, 93].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-brand" style={{ height: `${height}%` }} />
                <span className="text-xs text-ink/40">{index + 1}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-black">Топ эскалаций</h2>
          <div className="mt-6 space-y-4">
            {topics.map(([topic, percent]) => (
              <div key={topic}>
                <div className="mb-2 flex justify-between text-sm font-bold">
                  <span>{topic}</span>
                  <span className="text-brand">{percent}</span>
                </div>
                <div className="h-2 rounded-full bg-bg">
                  <div className="h-full rounded-full bg-brand" style={{ width: percent }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
