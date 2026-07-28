"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Loader2, Plus, Search, Send, WandSparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { markConversationRead } from "@/lib/api/conversations";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ConversationMessageResponse, ConversationResponse } from "@/lib/api/generated/ai.schemas";
import { getConversations } from "@/lib/api/generated/conversations/conversations";
import { getUsers } from "@/lib/api/generated/users/users";

const api = getConversations();
const usersApi = getUsers();
const filters = ["Все", "Нужен человек", "Отвечено", "Закрытые"];

export default function InboxPage() {
  return (
    <Suspense fallback={<AppShell title="Диалоги" description="Все обращения клиентов в одном месте"><State title="Загружаем диалоги…" /></AppShell>}>
      <InboxContent />
    </Suspense>
  );
}

function InboxContent() {
  const client = useQueryClient();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("conversation"));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Все");
  const [reply, setReply] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const readAttempts = useRef(new Set<string>());

  const list = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.listConversationItemsApiV1ConversationsGet(),
    retry: 1,
    refetchInterval: 4_000,
    refetchIntervalInBackground: false,
  });
  const currentUser = useQuery({ queryKey: ["profile-user"], queryFn: usersApi.meApiV1UsersMeGet, retry: 1 });
  const effectiveSelectedId = selectedId ?? list.data?.[0]?.id ?? null;
  const thread = useQuery({
    queryKey: ["conversation", effectiveSelectedId],
    queryFn: () => api.getConversationApiV1ConversationsConversationIdGet(effectiveSelectedId!),
    enabled: Boolean(effectiveSelectedId),
    retry: 1,
    refetchInterval: 4_000,
    refetchIntervalInBackground: false,
  });
  const selectedConversation = list.data?.find((item) => item.id === effectiveSelectedId);
  const markRead = useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onMutate: async (conversationId) => {
      await Promise.all([
        client.cancelQueries({ queryKey: ["conversations"] }),
        client.cancelQueries({ queryKey: ["conversation", conversationId] }),
      ]);
      client.setQueryData<ConversationResponse[]>(["conversations"], (current) =>
        current?.map((item) =>
          item.id === conversationId ? { ...item, unread_count: 0 } : item,
        ),
      );
      client.setQueryData(["conversation", conversationId], (current: unknown) =>
        current && typeof current === "object" ? { ...current, unread_count: 0 } : current,
      );
    },
    onSuccess: (_conversation, conversationId) => {
      client.setQueryData(["conversation", conversationId], (current: unknown) =>
        current && typeof current === "object" ? { ...current, unread_count: 0 } : current,
      );
      client.setQueryData<ConversationResponse[]>(["conversations"], (current) =>
        current?.map((item) =>
          item.id === conversationId ? { ...item, unread_count: 0 } : item,
        ),
      );
    },
  });
  const markReadConversation = markRead.mutate;

  useEffect(() => {
    const readKey = effectiveSelectedId && selectedConversation
      ? `${effectiveSelectedId}:${selectedConversation.last_message_at}:${selectedConversation.unread_count}`
      : null;
    if (
      effectiveSelectedId &&
      readKey &&
      (selectedConversation?.unread_count ?? 0) > 0 &&
      !readAttempts.current.has(readKey)
    ) {
      readAttempts.current.add(readKey);
      markReadConversation(effectiveSelectedId);
    }
  }, [effectiveSelectedId, markReadConversation, selectedConversation]);
  const send = useMutation({
    mutationFn: (text: string) => api.replyApiV1ConversationsConversationIdReplyPost(effectiveSelectedId!, { text }),
    onSuccess: async () => {
      setReply("");
      setActionMessage(null);
      await Promise.all([client.invalidateQueries({ queryKey: ["conversation", effectiveSelectedId] }), client.invalidateQueries({ queryKey: ["conversations"] })]);
    },
    onError: (error) => setActionMessage(getApiErrorMessage(error, "Не удалось отправить ответ.")),
  });
  const close = useMutation({
    mutationFn: () => api.closeApiV1ConversationsConversationIdClosePost(effectiveSelectedId!),
    onSuccess: async () => {
      setActionMessage("Диалог закрыт.");
      await Promise.all([client.invalidateQueries({ queryKey: ["conversation", effectiveSelectedId] }), client.invalidateQueries({ queryKey: ["conversations"] })]);
    },
    onError: (error) => setActionMessage(getApiErrorMessage(error, "Не удалось закрыть диалог.")),
  });

  const conversations = useMemo(() => (list.data ?? []).filter((item) => {
    const matchesSearch = `${item.customer_name} ${item.last_message_preview}`.toLowerCase().includes(search.toLowerCase());
    const status = item.status.toLowerCase();
    const matchesFilter = filter === "Все" || (filter === "Нужен человек" && needsHuman(status)) || (filter === "Отвечено" && isAnswered(status)) || (filter === "Закрытые" && status.includes("clos"));
    return matchesSearch && matchesFilter;
  }), [filter, list.data, search]);

  return (
    <AppShell title="Диалоги" description="Все обращения клиентов в одном окне." immersive>
      <div className="grid h-full min-h-0 lg:grid-cols-[392px_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col border-r border-[#d9e1ec] bg-white">
          <div className="flex h-[65px] shrink-0 items-center border-b border-[#d9e1ec] px-4">
            <label className="flex min-h-10 flex-1 items-center gap-2.5 rounded-full border border-[#d9e1ec] bg-[#f8fbff] px-4 focus-within:border-[#2463eb] focus-within:ring-3 focus-within:ring-[#eaf1ff]">
              <Search size={16} className="text-[#64717f]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по диалогам" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
          </div>
          <div className="grid grid-cols-4 items-center gap-0.5 overflow-hidden border-b border-[#e5eaf1] px-3 py-2.5">
            {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`inbox-filter-button min-w-0 whitespace-nowrap rounded-full px-1.5 py-1.5 ${filter === item ? "bg-[#eaf1ff] font-semibold text-[#1546ad]" : "font-medium text-[#526071] hover:bg-[#f4f7fb] hover:text-[#101828]"}`}>{item}</button>)}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.isLoading ? <ListSkeleton /> : list.error ? <State title="Список диалогов не загрузился" text={getApiErrorMessage(list.error, "Ошибка запроса к серверу.")} action="Повторить" onAction={() => list.refetch()} /> : (list.data ?? []).length === 0 ? <EmptyChatsState /> : conversations.length === 0 ? <State title="Ничего не найдено" text="Попробуйте изменить поиск или фильтр." /> : conversations.map((item) => <ConversationItem key={item.id} item={item} active={item.id === effectiveSelectedId} onClick={() => { setSelectedId(item.id); setReply(""); setActionMessage(null); }} />)}
          </div>
        </section>

        <section className="relative hidden min-h-0 min-w-0 flex-col overflow-hidden lg:flex">
          {!effectiveSelectedId ? <State title="Выберите диалог" text="Переписка откроется здесь." /> : thread.isLoading ? <div className="relative grid flex-1 place-items-center"><Loader2 className="animate-spin text-[#2463eb]" /></div> : thread.error ? <State title="Диалог не загрузился" text={getApiErrorMessage(thread.error, "Попробуйте ещё раз.")} action="Повторить" onAction={() => thread.refetch()} /> : thread.data ? <>
            <header className="relative flex h-[65px] shrink-0 items-center justify-between gap-4 border-b border-[#d9e1ec] bg-white px-6">
              <div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eaf1ff] font-heading text-sm font-extrabold text-[#1546ad]">{initials(thread.data.customer_name)}</span><h2 className="truncate font-heading text-base font-extrabold tracking-[-0.02em]">{thread.data.customer_name}</h2></div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={thread.data.status} />
                {isClosed(thread.data.status) ? <span className="rounded-lg bg-[#e5eaf1] px-3.5 py-2.5 text-sm font-semibold text-[#526071]">Диалог закрыт</span> : <button type="button" onClick={() => { setActionMessage(null); close.mutate(); }} disabled={close.isPending || send.isPending} className="min-h-10 rounded-lg border border-[#d9e1ec] bg-white px-3.5 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-50">{close.isPending ? "Закрываем…" : "Закрыть диалог"}</button>}
              </div>
            </header>
            <div className="relative flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-8 py-6">
              <p className="self-center rounded-full border border-[#e5eaf1] bg-white px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">Сегодня</p>
              {thread.data.messages.map((message) => <MessageBubble key={message.id} message={message} currentUserId={currentUser.data?.id} />)}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); const text = reply.trim(); if (!text || isClosed(thread.data.status)) return; setActionMessage(null); send.mutate(text); }} className="relative flex shrink-0 items-center px-6 pb-[18px] pt-3.5">
              <div className="flex min-h-[52px] flex-1 items-center gap-1.5 rounded-full border border-[#d9e1ec] bg-white px-1.5 shadow-[0_10px_22px_rgba(18,39,76,.07)] focus-within:border-[#2463eb] focus-within:ring-3 focus-within:ring-[#eaf1ff]">
                <button type="button" aria-label="Прикрепить файл" title="Прикрепление файлов скоро появится" disabled className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#64717f] disabled:opacity-40"><Plus size={22} /></button>
                <textarea aria-label="Ответ клиенту" value={reply} onChange={(event) => setReply(event.target.value)} placeholder={isClosed(thread.data.status) ? "Диалог закрыт" : "Введите сообщение"} rows={1} disabled={isClosed(thread.data.status) || send.isPending || close.isPending} className="inbox-composer-input max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60" />
                <button type="submit" aria-label="Отправить ответ" disabled={!reply.trim() || isClosed(thread.data.status) || send.isPending || close.isPending} className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#2463eb] hover:bg-[#eaf1ff] disabled:opacity-40">{send.isPending ? <Loader2 size={19} className="animate-spin" /> : <Send size={21} />}</button>
              </div>
            </form>
          </> : null}
          {actionMessage && <p role="status" className={`absolute right-6 bottom-20 z-10 rounded-lg px-3 py-2 text-xs ${send.error || close.error ? "bg-[#fdeded] text-[#a72f2f]" : "bg-[#e8f7ef] text-[#16734a]"}`}>{actionMessage}</p>}
        </section>
      </div>
    </AppShell>
  );
}

function MessageBubble({ message, currentUserId }: { message: ConversationMessageResponse; currentUserId?: string }) {
  const isCurrentUser = message.sender_type === "manager" && Boolean(currentUserId) && message.sender_user_id === currentUserId;
  const outgoing = message.direction === "outbound" || message.sender_type === "manager" || message.sender_type === "ai";
  if (isCurrentUser) {
    return (
      <article className="w-full max-w-[560px] self-end rounded-[14px_14px_4px_14px] border border-[#cddfff] bg-[#eaf1ff] px-4 py-3.5 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
        <p className="text-sm leading-[1.6] text-[#101828]">{message.text}</p>
        <p className="mt-2 text-right text-xs tabular-nums text-[#64717f]">{time(message.created_at)}</p>
      </article>
    );
  }
  const isAutopilot = message.sender_type === "ai";

  return outgoing ? (
    <article className="w-full max-w-[560px] self-end rounded-[14px_14px_4px_14px] border border-[#cddfff] bg-[#eaf1ff] px-4 py-3.5 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#1546ad]">
        {isAutopilot ? <WandSparkles size={14} strokeWidth={1.75} aria-hidden="true" /> : null}
        {isAutopilot ? "Автопилот" : "Менеджер"}
      </div>
      <p className="text-sm leading-[1.6] text-[#101828]">{message.text}</p>
      <p className="mt-2 text-right text-xs tabular-nums text-[#64717f]">{time(message.created_at)}</p>
    </article>
  ) : (
    <article className="w-full max-w-[560px] self-start rounded-[14px_14px_14px_4px] border border-[#e5eaf1] bg-white px-4 py-3.5 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <p className="text-sm leading-[1.6] text-[#101828]">{message.text}</p>
      <p className="mt-2 text-right text-xs tabular-nums text-[#64717f]">{time(message.created_at)}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (needsHuman(status)) return <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#fff5df] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#94600b]"><span className="size-1.5 rounded-full bg-[#e89120]" />Нужен человек</span>;
  return <span className={`rounded-[5px] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[.08em] ${statusTone(status)}`}>{statusLabel(status)}</span>;
}

function ConversationItem({ item, active, onClick }: { item: ConversationResponse; active: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`block w-full border-b border-[#e5eaf1] px-4 py-3.5 text-left transition hover:bg-[#f8fbff] ${active ? "bg-[#f8fbff]" : ""}`}><div className="flex items-center gap-2"><span className={`size-2 shrink-0 rounded-full ${statusDot(item.status)}`} /><span className="min-w-0 truncate text-sm font-semibold">{item.customer_name}</span><span className="ml-auto flex shrink-0 flex-col items-center gap-1 text-xs tabular-nums text-[#64717f]"><span>{time(item.last_message_at)}</span>{item.unread_count > 0 ? <span aria-label="Непрочитанный диалог" className="size-1.5 rounded-full bg-[#2463eb]" /> : null}</span></div><p className="mt-1.5 truncate text-[13px] leading-5 text-[#526071]">{item.last_message_preview || "Новый диалог"}</p><div className="mt-1.5 flex gap-1.5"><span className={`rounded-[5px] px-[7px] py-0.5 text-[11px] font-bold uppercase tracking-[.04em] ${statusTone(item.status)}`}>{statusLabel(item.status)}</span><span className="rounded-[5px] bg-[#f4f7fb] px-[7px] py-0.5 text-[11px] font-bold uppercase tracking-[.04em] text-[#526071]">{channelLabel(item.channel_type)}</span></div></button>;
}

function ListSkeleton() { return <div className="space-y-3 p-4">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-[84px] animate-pulse rounded-lg bg-[#e5eaf1]" />)}</div>; }
function EmptyChatsState() { return <div className="m-4 flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-[#f8fbff] px-8 py-14 text-center"><span className="flex size-12 items-center justify-center rounded-full border border-[#d9e1ec] bg-white text-[#2463eb]"><Inbox size={22} strokeWidth={1.75} /></span><h3 className="mt-3 font-heading text-base font-extrabold tracking-[-0.02em] text-[#101828]">У вас ещё нет ни одного чата</h3><p className="mt-2 max-w-[280px] text-sm leading-[1.6] text-[#526071]">Новые обращения появятся здесь после подключения канала.</p></div>; }
function State({ title, text, action, onAction }: { title: string; text?: string; action?: string; onAction?: () => void }) { return <div className="relative flex min-h-64 flex-1 flex-col items-center justify-center px-6 text-center"><h3 className="font-extrabold">{title}</h3>{text && <p className="mt-2 max-w-sm text-sm text-[#526071]">{text}</p>}{action && <button type="button" onClick={onAction} className="mt-4 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-semibold text-white">{action}</button>}</div>; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function time(value: string | null) { return value ? new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : ""; }
function isClosed(status: string) { return status.toLowerCase().includes("clos"); }
function isAnswered(status: string) { const value = status.toLowerCase(); return value === "auto" || value.includes("answer") || value.includes("replied") || value.includes("ai_replied"); }
function needsHuman(status: string) { const value = status.toLowerCase(); return value === "open" || value.includes("escalat"); }
function statusDot(status: string) { if (isClosed(status)) return "bg-[#d9e1ec]"; if (needsHuman(status)) return "bg-[#e89120]"; return "bg-[#13a66b]"; }
function statusTone(status: string) { if (isClosed(status)) return "bg-[#f4f7fb] text-[#526071]"; if (needsHuman(status)) return "bg-[#fff5df] text-[#94600b]"; if (isAnswered(status)) return "bg-[#e6f7f0] text-[#0c7a4e]"; return "bg-[#f4f7fb] text-[#526071]"; }
function channelLabel(channel: string) { const value = channel.toLowerCase(); if (value.includes("telegram")) return "Telegram"; if (value.includes("whatsapp")) return "WhatsApp"; if (value.includes("avito")) return "Avito"; if (value === "vk" || value.includes("vkontakte")) return "VK"; if (value.includes("instagram")) return "Instagram"; return channel || "Канал"; }
function statusLabel(status: string) { const value = status.toLowerCase(); if (needsHuman(value)) return "Нужен человек"; if (isClosed(value)) return "Закрыт"; if (isAnswered(value)) return "Отвечено"; return status || "Нужен человек"; }
