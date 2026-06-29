import { Bell, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const profileBlocks = [
  { icon: UserRound, title: "Личные данные", text: "Имя, email и отображение в команде." },
  { icon: KeyRound, title: "Пароль", text: "Смена пароля появится после backend endpoint." },
  { icon: Bell, title: "Уведомления", text: "Настройки email и Telegram-уведомлений." },
  { icon: ShieldCheck, title: "Безопасность", text: "JWT-сессия и активные устройства." },
];

export default function ProfilePage() {
  return (
    <AppShell
      title="Профиль"
      description="Личные данные пользователя, роль в компании и настройки безопасности."
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="glass-card rounded-[1.75rem] p-6 text-center">
          <div className="mx-auto flex size-24 items-center justify-center rounded-[2rem] bg-black text-3xl font-black text-white">
            DO
          </div>
          <h2 className="mt-5 text-2xl font-black">Demo Owner</h2>
          <p className="mt-1 text-sm text-neutral-500">owner@example.com</p>
          <span className="mt-4 inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
            owner
          </span>
        </aside>

        <section className="grid gap-4 md:grid-cols-2">
          {profileBlocks.map((block) => (
            <article key={block.title} className="glass-card rounded-[1.75rem] p-6">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                <block.icon size={22} />
              </span>
              <h2 className="mt-5 text-xl font-black">{block.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{block.text}</p>
            </article>
          ))}

          <article className="glass-card rounded-[1.75rem] p-6 md:col-span-2">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-orange-500" />
              <h2 className="text-xl font-black">Контактные данные</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border border-black/10 bg-white px-4 py-3" value="Demo Owner" readOnly />
              <input className="rounded-2xl border border-black/10 bg-white px-4 py-3" value="owner@example.com" readOnly />
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
