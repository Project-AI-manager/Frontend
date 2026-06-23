import { Card, PageShell } from "@/components/navigation";

export default function ProfilePage() {
  return (
    <PageShell active="/profile" title="Профиль" subtitle="Личные настройки пользователя и уведомления.">
      <Card className="max-w-2xl">
        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm font-bold">Имя</span>
            <input className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3" defaultValue="Тимур Закиров" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Email</span>
            <input className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3" defaultValue="owner@sever.ru" />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-bg p-4">
            <span className="font-bold">Уведомлять об эскалациях</span>
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-[#0F6E5C]" />
          </label>
          <button className="rounded-lg bg-brand px-4 py-3 font-bold text-white">Сохранить профиль</button>
        </div>
      </Card>
    </PageShell>
  );
}
