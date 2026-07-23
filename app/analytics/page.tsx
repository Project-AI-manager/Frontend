"use client";

import {
  AlertCircle,
  ArrowUpRight,
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
import { type ReactNode } from "react";
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
  const metrics = [
    {
      label: "Диалогов",
      value: formatNumber(overview.dialogs_total),
      helper: `${overview.dialogs_open} открытых`,
      icon: MessageCircle,
      tone: "orange",
    },
    {
      label: "AI-ответов",
      value: formatNumber(overview.ai_replies_count),
      helper: `${formatPercent(overview.auto_reply_rate)} автоответов`,
      icon: Zap,
      tone: "emerald",
    },
    {
      label: "Среднее время",
      value: formatDuration(overview.avg_response_sec),
      helper: "первый ответ после входящего",
      icon: Timer,
      tone: "indigo",
    },
    {
      label: "Эскалаций",
      value: formatNumber(overview.dialogs_escalated),
      helper: `${formatPercent(overview.escalation_rate)} диалогов`,
      icon: BarChart3,
      tone: "red",
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
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="brand-kicker">Обзор</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Результаты работы ассистента
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                Данные обновляются из рабочего пространства и учитывают только
                ваши диалоги, ответы и документы.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="secondary-button px-4 py-2.5 text-sm"
            >
              {isFetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Обновить
            </button>
          </div>

          {isLoading ? (
            <StateCard
              className="mt-6"
              icon={<Loader2 className="animate-spin" size={18} />}
              title="Загружаем аналитику"
              description="Собираем показатели рабочего пространства."
            />
          ) : error ? (
            <StateCard
              className="mt-6"
              icon={<AlertCircle size={18} />}
              title="Не удалось загрузить аналитику"
              description={getApiErrorMessage(
                error,
                "Обнови страницу или повтори попытку позже.",
              )}
              tone="error"
            />
          ) : overview.dialogs_total === 0 ? (
            <StateCard
              className="mt-6"
              icon={<MessageCircle size={18} />}
              title="Данных пока нет"
              description="После первых Telegram-диалогов и ответов менеджеров здесь появятся реальные KPI."
            />
          ) : null}
        </section>

        <section className="surface-card grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <div className="space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-black">Статусы диалогов</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Текущее состояние обращений в рабочем пространстве.
                </p>
              </div>
              <span className="rounded-full bg-[#2463eb] px-3 py-1 text-xs font-bold text-white">
                {overview.dialogs_total} всего
              </span>
            </div>

            <div className="mt-8 space-y-4">
              {statusBars.length > 0 ? (
                statusBars.map((item) => (
                  <div key={item.status}>
                    <div className="flex justify-between gap-4 text-sm font-bold">
                      <span>{statusLabel(item.status)}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white shadow-inner">
                      <div
                        className={`h-full rounded-full ${statusColor(item.status)}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <StateCard
                  icon={<BarChart3 size={18} />}
                  title="Статусов пока нет"
                  description="Создай первый диалог через Telegram webhook."
                />
              )}
            </div>
          </section>

          <aside className="grid gap-6 md:grid-cols-2">
            <div className="blue-panel p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-lg bg-white text-[#2463eb]">
                  <TrendingUp size={22} />
                </span>
                <div>
                  <h2 className="font-black">Лимит диалогов</h2>
                  <p className="text-sm text-white/55">UsageCounter + Plan</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-sm font-bold">
                  <span>{overview.dialogs_used} использовано</span>
                  <span>{overview.dialogs_limit || "Без лимита"}</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${dialogUsagePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <SectionHeader
                icon={<BrainCircuit size={22} />}
                title="Качество AI"
                description="Показатели по ответам ассистента."
              />
              <div className="mt-5 space-y-3 text-sm">
                <InfoRow
                  label="Средняя confidence"
                  value={formatPercent(overview.avg_ai_confidence)}
                />
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
            </div>

            <div className="surface-card p-6">
              <SectionHeader
                icon={<BookOpen size={22} />}
                title="База знаний"
                description="Документы, фрагменты и кандидаты на обучение."
              />
              <div className="mt-5 space-y-3 text-sm">
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
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "orange" | "emerald" | "indigo" | "red";
}) {
  return (
    <div className="border-b border-[#d9e1ec] bg-white p-5 last:border-b-0 sm:border-r sm:[&:nth-child(even)]:border-r-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
      <div className="flex items-center justify-between">
        <span
          className={`flex size-11 items-center justify-center rounded-lg bg-white shadow-sm ${toneText(tone)}`}
        >
          <Icon size={20} />
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#526071]">
          live <ArrowUpRight size={13} />
        </span>
      </div>
      <p className="mt-5 text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs font-semibold text-neutral-500">{helper}</p>
    </div>
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
    <div className="flex items-start gap-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white text-[#2463eb] shadow-sm">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

function normalizeStatusBreakdown(overview: AnalyticsOverviewResponse) {
  return overview.status_breakdown.map((item) => ({
    ...item,
    percent:
      overview.dialogs_total > 0
        ? Math.round((item.count / overview.dialogs_total) * 100)
        : 0,
  }));
}

function percentOf(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((value / total) * 100));
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
      return "AI auto";
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
      return "bg-emerald-500";
    case "escalated":
      return "bg-[#e89120]";
    case "closed":
      return "bg-neutral-500";
    case "open":
      return "bg-[#2463eb]";
    default:
      return "bg-[#2463eb]";
  }
}

function toneText(tone: "orange" | "emerald" | "indigo" | "red") {
  return {
    orange: "text-[#2463eb]",
    emerald: "text-emerald-600",
    indigo: "text-[#2463eb]",
    red: "text-red-600",
  }[tone];
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
