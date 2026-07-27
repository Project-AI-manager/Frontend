"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { analyticsApi } from "@/lib/api/analytics";
const counts = [96, 112, 104, 128, 141, 118, 88, 132, 156, 149, 137, 168, 174, 152, 130, 121, 165, 181, 158, 143, 176, 190, 172, 238, 205, 188, 166, 152, 194, 206];
const hours = [4, 3, 2, 2, 2, 3, 6, 12, 22, 34, 46, 58, 70, 74, 66, 58, 52, 46, 38, 30, 24, 18, 12, 7];
const spend = [
  { label: "Telegram", value: "5 320 ₽", tokens: "3,6 млн", pct: 43 },
  { label: "WhatsApp", value: "3 180 ₽", tokens: "2,1 млн", pct: 26 },
  { label: "Avito", value: "2 240 ₽", tokens: "1,5 млн", pct: 18 },
  { label: "VK и Instagram", value: "1 740 ₽", tokens: "1,2 млн", pct: 13 },
];

function number(value: number | undefined) {
  return new Intl.NumberFormat("ru-RU").format(value ?? 0);
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30 дней");
  const query = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: analyticsApi.getOverview,
  });
  const data = query.data;
  const metrics = [
    { label: "Расход", value: "12 480 ₽", delta: "−14% к июню" },
    { label: "AI-ответов", value: number(data?.ai_replies_count), delta: `${number(data?.avg_response_sec)} сек. в среднем` },
    { label: "Обращений", value: number(data?.dialogs_total ?? data?.dialogs_used), delta: "за выбранный период" },
    { label: "Без человека", value: `${Math.round((data?.auto_reply_rate ?? 0) * 100)}%`, delta: "доля автоответов" },
  ];
  const isEmpty = !query.isLoading && !query.isError && (data?.dialogs_total ?? data?.dialogs_used ?? 0) === 0;

  return (
    <AppShell title="Аналитика" description="Расходы и обращения за выбранный период.">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-[#d9e1ec] bg-white p-1">
          {["7 дней", "30 дней", "Выбранный период"].map((item) => (
            <button key={item} type="button" onClick={() => setPeriod(item)} className={`min-h-8 rounded-md px-3 text-[13px] font-semibold transition ${period === item ? "bg-[#eaf1ff] text-[#1546ad]" : "text-[#526071] hover:bg-[#f4f7fb]"}`}>
              {item}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#101828] hover:bg-[#f4f7fb]">
          <Download size={16} /> Выгрузить
        </button>
      </div>

      {query.isLoading ? <AnalyticsSkeleton /> : query.isError ? (
        <StateCard title="Аналитика не загрузилась" text={getApiErrorMessage(query.error, "Не удалось получить данные с сервера.")} action="Повторить" onAction={() => query.refetch()} />
      ) : isEmpty ? (
        <StateCard title="Данных пока недостаточно" text="Графики появятся, когда наберётся хотя бы день переписок." />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-lg border border-[#d9e1ec] bg-white p-5 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
                <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">{metric.label}</p>
                <p className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-[#2463eb] tabular-nums">{metric.value}</p>
                <p className="mt-2 text-[13px] text-[#0c7a4e]">{metric.delta}</p>
              </article>
            ))}
          </div>
          <DailyChart />
          <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
            <article className="rounded-lg border border-[#d9e1ec] bg-white p-5 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
              <div className="mb-5 flex items-start justify-between gap-4"><h2 className="font-extrabold">Расход по каналам</h2><span className="text-sm font-semibold text-[#526071]">12 480 ₽ за месяц</span></div>
              <div className="space-y-4">{spend.map((item) => <div key={item.label}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-semibold">{item.label}</span><span className="text-[#526071]">{item.tokens} · <b className="text-[#101828]">{item.value}</b></span></div><div className="h-2 overflow-hidden rounded-full bg-[#eaf1ff]"><div className="h-full rounded-full bg-[#2463eb]" style={{ width: `${item.pct}%` }} /></div></div>)}</div>
            </article>
            <article className="rounded-lg border border-[#d9e1ec] bg-white p-5 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
              <div className="mb-5 flex items-start justify-between gap-4"><h2 className="font-extrabold">Когда пишут клиенты</h2><span className="text-sm font-semibold text-[#1546ad]">пик 12:00–14:00</span></div>
              <div className="flex h-44 items-end gap-1.5" aria-label="Почасовая активность клиентов">{hours.map((height, index) => <div key={`${index}-${height}`} title={`${index}:00`} className={`min-w-1 flex-1 rounded-t ${index >= 11 && index <= 14 ? "bg-[#2463eb]" : "bg-[#c9dcfb]"}`} style={{ height: `${height + 6}%` }} />)}</div>
              <div className="mt-2 flex justify-between text-xs text-[#64717f]"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
            </article>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function DailyChart() {
  const max = 240;
  const average = Math.round(counts.reduce((sum, value) => sum + value, 0) / counts.length);
  return <article className="rounded-lg border border-[#d9e1ec] bg-white p-5 shadow-[0_10px_22px_rgba(18,39,76,.07)]"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><h2 className="font-extrabold">Обращения по дням</h2><div className="flex gap-5 text-sm"><span className="text-[#526071]">в среднем <b className="text-[#101828]">{average} / день</b></span><span className="text-[#526071]">пик · 24 июля <b className="text-[#101828]">238</b></span></div></div><div className="overflow-x-auto"><div className="relative flex h-56 min-w-[760px] items-end gap-2 border-b border-[#d9e1ec] pb-6">{counts.map((value, index) => { const total = Math.round(value / max * 190); const human = Math.max(5, Math.round(total * (0.14 + ((index * 7) % 11) / 100))); return <div key={`${index}-${value}`} className="group relative flex min-w-2 flex-1 flex-col justify-end" title={`${value} обращений`}><div className="rounded-t bg-[#89aff4]" style={{ height: total - human }} /><div className="bg-[#2463eb]" style={{ height: human }} /></div>;})}<div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#94600b]/60" style={{ bottom: `${24 + average / max * 190}px` }} /></div><div className="mt-2 flex min-w-[760px] justify-between text-xs text-[#64717f]"><span>28 июня</span><span>12 июля</span><span>27 июля</span></div></div></article>;
}

function AnalyticsSkeleton() { return <div className="space-y-4 animate-pulse"><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-32 rounded-lg bg-[#e5eaf1]" />)}</div><div className="h-80 rounded-lg bg-[#e5eaf1]" /><div className="grid gap-4 md:grid-cols-2"><div className="h-64 rounded-lg bg-[#e5eaf1]" /><div className="h-64 rounded-lg bg-[#e5eaf1]" /></div></div>; }

function StateCard({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) { return <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-8 text-center"><RefreshCw className="text-[#2463eb]" /><h2 className="mt-4 text-xl font-extrabold">{title}</h2><p className="mt-2 max-w-md text-sm text-[#526071]">{text}</p>{action && <button type="button" onClick={onAction} className="mt-5 rounded-lg bg-[#2463eb] px-5 py-2.5 text-sm font-semibold text-white">{action}</button>}</div>; }
