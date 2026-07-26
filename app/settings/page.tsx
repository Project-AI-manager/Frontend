import { Bell, Bot, ChevronRight, Languages, Moon, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const settingGroups = [
  {
    title: "Автопилот",
    items: [
      { icon: Bot, label: "AI-ассистент", value: "Активен", tone: "text-[#008069]" },
      { icon: Languages, label: "Язык ответов", value: "Автоматически" },
      { icon: ShieldCheck, label: "Порог уверенности", value: "Средний" },
    ],
  },
  {
    title: "Приложение",
    items: [
      { icon: Bell, label: "Уведомления", value: "Все сообщения" },
      { icon: Moon, label: "Оформление", value: "Системное" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <AppShell
      title="Настройки"
      description="Настройте поведение Автопилота и рабочее пространство."
    >
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {settingGroups.map((group) => (
            <section key={group.title} className="overflow-hidden rounded-[26px] bg-white shadow-[0_1px_2px_rgba(11,20,26,0.08)]">
              <h2 className="px-5 pb-2 pt-5 text-sm font-semibold text-[#008069] sm:px-6">{group.title}</h2>
              <ul className="divide-y divide-[#e9edef]">
                {group.items.map(({ icon: Icon, label, value, tone }) => (
                  <li key={label}>
                    <button className="flex min-h-18 w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-[#f7f8fa] focus-visible:outline-2 focus-visible:outline-[#00a884] sm:px-6">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-[#54656f]">
                        <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-[#111b21]">{label}</span>
                        <span className={`mt-0.5 block text-sm ${tone ?? "text-[#667781]"}`}>{value}</span>
                      </span>
                      <ChevronRight aria-hidden="true" className="text-[#8696a0]" size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="h-fit rounded-[26px] bg-[#d9fdd3] p-6 shadow-[0_1px_2px_rgba(11,20,26,0.08)] lg:sticky lg:top-6">
          <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#008069]">AI работает</span>
          <h2 className="mt-6 text-xl font-semibold text-[#111b21]">Ответы под контролем</h2>
          <p className="mt-2 text-sm leading-6 text-[#3b4a54]">
            Если ассистент сомневается, диалог автоматически перейдёт менеджеру.
          </p>
          <button className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#00a884] px-5 text-sm font-semibold text-white transition hover:bg-[#008f72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008069]">
            Проверить ответ
          </button>
        </aside>
      </div>
    </AppShell>
  );
}
