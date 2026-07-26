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
    state: "done" as const,
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
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <section className="panel p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="brand-kicker">Настройка кабинета</p>
              <h2 className="mt-3 font-display text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">
                Осталось два шага
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Двигайся сверху вниз. Каждый пункт ведёт на существующий
                рабочий экран и не создаёт дополнительных настроек.
              </p>
            </div>
            <span className="chip chip-blue shrink-0">1 из 3</span>
          </div>

          <div
            className="mt-6 h-2 overflow-hidden rounded-full bg-brand-soft"
            role="progressbar"
            aria-label="Прогресс настройки"
            aria-valuemin={0}
            aria-valuemax={3}
            aria-valuenow={1}
          >
            <div className="h-full w-1/3 rounded-full bg-brand" />
          </div>
        </section>

        <ol aria-label="Шаги настройки" className="space-y-4">
          {steps.map((step, index) => {
            const isDone = step.state === "done";
            const isCurrent = step.state === "current";

            return (
              <li
                key={step.title}
                className="card card-hover flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
                style={
                  isCurrent
                    ? { borderColor: "rgba(36, 99, 235, 0.34)" }
                    : undefined
                }
              >
                <span
                  className="num-badge num-badge-sm shrink-0"
                  data-state={step.state}
                >
                  {isDone ? (
                    <Check size={18} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <step.icon size={18} className="shrink-0 text-brand" />
                    <h3 className="font-display text-base font-extrabold tracking-[-0.02em]">
                      {step.title}
                    </h3>
                    {isCurrent ? (
                      <span className="chip chip-blue">Следующий шаг</span>
                    ) : null}
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                    {step.text}
                  </p>
                </div>

                <Link
                  href={step.href}
                  className={
                    isCurrent
                      ? "btn btn-primary btn-sm shrink-0"
                      : "btn btn-secondary btn-sm shrink-0"
                  }
                >
                  {step.action}
                  <ArrowRight size={15} />
                </Link>
              </li>
            );
          })}
        </ol>

        <section className="soft-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <span className="icon-badge shrink-0">
            <Send size={20} />
          </span>
          <p className="text-sm leading-6 text-muted">
            После настройки Telegram отправь тестовое сообщение боту — новый
            диалог появится во входящих.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
