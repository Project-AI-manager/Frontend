"use client";

import { RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import {
  analyticsApi,
  type AnalyticsOverviewResponse,
} from "@/lib/api/analytics";
import { getApiErrorMessage } from "@/lib/api/errors";

export default function AnalyticsPage() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.getOverview,
    retry: 1,
  });

  const overview = data ?? emptyOverview;
  const metrics = [
    {
      label: "Диалогов",
      value: formatNumber(overview.dialogs_total),
      helper: `${overview.dialogs_open} открытых`,
    },
    {
      label: "AI-ответов",
      value: formatNumber(overview.ai_replies_count),
      helper: `${formatPercent(overview.auto_reply_rate)} автоответов`,
    },
    {
      label: "Среднее время",
      value: formatDuration(overview.avg_response_sec),
      helper: "первый ответ после входящего",
    },
    {
      label: "Эскалаций",
      value: formatNumber(overview.dialogs_escalated),
      helper: `${formatPercent(overview.escalation_rate)} диалогов`,
    },
  ] as const;

  const statusBars = normalizeStatusBreakdown(overview);
  const dialogUsagePercent = percentOf(
    overview.dialogs_used,
    overview.dialogs_limit,
  );

  return (
    <AppShell
      title="Аналитика"
      description="Главные показатели диалогов, качества AI и использования тарифа."
    >
      <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-5">
        {/* Шапка обзора: кикер, заголовок и ручное обновление выборки. */}
        <section className="wf-box p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <span className="wf-kicker">Обзор</span>
              <h2 className="wf-title mt-2 text-balance">
                Результаты работы ассистента
              </h2>
              <p className="wf-muted mt-2 max-w-2xl text-sm leading-6">
                Данные обновляются из рабочего пространства и учитывают только
                ваши диалоги, ответы и документы.
              </p>
            </div>
            {/* Идущий фоновый запрос показываем отключённой кнопкой:
                отдельного индикатора в каркасе нет. */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-busy={isFetching}
              className="wf-btn shrink-0 self-start"
            >
              <RefreshCw size={18} className="text-muted" />
              Обновить
            </button>
          </div>
        </section>

        {isLoading ? (
          <section
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="wf-box p-4 sm:p-5"
          >
            {/* Скринридер получает текст состояния, глазами его заменяют скелетоны. */}
            <h3 className="sr-only">Загружаем аналитику</h3>
            <p className="sr-only">Собираем показатели рабочего пространства.</p>
            <div className="space-y-3" aria-hidden="true">
              {SKELETON_WIDTHS.map((width, index) => (
                <span
                  key={width}
                  className={`wf-skeleton block ${index === 0 ? "h-4" : "h-3"} ${width}`}
                />
              ))}
            </div>
          </section>
        ) : error ? (
          <StateBlock
            tone="error"
            title="Не удалось загрузить аналитику"
            description={getApiErrorMessage(
              error,
              "Обнови страницу или повтори попытку позже.",
            )}
          />
        ) : (
          <>
            {overview.dialogs_total === 0 ? (
              <StateBlock
                title="Данных пока нет"
                description="После первых Telegram-диалогов и ответов менеджеров здесь появятся реальные KPI."
              />
            ) : null}

            {/* Ряд KPI: четыре показателя, приходящие из /analytics/overview. */}
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </section>

            <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              {/* Распределение диалогов по статусам — CSS-полосы без библиотек. */}
              <section className="wf-box p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <span className="wf-kicker">Распределение</span>
                    <h2 className="wf-title mt-2">Статусы диалогов</h2>
                    <p className="wf-muted mt-2 text-sm leading-6">
                      Текущее состояние обращений в рабочем пространстве.
                    </p>
                  </div>
                  <span className="wf-tag shrink-0 self-start">
                    {overview.dialogs_total} всего
                  </span>
                </div>

                <div className="mt-5">
                  {statusBars.length > 0 ? (
                    <ul className="space-y-4">
                      {statusBars.map((item) => (
                        <li key={item.status}>
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <span className="text-sm">
                              {statusLabel(item.status)}
                            </span>
                            <span className="flex items-baseline gap-2">
                              <span className="text-sm font-semibold tabular-nums">
                                {item.count}
                              </span>
                              <span className="wf-muted text-xs tabular-nums">
                                {item.percent}%
                              </span>
                            </span>
                          </div>
                          <MeterBar className="mt-2" value={item.share} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <StateBlock
                      title="Статусов пока нет"
                      description="Диалоги появятся здесь, как только клиенты напишут в подключённый Telegram-бот."
                    />
                  )}
                </div>
              </section>

              {/* Потребление тарифа: сколько диалогов израсходовано из лимита. */}
              <section className="wf-box flex flex-col p-4 sm:p-5">
                <div className="min-w-0">
                  <h2 className="wf-title">Лимит диалогов</h2>
                  <p className="wf-muted mt-2 text-sm leading-6">
                    Расход диалогов по вашему тарифу
                  </p>
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                    <p className="text-2xl font-semibold leading-none tabular-nums">
                      {overview.dialogs_used}{" "}
                      <span className="wf-muted text-sm font-normal">
                        использовано
                      </span>
                    </p>
                    <span className="wf-muted text-sm tabular-nums">
                      {overview.dialogs_limit || "Без лимита"}
                    </span>
                  </div>
                  {overview.dialogs_limit > 0 ? (
                    <MeterBar className="mt-3" value={dialogUsagePercent} />
                  ) : null}
                </div>
              </section>
            </div>

            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {/* Качество AI: доля уверенности и разрез по авторам сообщений. */}
              <section className="wf-box h-full p-4 sm:p-5">
                <SectionHeader
                  title="Качество AI"
                  description="Показатели по ответам ассистента."
                />
                <div className="wf-fill mt-4 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="wf-muted text-sm">
                      Средняя уверенность ответов
                    </span>
                    <span className="text-2xl font-semibold leading-none tabular-nums">
                      {formatPercent(overview.avg_ai_confidence)}
                    </span>
                  </div>
                  <MeterBar
                    className="mt-3"
                    value={toPercent(overview.avg_ai_confidence)}
                  />
                </div>
                <div className="mt-4">
                  <StatRow
                    label="AI-ответы"
                    value={formatNumber(overview.ai_replies_count)}
                  />
                  <StatRow
                    label="Ответы менеджера"
                    value={formatNumber(overview.manager_replies_count)}
                  />
                  <StatRow
                    label="Входящие"
                    value={formatNumber(overview.inbound_messages_count)}
                  />
                </div>
              </section>

              {/* База знаний: что уже проиндексировано и что ждёт проверки. */}
              <section className="wf-box h-full p-4 sm:p-5">
                <SectionHeader
                  title="База знаний"
                  description="Документы, фрагменты и кандидаты на обучение."
                />
                <div className="mt-4">
                  <StatRow
                    label="Готовые документы"
                    value={formatNumber(overview.knowledge_documents_ready)}
                  />
                  <StatRow
                    label="Фрагменты"
                    value={formatNumber(overview.knowledge_chunks_count)}
                  />
                  <StatRow
                    label="Кандидаты"
                    value={formatNumber(overview.pending_candidates_count)}
                  />
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

/** Ширины строк-скелетонов: имитируют заголовок и три строки текста. */
const SKELETON_WIDTHS = ["w-2/5", "w-full", "w-4/5", "w-3/5"] as const;

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="wf-box flex h-full flex-col p-4">
      <p className="wf-muted text-sm">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="wf-muted mt-2 text-xs leading-5">{helper}</p>
    </article>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="wf-title">{title}</h2>
      <p className="wf-muted mt-2 text-sm leading-6">{description}</p>
    </div>
  );
}

/** Строка «подпись → значение» для сводок. */
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-line-soft py-2.5 first:pt-0 last:border-0 last:pb-0">
      <span className="wf-muted text-sm">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** Пустое состояние и ошибка: один блок без цветовых тонов. */
function StateBlock({
  title,
  description,
  tone = "empty",
}: {
  title: string;
  description: string;
  tone?: "empty" | "error";
}) {
  const isError = tone === "error";

  return (
    <section
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className="wf-fill p-4 sm:p-5"
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="wf-muted mt-2 text-sm leading-6">{description}</p>
    </section>
  );
}

/**
 * Горизонтальная полоса на чистом CSS: дорожка bg-fill, заливка bg-ink.
 * Заливка рисуется сразу из значения — она не ждёт ни следующего кадра, ни
 * скролла, поэтому полоса не может остаться пустой при ненулевой доле.
 */
function MeterBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const width = clampPercent(value);

  return (
    <div
      className={`h-2 overflow-hidden rounded-md bg-fill ${className}`}
      aria-hidden="true"
    >
      <div
        className="h-full bg-ink"
        // Ненулевая доля не должна схлопываться в невидимую полоску:
        // минимум — квадратик высотой в полосу.
        style={{ width: width > 0 ? `max(${width}%, 0.5rem)` : "0%" }}
      />
    </div>
  );
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

function normalizeStatusBreakdown(overview: AnalyticsOverviewResponse) {
  return overview.status_breakdown.map((item) => {
    // Доля считается от общего числа диалогов, а не от самого крупного статуса,
    // поэтому три равных значения дают три одинаковые полосы.
    const share =
      overview.dialogs_total > 0
        ? (item.count / overview.dialogs_total) * 100
        : 0;
    // Округлённое значение — только для подписи; полоса рисуется по точной доле,
    // иначе редкий статус с долей 0,4% получил бы пустую полосу.
    return { ...item, share, percent: Math.round(share) };
  });
}

function percentOf(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((value / total) * 100));
}

/** Доля 0..1 из API в проценты для ширины полосы. */
function toPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value * 100)));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return "0с";
  }
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  if (minutes === 0) {
    return `${restSeconds}с`;
  }
  return `${minutes}м ${restSeconds}с`;
}

function statusLabel(status: string) {
  switch (status) {
    case "open":
      return "Открытые";
    case "auto":
      return "Автоответы AI";
    case "escalated":
      return "Эскалации";
    case "closed":
      return "Закрытые";
    case "snoozed":
      return "Отложенные";
    default:
      return status || "Неизвестно";
  }
}

const emptyOverview: AnalyticsOverviewResponse = {
  dialogs_total: 0,
  dialogs_open: 0,
  dialogs_auto: 0,
  dialogs_escalated: 0,
  dialogs_closed: 0,
  auto_reply_rate: 0,
  escalation_rate: 0,
  avg_response_sec: 0,
  avg_ai_confidence: 0,
  ai_replies_count: 0,
  manager_replies_count: 0,
  inbound_messages_count: 0,
  dialogs_used: 0,
  dialogs_limit: 0,
  knowledge_documents_ready: 0,
  knowledge_chunks_count: 0,
  pending_candidates_count: 0,
  status_breakdown: [],
};
