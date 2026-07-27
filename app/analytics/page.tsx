"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Download,
  Inbox,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { analyticsApi } from "@/lib/api/analytics";
import { getApiErrorMessage } from "@/lib/api/errors";

const periods = ["7 дней", "30 дней", "Выбранный период"] as const;
const counts = [
  96, 112, 104, 128, 141, 118, 88, 132, 156, 149, 137, 168, 174, 152,
  130, 121, 165, 181, 158, 143, 176, 190, 172, 238, 205, 188, 166, 152,
  194, 206,
];
const hourlyActivity = [
  4, 3, 2, 2, 2, 3, 6, 12, 22, 34, 46, 58, 70, 74, 66, 58, 52, 46,
  38, 30, 24, 18, 12, 7,
];
const channelSpend = [
  { label: "Telegram", value: "5 320 ₽", percent: 43 },
  { label: "WhatsApp", value: "3 180 ₽", percent: 26 },
  { label: "Avito", value: "2 240 ₽", percent: 18 },
  { label: "VK и Instagram", value: "1 740 ₽", percent: 13 },
];

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("ru-RU")
    .format(value ?? 0)
    .replace(/[\u00a0\u202f]/g, " ");
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("30 дней");
  const overview = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: analyticsApi.getOverview,
  });
  const data = overview.data;
  const dialogs = data?.dialogs_total ?? data?.dialogs_used ?? 0;
  const metrics = [
    {
      label: "Расход",
      value: "12 480 ₽",
      delta: "−14% к июню",
      deltaColor: "text-[#0c7a4e]",
    },
    {
      label: "Токенов",
      value: "8,4 млн",
      delta: "2,59 ₽ за ответ",
      deltaColor: "text-[#64717f]",
    },
    {
      label: "Обращений",
      value: formatNumber(dialogs),
      delta: "+12% к июню",
      deltaColor: "text-[#0c7a4e]",
    },
    {
      label: "Без человека",
      value: `${Math.round((data?.auto_reply_rate ?? 0) * 100)}%`,
      delta: "+4 п.п.",
      deltaColor: "text-[#0c7a4e]",
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
        <header className="relative flex min-h-[65px] shrink-0 items-center gap-2.5 border-b border-[#d9e1ec] bg-white px-5">
          <div
            className="flex overflow-hidden rounded-lg border border-[#d9e1ec] bg-white"
            aria-label="Период аналитики"
          >
            {periods.map((item, index) => (
              <button
                key={item}
                type="button"
                aria-pressed={period === item}
                onClick={() => setPeriod(item)}
                className={`flex min-h-10 items-center gap-[7px] px-[15px] text-[13px] transition-colors ${index ? "border-l border-[#d9e1ec]" : ""} ${
                  period === item
                    ? "bg-[#eaf1ff] font-semibold text-[#1546ad]"
                    : "font-medium text-[#526071] hover:bg-[#f4f7fb]"
                }`}
              >
                {item}
                {item === "Выбранный период" ? (
                  <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>

          <div className="flex min-h-10 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-[#f8fbff] px-3.5 text-[13px] tabular-nums text-[#526071]">
            <CalendarDays
              size={15}
              strokeWidth={1.85}
              className="text-[#64717f]"
              aria-hidden="true"
            />
            28 июня — 27 июля
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="ml-auto flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold whitespace-nowrap text-[#101828] hover:bg-[#f4f7fb]"
          >
            <Download
              size={16}
              strokeWidth={1.85}
              className="text-[#526071]"
              aria-hidden="true"
            />
            Выгрузить
          </button>
        </header>

        <main className="relative min-h-0 flex-1 overflow-y-auto px-8 pt-6 pb-7">
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
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели">
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

              <DailyChart />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
                <ChannelSpend />
                <HourlyChart />
              </div>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}

function DailyChart() {
  const axisMaximum = 240;
  const plotHeight = 210;
  const average = Math.round(
    counts.reduce((sum, value) => sum + value, 0) / counts.length,
  );
  const peak = Math.max(...counts);

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-heading text-base font-extrabold tracking-[-.02em]">
          Обращения по дням
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[13px] text-[#64717f]">в среднем</span>
            <span className="font-heading text-lg font-extrabold tracking-[-.03em] tabular-nums">
              {average} / день
            </span>
          </div>
          <div className="h-[34px] w-px bg-[#e5eaf1]" />
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[13px] text-[#64717f]">пик · 24 июля</span>
            <span className="flex items-center gap-[5px] font-heading text-lg font-extrabold tracking-[-.03em] text-[#0c7a4e] tabular-nums">
              <ArrowUp size={14} strokeWidth={2.4} aria-hidden="true" />
              {peak}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto">
        <div className="flex h-[228px] shrink-0 flex-col justify-between pb-[18px] text-right text-xs text-[#64717f] tabular-nums">
          <span>240</span>
          <span>160</span>
          <span>80</span>
          <span>0</span>
        </div>
        <div className="min-w-[760px] flex-1">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-[#e5eaf1]" />
            <div className="absolute inset-x-0 top-[70px] h-px bg-[#e5eaf1]" />
            <div className="absolute inset-x-0 top-[140px] h-px bg-[#e5eaf1]" />
            <div className="flex h-[210px] items-end gap-1.5 border-b border-[#d9e1ec]">
              {counts.map((count, index) => {
                const total = Math.round((count / axisMaximum) * plotHeight);
                const human = Math.max(
                  6,
                  Math.round(total * (0.14 + ((index * 7) % 11) / 100)),
                );

                return (
                  <div
                    key={`${index}-${count}`}
                    className="flex h-full min-w-2 flex-1 cursor-pointer flex-col justify-end gap-0.5 hover:opacity-70"
                    title={`${count} обращений`}
                  >
                    <div
                      className="rounded-t border border-[#2463eb] bg-[#eaf1ff]"
                      style={{ height: human }}
                    />
                    <div
                      className="rounded-b bg-[#2463eb]"
                      style={{ height: total - human }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between pt-2 text-xs text-[#64717f] tabular-nums">
            <span>28 июня</span>
            <span>12 июля</span>
            <span>27 июля</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ChannelSpend() {
  return (
    <article className="flex flex-col gap-3.5 rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-base font-extrabold tracking-[-.02em]">
          Расход по каналам
        </h2>
        <span className="text-[13px] text-[#64717f] tabular-nums">
          12 480 ₽ за месяц
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {channelSpend.map((item) => (
          <div key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-[#101828]">{item.label}</span>
              <span className="text-[#526071] tabular-nums">{item.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#f4f7fb]">
              <div
                className="h-full rounded-full bg-[#2463eb]"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function HourlyChart() {
  return (
    <article className="flex flex-col gap-3.5 rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-base font-extrabold tracking-[-.02em]">
          Когда пишут клиенты
        </h2>
        <span className="text-[13px] text-[#64717f]">пик 12:00–14:00</span>
      </div>
      <div
        className="flex h-[120px] items-end gap-1 border-b border-[#d9e1ec]"
        aria-label="Почасовая активность клиентов"
      >
        {hourlyActivity.map((height, index) => (
          <div
            key={`${index}-${height}`}
            title={`${index}:00`}
            className={`min-w-1 flex-1 rounded-t-[3px] ${
              index >= 11 && index <= 14 ? "bg-[#2463eb]" : "bg-[#c9dcfb]"
            }`}
            style={{ height: height + 6 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-[#64717f] tabular-nums">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
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
