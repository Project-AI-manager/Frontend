import { ArrowRight, BrainCircuit, Building2, Send } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";

const steps = [
  {
    icon: Building2,
    title: "Проверь профиль компании",
    text: "Название, роль владельца и базовые настройки пространства.",
    action: "Профиль готов",
  },
  {
    icon: Send,
    title: "Подключи Telegram",
    text: "В MVP подключаем только Telegram-бота и синхронизацию чатов.",
    action: "Перейти к каналам",
  },
  {
    icon: BrainCircuit,
    title: "Добавь базу знаний",
    text: "Загрузи первый manual-документ, чтобы AI мог показывать источники.",
    action: "Добавить документ",
  },
];

export default function OnboardingPage() {
  return (
    <AppShell
      title="Онбординг"
      description="Три шага, чтобы превратить пустой кабинет в рабочее демо."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {steps.map((step, index) => (
            <article key={step.title} className="glass-card rounded-lg p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#2463eb] text-white">
                    <step.icon size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#2463eb]">
                      Шаг {index + 1}
                    </p>
                    <h2 className="mt-1 text-2xl font-black">{step.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                      {step.text}
                    </p>
                  </div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9e1ec] bg-white px-5 py-3 text-sm font-bold">
                  {step.action}
                  <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="rounded-lg bg-[#2463eb] p-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#c9d9ff]">
            Прогресс
          </p>
          <h2 className="mt-4 text-3xl font-black">1 из 3</h2>
          <div className="mt-5 h-3 rounded-full bg-white/20">
            <div className="h-3 w-1/3 rounded-full bg-white" />
          </div>
          <p className="mt-5 text-sm leading-6 text-white/60">
            Сейчас можно проверить auth и базу знаний. Следующий большой кусок —
            Telegram-канал и реальные диалоги.
          </p>
          <Link
            href="/channels"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white px-5 py-3 font-black text-[#1546ad]"
          >
            Продолжить
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}
