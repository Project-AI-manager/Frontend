"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, MessageCircle, Plus, RefreshCw, Wifi } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getChannels } from "@/lib/api/generated/channels/channels";
import { settingsApi } from "@/lib/api/settings";

const channelsApi = getChannels();

export default function SettingsPage() {
  const aiQuery = useQuery({ queryKey: ["settings-ai"], queryFn: settingsApi.getAiSettings });
  const billingQuery = useQuery({ queryKey: ["settings-billing"], queryFn: settingsApi.getBillingSettings });
  const channelsQuery = useQuery({ queryKey: ["settings-channels"], queryFn: () => channelsApi.listChannelsApiV1ChannelsGet() });

  const loading = aiQuery.isLoading || billingQuery.isLoading || channelsQuery.isLoading;
  const error = aiQuery.error ?? billingQuery.error ?? channelsQuery.error;

  return <AppShell title="Настройки" description="Поведение ассистента, оплата и каналы связи.">
    {loading ? <SettingsSkeleton /> : error || !aiQuery.data || !billingQuery.data ? <StateCard title="Настройки не загрузились" text={getApiErrorMessage(error, "Не удалось получить настройки с сервера.")} onRetry={() => { aiQuery.refetch(); billingQuery.refetch(); channelsQuery.refetch(); }} /> : <SettingsContent ai={aiQuery.data} billing={billingQuery.data} channels={channelsQuery.data ?? []} />}
  </AppShell>;
}

function SettingsContent({ ai, billing, channels }: { ai: Awaited<ReturnType<typeof settingsApi.getAiSettings>>; billing: Awaited<ReturnType<typeof settingsApi.getBillingSettings>>; channels: Awaited<ReturnType<typeof channelsApi.listChannelsApiV1ChannelsGet>> }) {
  const client = useQueryClient();
  const [enabled, setEnabled] = useState(ai.auto_reply_enabled);
  const [threshold, setThreshold] = useState(ai.confidence_threshold);
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: () => settingsApi.updateAiSettings({ auto_reply_enabled: enabled, confidence_threshold: threshold }),
    onSuccess: (data) => { client.setQueryData(["settings-ai"], data); setSaved(true); window.setTimeout(() => setSaved(false), 2200); },
  });

  return <div className="space-y-4">
      <section className="rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
        <h2 className="text-lg font-extrabold">Поведение ассистента</h2><div className="my-5 h-px bg-[#e5eaf1]" />
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-semibold">Отвечать автоматически</p><p className="mt-1 text-sm text-[#64717f]">Ассистент отправит ответ, если достаточно уверен в нём.</p></div><Toggle checked={enabled} onChange={setEnabled} label="Автоматические ответы" /></div>
        <div className="my-5 h-px bg-[#e5eaf1]" />
        <div className="flex flex-wrap items-center justify-between gap-4"><label htmlFor="confidence" className="font-semibold">Порог уверенности для передачи человеку</label><output htmlFor="confidence" className="rounded-md bg-[#eaf1ff] px-3 py-1.5 text-sm font-extrabold text-[#1546ad]">{threshold}%</output></div>
        <input id="confidence" type="range" min="0" max="100" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="mt-5 w-full accent-[#2463eb]" />
        <div className="mt-5 flex items-center justify-end gap-3">{saved && <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0c7a4e]"><Check size={16} /> Сохранено</span>}<button type="button" disabled={save.isPending} onClick={() => save.mutate()} className="min-h-10 rounded-lg bg-[#2463eb] px-5 text-sm font-semibold text-white disabled:opacity-50">{save.isPending ? "Сохраняем…" : "Сохранить"}</button></div>
        {save.isError && <p role="alert" className="mt-3 text-right text-sm text-[#a72f2f]">{getApiErrorMessage(save.error, "Не удалось сохранить настройки.")}</p>}
      </section>

      <section className="rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
        <h2 className="text-lg font-extrabold">Оплата</h2><div className="my-5 h-px bg-[#e5eaf1]" />
        <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end"><div><p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">Баланс</p><p className="mt-2 text-3xl font-extrabold text-[#2463eb]">7 520 ₽</p><p className="mt-1 text-sm text-[#64717f]">Хватит примерно на {new Intl.NumberFormat("ru-RU").format(billing.ai_replies_used ? Math.max(0, 2900 - billing.ai_replies_used) : 2900)} ответов</p></div><div><p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">Расход за июль</p><p className="mt-2 text-2xl font-extrabold">12 480 ₽</p><p className="mt-1 text-sm text-[#0c7a4e]">−14% к июню · {billing.plan_name}</p></div><button type="button" onClick={() => window.alert("Пополнение станет доступно после подключения платёжного провайдера.")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-5 text-sm font-semibold text-white"><CreditCard size={17} /> Пополнить</button></div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eaf1ff]"><div className="h-full bg-[#2463eb]" style={{ width: `${billing.dialogs_limit ? Math.min(100, billing.dialogs_used / billing.dialogs_limit * 100) : 0}%` }} /></div>
      </section>

      <section className="rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-extrabold">Каналы связи</h2><a href="/channels" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#2463eb] px-4 text-sm font-semibold text-[#1546ad]"><Plus size={16} /> Подключить</a></div><div className="my-5 h-px bg-[#e5eaf1]" />
        {channels.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{channels.map((channel) => <article key={channel.id} className="flex items-center gap-3 rounded-lg border border-[#d9e1ec] p-4"><span className="flex size-10 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2463eb]"><MessageCircle size={19} /></span><div className="min-w-0"><p className="truncate font-semibold">{channel.name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-[#0c7a4e]"><Wifi size={13} /> {channel.status === "active" ? "Работает" : channel.status}</p></div></article>)}</div> : <div className="py-8 text-center text-sm text-[#64717f]">Каналы пока не подключены.</div>}
      </section>
    </div>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`flex h-[26px] w-11 items-center rounded-full p-[3px] transition ${checked ? "justify-end bg-[#2463eb]" : "justify-start bg-[#d9e1ec]"}`}><span className="size-5 rounded-full bg-white shadow-sm" /></button>; }
function SettingsSkeleton() { return <div className="space-y-4 animate-pulse">{[220, 190, 190].map((height) => <div key={height} className="rounded-lg bg-[#e5eaf1]" style={{ height }} />)}</div>; }
function StateCard({ title, text, onRetry }: { title: string; text: string; onRetry: () => void }) { return <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-8 text-center"><RefreshCw className="text-[#2463eb]" /><h2 className="mt-4 text-xl font-extrabold">{title}</h2><p className="mt-2 max-w-md text-sm text-[#526071]">{text}</p><button type="button" onClick={onRetry} className="mt-5 rounded-lg bg-[#2463eb] px-5 py-2.5 text-sm font-semibold text-white">Повторить</button></div>; }
