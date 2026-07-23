import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Check,
  Send,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";

const steps = [
  {
    icon: Building2,
    title: "Проверь рабочее пространство",
    text: "Убедись, что название компании и данные владельца указаны верно.",
    href: "/profile",
    action: "Открыть профиль",
    state: "ready" as const,
  },
  {
    icon: Send,
    title: "Подключи Telegram",
    text: "Добавь токен бота и проверь, что канал появился в списке подключённых.",
    href: "/channels",
    action: "Настроить канал",
    state: "current" as const,
  },
  {
    icon: BookOpenCheck,
    title: "Подготовь базу знаний",
    text: "Создай первый документ и задай тестовый вопрос ассистенту.",
    href: "/knowledge",
    action: "Перейти к знаниям",
    state: "next" as const,
  },
];

export default function OnboardingPage() {
  return (
    <AppShell
      title="Начало работы"
      description="Короткий маршрут от пустого кабинета до первого диалога с AI."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="surface-card overflow-hidden">
          <div className="border-b border-[#d9e1ec] bg-white px-6 py-6 sm:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="brand-kicker">Настройка кабинета</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Осталось два шага
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#526071]">
                  Двигайся сверху вниз. Каждый пункт ведёт на существующий
                  рабочий экран и не создаёт дополнительных настроек.
                </p>
              </div>
              <span className="shrink-0 text-sm font-black text-[#1546ad]">
                1 из 3
              </span>
            </div>
            <div
              className="mt-5 h-2 overflow-hidden rounded-full bg-[#eaf1ff]"
              role="progressbar"
              aria-label="Прогресс настройки"
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={1}
            >
              <div className="h-full w-1/3 rounded-full bg-[#2463eb]" />
            </div>
          </div>

          <ol
            aria-label="Шаги настройки"
            className="divide-y divide-[#d9e1ec] bg-white px-6 sm:px-8"
          >
            {steps.map((step, index) => {
              const isReady = step.state === "ready";
              const isCurrent = step.state === "current";

              return (
                <li key={step.title} className="relative py-7 pl-14 sm:pl-16">
                  <span
                    className={`absolute left-0 top-7 flex size-10 items-center justify-center rounded-lg border text-sm font-black ${
                      isReady
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : isCurrent
                          ? "border-[#2463eb] bg-[#2463eb] text-white"
                          : "border-[#d9e1ec] bg-[#f8fbff] text-[#526071]"
                    }`}
                  >
                    {isReady ? <Check size={18} /> : index + 1}
                  </span>

                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 gap-3">
                      <step.icon
                        size={20}
                        className="mt-0.5 shrink-0 text-[#2463eb]"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black">{step.title}</h3>
                          {isCurrent ? (
                            <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-xs font-bold text-[#1546ad]">
                              Следующий шаг
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-[#526071]">
                          {step.text}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={step.href}
                      className={
                        isCurrent
                          ? "primary-button shrink-0 px-4 py-2.5 text-sm"
                          : "secondary-button shrink-0 px-4 py-2.5 text-sm"
                      }
                    >
                      {step.action}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="text-center text-sm leading-6 text-[#526071]">
          После настройки Telegram отправь тестовое сообщение боту — новый
          диалог появится во входящих.
        </p>
      </div>
    </AppShell>
  );
}
