import { Card, PageShell, StatusBadge } from "@/components/navigation";
import { channels } from "@/lib/demo-data";

export default function ChannelsPage() {
  return (
    <PageShell
      active="/channels"
      title="Каналы"
      subtitle="В MVP первым включаем веб-чат, затем Avito как ключевой ICP-канал, после него VK."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {channels.map((channel) => (
          <Card key={channel.type}>
            <div className="mb-6 flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-bg font-display text-xl font-black text-brand">
                {channel.name[0]}
              </div>
              <StatusBadge status={channel.status} />
            </div>
            <h2 className="font-display text-2xl font-black">{channel.name}</h2>
            <p className="mt-2 text-sm text-ink/55">{channel.dialogs} диалогов за месяц</p>
            <button className="mt-6 rounded-lg border border-border px-4 py-2 font-bold hover:bg-bg">
              {channel.status === "Активен" ? "Настроить" : "Подключить"}
            </button>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <h2 className="font-display text-2xl font-black">Код веб-чата</h2>
        <p className="mt-2 text-ink/60">Скопируйте сниппет на сайт клиента. Реальная выдача ключа будет после API подключения канала.</p>
        <code className="mt-5 block overflow-x-auto rounded-lg bg-ink p-4 text-sm text-white">
          {`<script src="https://edino.ai/widget.js" data-workspace="sever" async></script>`}
        </code>
      </Card>
    </PageShell>
  );
}
