import { Card, PageShell, StatusBadge } from "@/components/navigation";
import { candidates, documents } from "@/lib/demo-data";

export default function KnowledgePage() {
  return (
    <PageShell
      active="/knowledge"
      title="База знаний"
      subtitle="Документы, очередь автообучения и playground RAG собраны на одной странице, без лишних маршрутов."
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-black">Документы</h2>
            <button className="rounded-lg bg-brand px-4 py-2 font-bold text-white">Загрузить</button>
          </div>
          <div className="divide-y divide-border">
            {documents.map((document) => (
              <div key={document.title} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="font-bold">{document.title}</p>
                  <p className="text-sm text-ink/55">{document.type} · {document.chunks} чанков · {document.updated}</p>
                </div>
                <StatusBadge status={document.status} />
                <button className="rounded-lg border border-border px-3 py-2 text-sm font-bold">Открыть</button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-black">Проверить ответ</h2>
          <textarea className="mt-5 min-h-24 w-full rounded-lg border border-border bg-bg px-4 py-3" defaultValue="Можно ли доставить сегодня по Казани?" />
          <div className="mt-4 rounded-2xl bg-bg p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-bold text-brand">Ответ RAG</p>
              <span className="rounded-full bg-status-auto-bg px-3 py-1 text-xs font-bold text-status-auto-fg">91%</span>
            </div>
            <p className="text-sm leading-6 text-ink/70">
              Да, доставка по Казани доступна сегодня при оформлении заказа до 17:00. Источник: «Условия доставки».
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-display text-2xl font-black">Кандидаты автообучения</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {candidates.map((candidate) => (
              <article key={candidate.question} className="rounded-2xl bg-bg p-4">
                <p className="text-sm font-bold text-brand">Вопрос клиента</p>
                <p className="mt-1 font-bold">{candidate.question}</p>
                <p className="mt-4 text-sm font-bold text-ink/50">Ответ менеджера</p>
                <p className="mt-1 text-sm leading-6 text-ink/70">{candidate.answer}</p>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white">Добавить</button>
                  <button className="rounded-lg border border-border px-3 py-2 text-sm font-bold">Отклонить</button>
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
