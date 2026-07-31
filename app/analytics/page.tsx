"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUp,
  CalendarDays,
  Download,
  Inbox,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { analyticsApi } from "@/lib/api/analytics";
import type { AnalyticsOverviewResponse } from "@/lib/api/analytics";
import { getApiDownloadErrorMessage, getApiErrorMessage } from "@/lib/api/errors";

const periods = [7, 30] as const;
function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("ru-RU")
    .format(value ?? 0)
    .replace(/[\u00a0\u202f]/g, " ");
}

function formatDialogs(value: number, form: [string, string, string]) {
  const modulo100 = value % 100;
  const modulo10 = value % 10;
  if (modulo100 >= 11 && modulo100 <= 14) return form[2];
  if (modulo10 === 1) return form[0];
  if (modulo10 >= 2 && modulo10 <= 4) return form[1];
  return form[2];
}

function formatAutopilotDialogCount(value: number) {
  if (value === 0) return "Автопилот пока не ответил ни в одном диалоге";
  return `Автопилот ответил в ${formatNumber(value)} ${formatDialogs(value, ["диалоге", "диалогах", "диалогах"])}`;
}

function formatSeconds(value: number | undefined) {
  const seconds = value ?? 0;
  if (seconds < 60) return `${seconds} сек`;
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    return restMinutes ? `${hours} ч ${restMinutes} мин` : `${hours} ч`;
  }
  const rest = seconds % 60;
  return rest ? `${minutes} мин ${rest} сек` : `${minutes} мин`;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<(typeof periods)[number]>(30);
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(() => periodRange(30));
  const range = customRange ?? periodRange(period);
  const overview = useQuery({
    queryKey: ["analytics-overview", range.from, range.to],
    queryFn: () => analyticsApi.getOverview(range),
    refetchInterval: 15_000,
  });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function downloadDetailedReport() {
    setExporting(true);
    setExportError(null);
    try {
      const blob = await analyticsApi.downloadDetailed(range);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `autopilot-analytics-${range.from}-${range.to}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        await getApiDownloadErrorMessage(error, "Не удалось сформировать подробный отчёт."),
      );
    } finally {
      setExporting(false);
    }
  }
  const data = overview.data;
  const dialogs = data?.dialogs_total ?? data?.dialogs_used ?? 0;
  const dialogsWithAutopilot = Math.round((data?.auto_reply_rate ?? 0) * dialogs);
  const metrics = [
    {
      label: "Обращений",
      value: formatNumber(dialogs),
      delta: "За выбранный период",
      deltaColor: "text-[#64717f]",
    },
    {
      label: "Средний ответ",
      value: formatSeconds(data?.avg_response_sec),
      delta: "От сообщения клиента до ответа",
      deltaColor: "text-[#64717f]",
    },
    {
      label: "Передано менеджеру",
      value: `${Math.round((data?.escalation_rate ?? 0) * 100)}%`,
      delta: `${formatNumber(data?.dialogs_escalated)} ${formatDialogs(data?.dialogs_escalated ?? 0, ["диалог", "диалога", "диалогов"])}`,
      deltaColor: "text-[#64717f]",
    },
    {
      label: "С ответом автопилота",
      value: `${Math.round((data?.auto_reply_rate ?? 0) * 100)}%`,
      delta: formatAutopilotDialogCount(dialogsWithAutopilot),
      deltaColor: "text-[#64717f]",
    },
  ];
  const isEmpty = !overview.isLoading && !overview.isError && dialogs === 0;

  return (
    <AppShell
      title="Аналитика"
      description="Расходы и обращения за выбранный период."
      immersive
    >
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <header className="relative flex min-h-[65px] shrink-0 flex-wrap items-center gap-3 border-b border-[#d9e1ec] bg-white px-5 py-2.5">
          <div data-tour="tour-analytics-period" className="flex items-center gap-2.5">
            <span className="text-[12px] font-bold uppercase tracking-[.09em] text-[#64717f]">Период</span>
            <div
              className="flex items-center gap-1 rounded-full bg-[#f4f7fb] p-1"
              aria-label="Период аналитики"
            >
            {periods.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={!customRange && period === item}
                onClick={() => { setPeriod(item); setCustomRange(null); setCustomOpen(false); }}
                className={`min-h-8 rounded-full px-3.5 text-[13px] transition-colors ${
                  !customRange && period === item
                    ? "bg-white font-semibold text-[#1546ad] shadow-[0_2px_8px_rgba(18,39,76,.1)]"
                    : "font-medium text-[#526071] hover:bg-white/70"
                }`}
              >
                {item} дней
              </button>
            ))}
            </div>
          </div>

          <button
            type="button"
            aria-expanded={customOpen}
            aria-pressed={Boolean(customRange)}
            onClick={() => setCustomOpen((value) => !value)}
            className={`flex min-h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-semibold hover:bg-[#f4f7fb] ${customRange ? "border-[#cddfff] bg-[#eaf1ff] text-[#1546ad]" : "border-[#d9e1ec] bg-white text-[#101828]"}`}
          >
            <CalendarDays
              size={15}
              strokeWidth={1.85}
              className="text-[#64717f]"
              aria-hidden="true"
            />
            Другой период
          </button>

          {customOpen ? (
            <form
              aria-label="Другой период аналитики"
              onSubmit={(event) => {
                event.preventDefault();
                if (draftRange.from > draftRange.to) return;
                setCustomRange(draftRange);
                setCustomOpen(false);
              }}
              className="absolute top-[58px] left-5 z-20 flex items-end gap-3 rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_16px_40px_rgba(18,39,76,.16)]"
            >
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#526071]">
                С даты
                <input aria-label="Начало периода" type="date" value={draftRange.from} max={draftRange.to} onChange={(event) => setDraftRange((value) => ({ ...value, from: event.target.value }))} className="min-h-10 rounded-lg border border-[#d9e1ec] px-3 text-sm font-medium text-[#101828] outline-none focus:border-[#2463eb]" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#526071]">
                По дату
                <input aria-label="Конец периода" type="date" value={draftRange.to} min={draftRange.from} onChange={(event) => setDraftRange((value) => ({ ...value, to: event.target.value }))} className="min-h-10 rounded-lg border border-[#d9e1ec] px-3 text-sm font-medium text-[#101828] outline-none focus:border-[#2463eb]" />
              </label>
              <button type="submit" className="min-h-10 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white hover:bg-[#1d55cf]">Применить</button>
            </form>
          ) : null}

          <p className="text-[13px] tabular-nums text-[#64717f]">
            {formatRange(range.from, range.to)}
          </p>

          <button
            data-tour="tour-analytics-export"
            type="button"
            onClick={() => void downloadDetailedReport()}
            disabled={!data || exporting}
            className="ml-auto flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold whitespace-nowrap text-[#101828] hover:bg-[#f4f7fb]"
          >
            <Download
              size={16}
              strokeWidth={1.85}
              className="text-[#526071]"
              aria-hidden="true"
            />
            {exporting ? "Формируем…" : "Выгрузить подробно"}
          </button>
        </header>

        {exportError ? (
          <p role="alert" className="mx-8 mt-4 rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">
            {exportError}
          </p>
        ) : null}

        <main data-tour="tour-analytics-content" className="relative min-h-0 flex-1 overflow-y-auto px-8 pt-6 pb-7">
          {overview.isLoading ? (
            <AnalyticsSkeleton />
          ) : overview.isError ? (
            <AnalyticsState
              kind="error"
              title="Аналитика не загрузилась"
              text={getApiErrorMessage(
                overview.error,
                "Не удалось получить данные с сервера.",
              )}
              onRetry={() => overview.refetch()}
            />
          ) : isEmpty ? (
            <AnalyticsState
              kind="empty"
              title="Данных пока недостаточно"
              text="Графики появятся, когда наберётся хотя бы день переписок."
            />
          ) : (
            <div className="flex flex-col gap-4">
              <section data-tour="tour-analytics-metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели">
                {metrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="flex flex-col gap-2 rounded-lg border border-[#d9e1ec] bg-white p-5 shadow-[0_10px_22px_rgba(18,39,76,.07)]"
                  >
                    <p className="text-[11px] font-extrabold tracking-[.12em] text-[#64717f] uppercase">
                      {metric.label}
                    </p>
                    <p className="font-heading text-[30px] font-extrabold tracking-[-.04em] text-[#2463eb] tabular-nums">
                      {metric.value}
                    </p>
                    <p className={`text-[13px] ${metric.deltaColor}`}>
                      {metric.delta}
                    </p>
                  </article>
                ))}
              </section>

              <DailyChart period={period} data={data?.daily_series ?? []} />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
                <DialogBreakdown data={data!} />
                <ReplyOverview data={data!} />
              </div>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}

function DailyChart({ period, data }: { period: (typeof periods)[number]; data: Array<{ date: string; dialogs: number }> }) {
  const plotHeight = 210;
  const visibleData = data.map((item) => ({ date: formatShortDate(item.date), value: item.dialogs }));
  if (visibleData.length === 0) return null;
  const highestValue = Math.max(...visibleData.map((item) => item.value), 1);
  const axisMaximum = highestValue <= 10 ? Math.max(4, Math.ceil(highestValue)) : Math.ceil(highestValue / 40) * 40;
  const axisStep = axisMaximum / 3;
  const average = Math.round(
    (visibleData.reduce((sum, item) => sum + item.value, 0) / visibleData.length) * 10,
  ) / 10;
  const averageLabel = average < 10 && !Number.isInteger(average) ? average.toLocaleString("ru-RU", { maximumFractionDigits: 1 }) : Math.round(average).toLocaleString("ru-RU");
  const peak = visibleData.reduce((current, item) => item.value > current.value ? item : current);

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-base font-extrabold tracking-[-.02em]">
            Обращения по дням
          </h2>
          <p className="mt-1 text-[12px] text-[#64717f]">
            Уникальные диалоги, в которых клиент написал в этот день
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[13px] text-[#64717f]">в среднем</span>
            <span className="font-heading text-lg font-extrabold tracking-[-.03em] tabular-nums">
              {averageLabel} / день
            </span>
          </div>
          <div className="h-[34px] w-px bg-[#e5eaf1]" />
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[13px] text-[#64717f]">пик · {peak.date}</span>
            <span className="flex items-center gap-[5px] font-heading text-lg font-extrabold tracking-[-.03em] text-[#0c7a4e] tabular-nums">
              <ArrowUp size={14} strokeWidth={2.4} aria-hidden="true" />
              {peak.value}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto">
        <div className="flex h-[228px] shrink-0 flex-col justify-between pb-[18px] text-right text-xs text-[#64717f] tabular-nums">
          <span>{axisMaximum}</span>
          <span>{Math.round(axisStep * 2)}</span>
          <span>{Math.round(axisStep)}</span>
          <span>0</span>
        </div>
        <div className={`${period === 30 ? "min-w-[1080px]" : "min-w-[640px]"} flex-1`}>
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-[#e5eaf1]" />
            <div className="absolute inset-x-0 top-[70px] h-px bg-[#e5eaf1]" />
            <div className="absolute inset-x-0 top-[140px] h-px bg-[#e5eaf1]" />
            <div className="flex h-[210px] items-end gap-1.5 border-b border-[#d9e1ec]">
              {visibleData.map((item) => {
                const count = item.value;
                const total = Math.round((count / axisMaximum) * plotHeight);

                return (
                  <div
                    key={item.date}
                    aria-label={`${item.date}: ${count} обращений`}
                    className="flex h-full min-w-[24px] flex-1 flex-col justify-end gap-0.5"
                  >
                    <span className="mb-1 text-center text-[10px] font-semibold tabular-nums text-[#526071]">{count}</span>
                    <div
                      className="rounded-t bg-[#2463eb]"
                      style={{ height: total }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-1.5 pt-2 text-center text-[10px] text-[#64717f] tabular-nums">
            {visibleData.map((item) => <span key={item.date} className="min-w-[24px] flex-1">{item.date}</span>)}
          </div>
        </div>
      </div>
    </article>
  );
}

function periodRange(days: (typeof periods)[number]) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - days + 1);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(value: string) {
  const [, month, day] = value.split("-");
  return `${day}.${month}`;
}

function formatRange(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
  const year = to.slice(0, 4);
  return `${formatter.format(new Date(`${from}T00:00:00Z`))} — ${formatter.format(new Date(`${to}T00:00:00Z`))} ${year}`;
}

function DialogBreakdown({ data }: { data: AnalyticsOverviewResponse }) {
  const items = [
    { label: "В работе", value: data.dialogs_open, color: "bg-[#2463eb]" },
    { label: "Ответил автопилот", value: data.dialogs_auto, color: "bg-[#6d96ee]" },
    { label: "Нужен менеджер", value: data.dialogs_escalated, color: "bg-[#e89120]" },
    { label: "Закрыто", value: data.dialogs_closed, color: "bg-[#9aa7b5]" },
  ];

  return (
    <article className="flex flex-col gap-3.5 rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-base font-extrabold tracking-[-.02em]">
          Распределение диалогов
        </h2>
        <span className="text-[13px] text-[#64717f] tabular-nums">
          {formatNumber(data.dialogs_total)} всего
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const percent = data.dialogs_total ? Math.round((item.value / data.dialogs_total) * 100) : 0;
          return (
          <div key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-[#101828]">{item.label}</span>
              <span className="text-[#526071] tabular-nums">{formatNumber(item.value)} · {percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#f4f7fb]">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          );
        })}
      </div>
    </article>
  );
}

function ReplyOverview({ data }: { data: AnalyticsOverviewResponse }) {
  const items = [
    { label: "Ответов автопилота", value: formatNumber(data.ai_replies_count) },
    { label: "Ответов менеджеров", value: formatNumber(data.manager_replies_count) },
    { label: "Сообщений от клиентов", value: formatNumber(data.inbound_messages_count) },
    { label: "Средняя уверенность", value: `${Math.round(data.avg_ai_confidence * 100)}%` },
  ];
  return (
    <article className="flex flex-col gap-3.5 rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-base font-extrabold tracking-[-.02em]">
          Ответы и сообщения
        </h2>
        <span className="text-[13px] text-[#64717f]">за выбранный период</span>
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#e5eaf1] bg-[#e5eaf1]">
        {items.map((item) => (
          <div key={item.label} className="bg-white p-4">
            <p className="text-[12px] text-[#64717f]">{item.label}</p>
            <p className="mt-1 font-heading text-xl font-extrabold tracking-[-.03em] tabular-nums text-[#101828]">{item.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function AnalyticsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загружаем аналитику"
      className="flex animate-pulse flex-col gap-3 py-1"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="h-[118px] rounded-lg border border-[#e5eaf1] bg-[linear-gradient(90deg,#f4f7fb_0%,#eaf1ff_45%,#f4f7fb_90%)] bg-[length:200%_100%]"
        />
      ))}
    </div>
  );
}

function AnalyticsState({
  kind,
  title,
  text,
  onRetry,
}: {
  kind: "empty" | "error";
  title: string;
  text: string;
  onRetry?: () => void;
}) {
  const isError = kind === "error";

  return (
    <div
      className={`flex min-h-[300px] flex-col items-center gap-3 rounded-lg border px-8 py-14 text-center ${
        isError
          ? "border-[#f3cfcf] bg-[#fdeded]"
          : "border-[#d9e1ec] bg-[#f8fbff]"
      }`}
    >
      <div
        className={`flex size-12 items-center justify-center rounded-full border bg-white ${
          isError ? "border-[#f3cfcf]" : "border-[#d9e1ec]"
        }`}
      >
        {isError ? (
          <TriangleAlert
            size={22}
            strokeWidth={1.75}
            className="text-[#d84545]"
            aria-hidden="true"
          />
        ) : (
          <Inbox
            size={22}
            strokeWidth={1.75}
            className="text-[#2463eb]"
            aria-hidden="true"
          />
        )}
      </div>
      <h2
        className={`font-heading text-base font-extrabold tracking-[-.02em] ${
          isError ? "text-[#a72f2f]" : "text-[#101828]"
        }`}
      >
        {title}
      </h2>
      <p
        className={`max-w-[340px] text-sm leading-[1.6] ${
          isError ? "text-[#a72f2f]" : "text-[#526071]"
        }`}
      >
        {text}
      </p>
      {isError ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 flex min-h-10 items-center gap-2 rounded-lg border border-[#d84545] bg-white px-[18px] text-sm font-semibold text-[#a72f2f] hover:bg-[#fdeded]"
        >
          <RefreshCcw size={16} strokeWidth={1.75} aria-hidden="true" />
          Повторить
        </button>
      ) : null}
    </div>
  );
}
