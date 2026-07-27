"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Paperclip, Search, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ConversationResponse } from "@/lib/api/generated/ai.schemas";
import { getConversations } from "@/lib/api/generated/conversations/conversations";

const api = getConversations();
const filters = ["Все", "Нужен человек", "Отвечено", "Закрытые"];

export default function InboxPage() {
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Все");
  const [reply, setReply] = useState("");

  const list = useQuery({ queryKey: ["conversations"], queryFn: () => api.listConversationItemsApiV1ConversationsGet(), retry: 1 });
  const effectiveSelectedId = selectedId ?? list.data?.[0]?.id ?? null;
  const thread = useQuery({
    queryKey: ["conversation", effectiveSelectedId],
    queryFn: () => api.getConversationApiV1ConversationsConversationIdGet(effectiveSelectedId!),
    enabled: Boolean(effectiveSelectedId),
    retry: 1,
  });
  const send = useMutation({
    mutationFn: (text: string) => api.replyApiV1ConversationsConversationIdReplyPost(effectiveSelectedId!, { text }),
    onSuccess: async () => {
      setReply("");
      await Promise.all([client.invalidateQueries({ queryKey: ["conversation", effectiveSelectedId] }), client.invalidateQueries({ queryKey: ["conversations"] })]);
    },
  });
  const escalate = useMutation({
    mutationFn: () => api.escalateApiV1ConversationsConversationIdEscalatePost(effectiveSelectedId!),
    onSuccess: async () => Promise.all([client.invalidateQueries({ queryKey: ["conversation", effectiveSelectedId] }), client.invalidateQueries({ queryKey: ["conversations"] })]),
  });

  const conversations = useMemo(() => (list.data ?? []).filter((item) => {
    const matchesSearch = `${item.customer_name} ${item.last_message_preview}`.toLowerCase().includes(search.toLowerCase());
    const status = item.status.toLowerCase();
    const matchesFilter = filter === "Все" || (filter === "Нужен человек" && status.includes("escalat")) || (filter === "Отвечено" && status.includes("answer")) || (filter === "Закрытые" && status.includes("clos"));
    return matchesSearch && matchesFilter;
  }), [filter, list.data, search]);

  return (
    <AppShell title="Диалоги" description="Все обращения клиентов в одном окне.">
      <div className="overflow-hidden rounded-lg border border-[#d9e1ec] bg-white shadow-[0_18px_42px_rgba(18,39,76,.09)] xl:h-[760px]">
        <div className="grid min-h-[720px] xl:h-full xl:grid-cols-[392px_minmax(0,1fr)]">
          <section className="flex min-h-0 flex-col border-b border-[#d9e1ec] bg-white xl:border-r xl:border-b-0">
            <div className="flex h-[65px] shrink-0 items-center border-b border-[#d9e1ec] px-4">
              <label className="flex min-h-10 flex-1 items-center gap-2.5 rounded-full border border-[#d9e1ec] bg-[#f8fbff] px-4 focus-within:border-[#2463eb] focus-within:ring-3 focus-within:ring-[#eaf1ff]">
                <Search size={16} className="text-[#64717f]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по диалогам" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </label>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-[#e5eaf1] px-4 py-2.5">
              {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${filter === item ? "bg-[#eaf1ff] text-[#1546ad]" : "text-[#526071] hover:bg-[#f4f7fb]"}`}>{item}</button>)}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {list.isLoading ? <ListSkeleton /> : list.error ? <State title="Список диалогов не загрузился" text={getApiErrorMessage(list.error, "Ошибка запроса к серверу.")} action="Повторить" onAction={() => list.refetch()} /> : conversations.length === 0 ? <State title="У вас ещё нет ни одного чата" /> : conversations.map((item) => <ConversationItem key={item.id} item={item} active={item.id === effectiveSelectedId} onClick={() => setSelectedId(item.id)} />)}
            </div>
          </section>

          <section className="relative flex min-h-[620px] min-w-0 flex-col bg-[#f4f7fb] soft-grid">
            {!effectiveSelectedId ? <State title="Выберите диалог" text="Переписка откроется здесь." /> : thread.isLoading ? <div className="grid flex-1 place-items-center"><Loader2 className="animate-spin text-[#2463eb]" /></div> : thread.error ? <State title="Диалог не загрузился" text={getApiErrorMessage(thread.error, "Попробуйте ещё раз.")} action="Повторить" onAction={() => thread.refetch()} /> : thread.data ? <>
              <header className="relative flex min-h-[65px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#d9e1ec] bg-white px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-[#eaf1ff] text-xs font-extrabold text-[#1546ad]">{initials(thread.data.customer_name)}</span><div><h2 className="text-sm font-semibold">{thread.data.customer_name}</h2><p className="text-xs text-[#64717f]">{statusLabel(thread.data.status)} · {thread.data.channel_id}</p></div></div>
                <button type="button" onClick={() => escalate.mutate()} disabled={escalate.isPending} className="min-h-10 rounded-lg border border-[#d9e1ec] bg-white px-3.5 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-50">{escalate.isPending ? "Передаём…" : "Закрыть диалог"}</button>
              </header>
              <div className="relative flex-1 space-y-4 overflow-y-auto p-6 sm:p-8">
                <p className="text-center text-xs font-semibold text-[#64717f]">Сегодня</p>
                {thread.data.messages.map((message) => {
                  const outgoing = message.direction === "outbound" || message.sender_type === "manager" || message.sender_type === "ai";
                  return <div key={message.id} className={`flex ${outgoing ? "justify-start" : "justify-end"}`}><div className={`max-w-[84%] rounded-lg border px-4 py-3 text-sm leading-relaxed shadow-[0_10px_22px_rgba(18,39,76,.07)] ${outgoing ? "border-[#d9e1ec] bg-white" : "border-[#2463eb] bg-[#2463eb] text-white"}`}><p>{message.text}</p><p className={`mt-1.5 text-right text-[11px] ${outgoing ? "text-[#64717f]" : "text-white/75"}`}>{time(message.created_at)}</p></div></div>;
                })}
              </div>
              <form onSubmit={(event) => { event.preventDefault(); if (reply.trim()) send.mutate(reply.trim()); }} className="relative m-4 flex items-end gap-2 rounded-lg border border-[#d9e1ec] bg-white p-2 shadow-[0_10px_22px_rgba(18,39,76,.07)] sm:m-6">
                <button type="button" aria-label="Прикрепить файл" className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#64717f] hover:bg-[#eaf1ff]"><Paperclip size={19} /></button>
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Введите сообщение" rows={1} className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none" />
                <button type="submit" aria-label="Отправить" disabled={!reply.trim() || send.isPending} className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#2463eb] hover:bg-[#eaf1ff] disabled:opacity-40">{send.isPending ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}</button>
              </form>
            </> : null}
            {(send.error || escalate.error) && <p className="absolute right-6 bottom-20 rounded-lg bg-[#fdeded] px-3 py-2 text-xs text-[#a72f2f]">{getApiErrorMessage(send.error ?? escalate.error, "Не удалось выполнить действие.")}</p>}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function ConversationItem({ item, active, onClick }: { item: ConversationResponse; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`block w-full border-b border-[#e5eaf1] px-4 py-3.5 text-left transition hover:bg-[#f8fbff] ${active ? "bg-[#f8fbff]" : ""}`}><div className="flex items-center gap-2"><span className={`size-2 shrink-0 rounded-full ${item.unread_count ? "bg-[#2463eb]" : "bg-[#13a66b]"}`} /><span className="min-w-0 truncate text-sm font-semibold">{item.customer_name}</span><span className="ml-auto shrink-0 text-xs tabular-nums text-[#64717f]">{time(item.last_message_at)}</span></div><p className="mt-1.5 truncate text-[13px] text-[#526071]">{item.last_message_preview || "Новый диалог"}</p><div className="mt-1.5 flex gap-1.5"><span className="rounded-[5px] bg-[#fff2df] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#b86500]">{statusLabel(item.status)}</span><span className="rounded-[5px] bg-[#f4f7fb] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#526071]">Канал</span></div></button>;
}

function ListSkeleton() { return <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-[#e5eaf1]" />)}</div>; }
function State({ title, text, action, onAction }: { title: string; text?: string; action?: string; onAction?: () => void }) { return <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><h3 className="font-extrabold">{title}</h3>{text && <p className="mt-2 max-w-sm text-sm text-[#526071]">{text}</p>}{action && <button type="button" onClick={onAction} className="mt-4 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-semibold text-white">{action}</button>}</div>; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function time(value: string | null) { return value ? new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : ""; }
function statusLabel(status: string) { const value = status.toLowerCase(); if (value.includes("escalat")) return "Нужен человек"; if (value.includes("clos")) return "Закрыт"; if (value.includes("answer")) return "Отвечено"; return status || "Новый"; }
