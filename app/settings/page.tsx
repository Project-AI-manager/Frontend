import { Card, PageShell } from "@/components/navigation";

export default function SettingsPage() {
  return (
    <PageShell
      active="/settings"
      title="Настройки"
      subtitle="Вместо отдельных экранов — четыре компактных секции: AI, команда, тариф и компания."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl font-black">AI</h2>
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-sm font-bold">Порог уверенности: 80%</span>
              <input type="range" min="0" max="100" defaultValue="80" className="mt-3 w-full accent-[#0F6E5C]" />
            </label>
            <label className="flex items-center justify-between rounded-lg bg-bg p-4">
              <span className="font-bold">Автоответы</span>
              <input type="checkbox" className="h-5 w-5 accent-[#0F6E5C]" />
            </label>
            <textarea className="min-h-28 w-full rounded-lg border border-border bg-bg px-4 py-3" defaultValue="Отвечай кратко, дружелюбно и только по найденным источникам базы знаний." />
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-black">Команда</h2>
          <div className="mt-5 space-y-3">
            {[
              ["Тимур Закиров", "owner"],
              ["Анна менеджер", "manager"],
              ["Ильдар админ", "admin"],
            ].map(([name, role]) => (
              <div key={name} className="flex items-center justify-between rounded-lg bg-bg p-4">
                <div>
                  <p className="font-bold">{name}</p>
                  <p className="text-sm text-ink/50">{role}</p>
                </div>
                <button className="rounded-lg border border-border px-3 py-2 text-sm font-bold">Изменить</button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-black">Тариф и лимиты</h2>
          <p className="mt-4 text-3xl font-black">Бизнес</p>
          <p className="mt-1 text-sm text-ink/60">1 240 из 2 000 диалогов использовано</p>
          <div className="mt-5 h-3 rounded-full bg-bg">
            <div className="h-full w-[62%] rounded-full bg-brand" />
          </div>
          <button className="mt-6 rounded-lg bg-brand px-4 py-2 font-bold text-white">Повысить тариф</button>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-black">Компания</h2>
          <div className="mt-5 grid gap-4">
            <input className="rounded-lg border border-border bg-bg px-4 py-3" defaultValue="ООО Север" />
            <input className="rounded-lg border border-border bg-bg px-4 py-3" defaultValue="Розничная торговля электроникой" />
            <button className="rounded-lg border border-border px-4 py-2 font-bold">Сохранить</button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
