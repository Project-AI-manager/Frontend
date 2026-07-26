"use client";

import {
  AlertCircle,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Loader2,
  MessageCircle,
  RefreshCw,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { InfoRow } from "@/components/ui/info-row";
import { StateCard } from "@/components/ui/state-card";
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
  // Это метрики, а не статусы: эмблемы всегда в синем акценте, цвет несут
  // только точки статусов и чипы.
  const metrics = [
    {
      label: "Диалогов",
      value: formatNumber(overview.dialogs_total),
      helper: `${overview.dialogs_open} открытых`,
      icon: MessageCircle,
      rate: null,
    },
    {
      label: "AI-ответов",
      value: formatNumber(overview.ai_replies_count),
      helper: `${formatPercent(overview.auto_reply_rate)} автоответов`,
      icon: Zap,
      rate: overview.auto_reply_rate,
    },
    {
      label: "Среднее время",
      value: formatDuration(overview.avg_response_sec),
      helper: "первый ответ после входящего",
      icon: Timer,
      rate: null,
    },
    {
      label: "Эскалаций",
      value: formatNumber(overview.dialogs_escalated),
      helper: `${formatPercent(overview.escalation_rate)} диалогов`,
      icon: BarChart3,
      rate: overview.escalation_rate,
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
      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        {/* Шапка обзора: кикер, заголовок и ручное обновление выборки. */}
        <section className="panel overflow-hidden">
          <div className="soft-grid flex flex-col gap-5 bg-mist p-5 sm:p-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <span className="section-kicker">
                <BarChart3 size={16} />
                Обзор
              </span>
              <h2 className="font-display mt-3 text-balance text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">
                Результаты работы ассистента
              </h2>
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted">
                Данные обновляются из рабочего пространства и учитывают только
                ваши диалоги, ответы и документы.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn btn-secondary btn-sm shrink-0 self-start"
            >
              {isFetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Обновить
            </button>
          </div>
        </section>

        {isLoading ? (
          <StateCard
            variant="loading"
            title="Загружаем аналитику"
            description="Собираем показатели рабочего пространства."
            rows={4}
          />
        ) : error ? (
          <StateCard
            variant="error"
            icon={<AlertCircle size={22} />}
            title="Не удалось загрузить аналитику"
            description={getApiErrorMessage(
              error,
              "Обнови страницу или повтори попытку позже.",
            )}
          />
        ) : (
          <>
            {overview.dialogs_total === 0 ? (
              <StateCard
                icon={<MessageCircle size={22} />}
                title="Данных пока нет"
                description="После первых Telegram-диалогов и ответов менеджеров здесь появятся реальные KPI."
              />
            ) : null}

            {/* Ряд KPI: четыре показателя, приходящие из /analytics/overview. */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </section>

            <div className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              {/* Распределение диалогов по статусам — CSS-бары без библиотек. */}
              <section className="panel p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <span className="section-kicker">
                      <BarChart3 size={16} />
                      Распределение
                    </span>
                    <h2 className="font-display mt-3 text-xl font-extrabold tracking-[-0.04em]">
                      Статусы диалогов
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Текущее состояние обращений в рабочем пространстве.
                    </p>
                  </div>
                  <span className="chip chip-blue shrink-0 self-start">
                    {overview.dialogs_total} всего
                  </span>
                </div>

                <div className="mt-7">
                  {statusBars.length > 0 ? (
                    <ul className="space-y-5">
                      {statusBars.map((item) => (
                        <li key={item.status}>
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <span className="flex items-center gap-2.5 text-sm font-bold text-ink">
                              <span
                                className={`size-2 shrink-0 rounded-full ${statusColor(item.status)}`}
                                aria-hidden="true"
                              />
                              {statusLabel(item.status)}
                            </span>
                            <span className="flex items-baseline gap-2">
                              <span className="font-display text-base font-extrabold tabular-nums text-ink">
                                {item.count}
                              </span>
                              <span className="text-xs font-semibold tabular-nums text-faint">
                                {item.percent}%
                              </span>
                            </span>
                          </div>
                          <MeterBar
                            className="mt-2.5"
                            value={item.share}
                            fillClassName={statusColor(item.status)}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <StateCard
                      icon={<BarChart3 size={22} />}
                      title="Статусов пока нет"
                      description="Диалоги появятся здесь, как только клиенты напишут в подключённый Telegram-бот."
                    />
                  )}
                </div>
              </section>

              {/* Потребление тарифа: сколько диалогов израсходовано из лимита. */}
              <section className="blue-panel flex flex-col p-5 sm:p-6">
                <div className="flex items-center gap-3.5">
                  <span
                    className="icon-badge icon-badge-inverse shrink-0"
                    aria-hidden="true"
                  >
                    <TrendingUp size={22} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-extrabold tracking-[-0.04em]">
                      Лимит диалогов
                    </h2>
                    <p className="mt-0.5 text-sm text-on-brand">
                      Расход диалогов по вашему тарифу
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                    <p className="font-display text-3xl font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                      {overview.dialogs_used}{" "}
                      <span className="text-sm font-bold text-on-brand-strong">
                        использовано
                      </span>
                    </p>
                    <span className="text-sm font-bold tabular-nums text-on-brand-strong">
                      {overview.dialogs_limit || "Без лимита"}
                    </span>
                  </div>
                  {overview.dialogs_limit > 0 ? (
                    <MeterBar
                      className="mt-4"
                      value={dialogUsagePercent}
                      trackClassName="h-2 bg-white/25"
                      fillClassName="bg-white"
                    />
                  ) : null}
                </div>
              </section>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
              {/* Качество AI: доля уверенности и разрез по авторам сообщений. */}
              <section className="panel h-full p-5 sm:p-6">
                <SectionHeader
                  icon={<BrainCircuit size={22} />}
                  title="Качество AI"
                  description="Показатели по ответам ассистента."
                />
                <div className="soft-panel mt-5 p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-sm text-muted">
                      Средняя уверенность ответов
                    </span>
                    <span className="font-display text-2xl font-extrabold leading-none tracking-[-0.04em] tabular-nums text-brand">
                      {formatPercent(overview.avg_ai_confidence)}
                    </span>
                  </div>
                  <MeterBar
                    className="mt-3.5"
                    value={toPercent(overview.avg_ai_confidence)}
                    trackClassName="h-2 bg-line-soft"
                  />
                </div>
                <div className="mt-5 text-sm">
                  <InfoRow
                    label="AI-ответы"
                    value={formatNumber(overview.ai_replies_count)}
                  />
                  <InfoRow
                    label="Ответы менеджера"
                    value={formatNumber(overview.manager_replies_count)}
                  />
                  <InfoRow
                    label="Входящие"
                    value={formatNumber(overview.inbound_messages_count)}
                  />
                </div>
              </section>

              {/* База знаний: что уже проиндексировано и что ждёт проверки. */}
              <section className="panel h-full p-5 sm:p-6">
                <SectionHeader
                  icon={<BookOpen size={22} />}
                  title="База знаний"
                  description="Документы, фрагменты и кандидаты на обучение."
                />
                <div className="mt-5 text-sm">
                  <InfoRow
                    label="Готовые документы"
                    value={formatNumber(overview.knowledge_documents_ready)}
                  />
                  <InfoRow
                    label="Фрагменты"
                    value={formatNumber(overview.knowledge_chunks_count)}
                  />
                  <InfoRow
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

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  rate,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  rate: number | null;
}) {
  return (
    <article className="card card-hover flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="icon-badge shrink-0" aria-hidden="true">
          <Icon size={22} />
        </span>
        <span className="chip chip-grey shrink-0">
          <span className="status-dot" data-tone="grey" aria-hidden="true" />
          live
        </span>
      </div>
      <p className="mt-5 text-sm text-muted">{label}</p>
      <p className="font-display mt-1.5 text-3xl font-extrabold leading-none tracking-[-0.04em] tabular-nums text-brand">
        {value}
      </p>
      <p className="mt-2.5 text-xs font-semibold leading-5 text-muted">
        {helper}
      </p>
      {/* Полоса стоит вплотную к helper и показывает ровно ту долю, которая в
          нём названа словами, — отдельная подпись не нужна. Где доли нет
          (счётчик или время), нет и полосы. */}
      {rate === null ? null : (
        <MeterBar className="mt-3.5" value={toPercent(rate)} />
      )}
    </article>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="icon-badge shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-xl font-extrabold tracking-[-0.04em]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}

/**
 * Горизонтальная полоса на чистом CSS.
 * Заливка рисуется сразу из значения — она не ждёт ни следующего кадра, ни
 * скролла, поэтому полоса не может остаться пустой при ненулевой доле.
 * Анимируется только смена значения (обновление данных).
 */
function MeterBar({
  value,
  trackClassName = "h-2 bg-surface",
  fillClassName = "bg-brand",
  className = "",
}: {
  value: number;
  trackClassName?: string;
  fillClassName?: string;
  className?: string;
}) {
  const width = clampPercent(value);

  return (
    <div
      className={`overflow-hidden rounded-full ${trackClassName} ${className}`}
      aria-hidden="true"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${fillClassName}`}
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

function statusColor(status: string) {
  switch (status) {
    case "auto":
      return "bg-ok";
    case "escalated":
      return "bg-warn";
    case "closed":
      return "bg-faint";
    case "open":
      return "bg-brand";
    default:
      return "bg-brand";
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
