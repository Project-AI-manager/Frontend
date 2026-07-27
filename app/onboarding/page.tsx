import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";

const steps = [
  {
    title: "Проверь рабочее пространство",
    text: "Убедись, что название компании и данные владельца указаны верно.",
    href: "/profile",
    action: "Открыть профиль",
    state: "done" as const,
  },
  {
    title: "Подключи Telegram",
    text: "Добавь токен бота и проверь, что канал появился в списке подключённых.",
    href: "/settings#channels",
    action: "Настроить канал",
    state: "current" as const,
  },
  {
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
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="wf-box p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="wf-kicker">Настройка кабинета</p>
              <h2 className="wf-title mt-2">Осталось два шага</h2>
              <p className="wf-muted mt-2 text-sm leading-6">
                Двигайся сверху вниз. Каждый пункт ведёт на существующий рабочий
                экран и не создаёт дополнительных настроек.
              </p>
            </div>
            <span className="wf-tag shrink-0">1 из 3</span>
          </div>

          <div
            className="wf-fill mt-5 h-2 overflow-hidden"
            role="progressbar"
            aria-label="Прогресс настройки"
            aria-valuemin={0}
            aria-valuemax={3}
            aria-valuenow={1}
          >
            <div className="h-full w-1/3 bg-ink" />
          </div>
        </section>

        <ol aria-label="Шаги настройки" className="space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="wf-box p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="wf-muted text-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base font-semibold">{step.title}</h3>
                {step.state === "current" ? (
                  <span className="wf-tag">
                    <span className="wf-dot" />
                    Следующий шаг
                  </span>
                ) : null}
              </div>

              <p className="wf-muted mt-2 text-sm leading-6">{step.text}</p>

              <div className="mt-4">
                <Link
                  href={step.href}
                  className={
                    step.state === "current"
                      ? "wf-btn wf-btn-primary"
                      : "wf-btn"
                  }
                >
                  {step.action}
                </Link>
              </div>
            </li>
          ))}
        </ol>

        <section className="wf-fill p-5">
          <p className="wf-muted text-sm leading-6">
            После настройки Telegram отправь тестовое сообщение боту — новый
            диалог появится во входящих.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
