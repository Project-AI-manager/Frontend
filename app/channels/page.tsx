"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, RadioTower, Send, Store, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { StateCard } from "@/components/ui/state-card";
import { getApiErrorMessage } from "@/lib/api/errors";
import { axiosInstance } from "@/lib/api/client";
import type { ChannelResponse } from "@/lib/api/generated/ai.schemas";
import { getChannels } from "@/lib/api/generated/channels/channels";

const api = getChannels();
const catalog = [
  { id: "telegram-account", name: "Telegram", account: "Личный аккаунт", mark: "TG", icon: MessageCircle },
  { id: "telegram", name: "Telegram Bot", account: "Бот для обращений", mark: "BOT", icon: Send, connectable: true },
  { id: "vk", name: "VK", account: "Сообщения сообщества", mark: "VK", icon: UsersRound },
  { id: "max", name: "MAX", account: "Диалоги в MAX", mark: "MAX", icon: RadioTower },
  { id: "avito", name: "Avito", account: "Сообщения объявлений", mark: "A", icon: Store },
  { id: "web", name: "Веб-чат", account: "Чат на сайте", mark: "WEB", icon: MessageCircle },
];

/** Подписи шагов авторизации совпадают с подписью активного поля формы. */
const authSteps = [
  { key: "phone", label: "Номер телефона" },
  { key: "code", label: "Код из Telegram" },
  { key: "password", label: "Пароль 2FA" },
] as const;

export default function ChannelsPage() {
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const channels = useQuery({ queryKey: ["channels"], queryFn: () => api.listChannelsApiV1ChannelsGet(), retry: 1 });
  const connect = useMutation({
    mutationFn: () => api.connectChannelApiV1ChannelsPost({ type: "telegram", bot_token: token.trim(), bot_username: username.trim() || undefined, name: "Telegram Bot" }),
    onSuccess: async () => { setMessage("Telegram Bot подключён."); setToken(""); setUsername(""); setEditing(false); await client.invalidateQueries({ queryKey: ["channels"] }); },
    onError: (error) => setMessage(getApiErrorMessage(error, "Не удалось подключить Telegram Bot.")),
  });

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (token.trim().length < 10) { setMessage("Введите корректный токен Telegram-бота."); return; } setMessage(null); connect.mutate(); }

  return (
    <AppShell title="Каналы" description="Подключения, через которые клиенты пишут ассистенту.">
      <div className="relative min-h-[660px] overflow-hidden rounded-lg border border-[#d9e1ec] bg-[#f4f7fb] p-5 shadow-[0_18px_42px_rgba(18,39,76,.09)] soft-grid sm:p-7">
        {channels.isLoading ? <Skeleton /> : channels.error ? <State title="Статусы каналов недоступны" text={getApiErrorMessage(channels.error, "Ошибка запроса.")} action="Повторить" onAction={() => channels.refetch()} /> : channels.data?.length === 0 && !editing ? <State title="Каналы не подключены" text="Подключите Telegram Bot, чтобы принимать обращения." action="Подключить канал" onAction={() => setEditing(true)} /> : <div className="relative grid gap-4 lg:grid-cols-2">
          {catalog.map((item) => {
            const actual = findChannel(channels.data, item.id);
            const connected = actual?.status === "active" || actual?.status === "connected";
            const Icon = item.icon;
            return <article key={item.id} className="rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(18,39,76,.09)] sm:p-5"><div className="flex flex-wrap items-center gap-3 sm:gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#d9e1ec] text-xs font-extrabold text-[#526071]"><Icon size={20} className="sm:hidden" /><span className="hidden sm:inline">{item.mark}</span></span><div className="min-w-[130px] flex-1"><h2 className="font-extrabold">{actual?.name || item.name}</h2><p className="mt-0.5 truncate text-[13px] text-[#64717f]">{channelAccount(actual) || item.account}</p></div><span className={`inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] ${connected ? "bg-[#e8f7f0] text-[#08724b]" : "bg-[#f4f7fb] text-[#526071]"}`}><span className={`size-1.5 rounded-full ${connected ? "bg-[#13a66b]" : "bg-[#98a2b3]"}`} />{connected ? "Подключено" : "Не подключено"}</span>{item.connectable && <button type="button" onClick={() => setEditing((value) => !value)} className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${connected ? "border border-[#d9e1ec] bg-white hover:bg-[#f4f7fb]" : "bg-[#2463eb] text-white shadow-[0_11px_25px_rgba(36,99,235,.2)] hover:bg-[#1546ad]"}`}>{connected ? "Настроить" : "Подключить"}</button>}</div>
              {item.connectable && editing && <form onSubmit={submit} className="mt-4 grid gap-3 border-t border-[#e5eaf1] pt-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Токен Telegram Bot</span><input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="123456:ABC…" className="min-h-11 w-full rounded-lg border border-[#d9e1ec] px-3 text-sm outline-none focus:border-[#2463eb] focus:ring-3 focus:ring-[#eaf1ff]" /></label><label><span className="mb-1 block text-xs font-semibold">Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="@autopilot_bot" className="min-h-11 w-full rounded-lg border border-[#d9e1ec] px-3 text-sm outline-none focus:border-[#2463eb] focus:ring-3 focus:ring-[#eaf1ff]" /></label><button type="submit" disabled={connect.isPending} className="mt-auto min-h-11 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white hover:bg-[#1546ad] disabled:opacity-60">{connect.isPending ? "Подключаем…" : "Сохранить"}</button>{message && <p className={`text-sm sm:col-span-2 ${connect.error ? "text-[#a72f2f]" : "text-[#08724b]"}`}>{message}</p>}</form>}
            </article>;
          })}
        </div>}
      </div>
    </AppShell>
  );
}

function findChannel(channels: ChannelResponse[] | undefined, id: string) { return channels?.find((channel) => channel.type === id || (id === "telegram" && channel.type === "telegram")); }
function channelAccount(channel?: ChannelResponse) { if (!channel) return ""; const username = channel.settings.bot_username; return typeof username === "string" && username ? username : ""; }
function Skeleton() { return <div className="relative grid gap-4 lg:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-lg bg-[#e5eaf1]" />)}</div>; }
function State({ title, text, action, onAction }: { title: string; text: string; action: string; onAction: () => void }) { return <div className="relative flex min-h-72 flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-6 text-center"><h2 className="font-extrabold">{title}</h2><p className="mt-2 max-w-sm text-sm text-[#526071]">{text}</p><button type="button" onClick={onAction} className="mt-4 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-semibold text-white">{action}</button></div>; }
