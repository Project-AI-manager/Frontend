import { Card, PageShell, StatusBadge } from "@/components/navigation";
import { conversations } from "@/lib/demo-data";

const selected = conversations[0];

export default function InboxPage() {
  return (
    <PageShell
      active="/inbox"
      title="Диалоги"
      subtitle="Единое окно: лента обращений, тред, AI-черновик и источник ответа на одном экране."
    >
      <div className="grid gap-4 lg:grid-cols-[320px_1fr_320px]">
        <Card className="p-0">
          <div className="border-b border-border p-4">
            <input className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" placeholder="Поиск по диалогам" />
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              {["Все", "Авто", "Нужен менеджер", "Мои"].map((filter) => (
                <button key={filter} className="rounded-full bg-bg px-3 py-1 text-ink/65 first:bg-brand first:text-white">
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {conversations.map((conversation) => (
              <article key={conversation.id} className="cursor-pointer p-4 hover:bg-bg">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-bold">{conversation.customer}</p>
                  <span className="text-xs text-ink/45">{conversation.time}</span>
                </div>
                <p className="text-xs font-bold text-brand">{conversation.channel}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink/60">{conversation.preview}</p>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={conversation.status} />
                  {conversation.unread > 0 && <span className="rounded-full bg-brand px-2 py-1 text-xs font-bold text-white">{conversation.unread}</span>}
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card className="flex min-h-[620px] flex-col p-0">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-display text-2xl font-black">{selected.customer}</h2>
              <p className="text-sm text-ink/55">{selected.channel}</p>
            </div>
            <StatusBadge status={selected.status} />
          </div>
          <div className="flex-1 space-y-4 p-5">
            <div className="max-w-[78%] rounded-2xl bg-bg p-4">
              <p>{selected.messages[0]}</p>
            </div>
            <div className="ml-auto max-w-[78%] rounded-2xl bg-brand p-4 text-white">
              <div className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                Уверенность {selected.confidence}%
              </div>
              <p>{selected.messages[1]}</p>
            </div>
          </div>
          <div className="border-t border-border p-5">
            <textarea
              className="min-h-28 w-full rounded-lg border border-border bg-bg px-4 py-3"
              defaultValue="Да, в наличии 2 шт: чёрный и синий. Цена 79 990 ₽, доставка по Казани сегодня."
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button className="rounded-lg bg-brand px-4 py-2 font-bold text-white">Отправить</button>
              <button className="rounded-lg border border-border px-4 py-2 font-bold">Передать менеджеру</button>
              <button className="rounded-lg border border-border px-4 py-2 font-bold">Закрыть</button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-xl font-black">Контекст клиента</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-ink/50">Первое обращение</dt>
              <dd className="font-bold">2026-06-14</dd>
            </div>
            <div>
              <dt className="text-ink/50">Канал</dt>
              <dd className="font-bold">Avito</dd>
            </div>
          </dl>
          <div className="mt-8 rounded-2xl bg-bg p-4">
            <p className="text-sm font-black text-brand">Источник ответа</p>
            <blockquote className="mt-3 text-sm leading-6 text-ink/65">
              «iPhone 15 128ГБ: чёрный — 1 шт, синий — 1 шт. Цена 79 990 ₽. Доставка по Казани в день заказа».
            </blockquote>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
