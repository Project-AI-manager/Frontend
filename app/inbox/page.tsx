"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCheck,
  Loader2,
  Paperclip,
  Search,
  Send,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  ConversationMessageResponse,
  ConversationReplyRequest,
  ConversationResponse,
  ConversationThreadResponse,
} from "@/lib/api/generated/ai.schemas";
import { getConversations } from "@/lib/api/generated/conversations/conversations";

type ConversationView = {
  id: string;
  customerName: string;
  status: string;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  unreadCount: number;
  messages: ConversationMessageResponse[];
};

const conversationsApi = getConversations();

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: () => conversationsApi.listConversationItemsApiV1ConversationsGet(),
    retry: 1,
  });

  const conversations = useMemo(
    () => normalizeConversations(conversationsQuery.data),
    [conversationsQuery.data],
  );
  const visibleConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru");
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.customerName} ${conversation.lastMessagePreview}`
        .toLocaleLowerCase("ru")
        .includes(query),
    );
  }, [conversations, search]);

  const activeConversationId = selectedConversationId ?? conversations[0]?.id ?? null;
  const fallbackConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );

  const threadQuery = useQuery({
    queryKey: ["conversation", activeConversationId],
    queryFn: () =>
      conversationsApi.getConversationApiV1ConversationsConversationIdGet(
        activeConversationId ?? "",
      ),
    enabled: Boolean(activeConversationId),
    retry: 1,
  });

  const thread = normalizeThread(threadQuery.data, fallbackConversation);

  const replyMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!activeConversationId) throw new Error("Диалог не выбран");
      const payload: ConversationReplyRequest = { text };
      return conversationsApi.replyApiV1ConversationsConversationIdReplyPost(
        activeConversationId,
        payload,
      );
    },
    onSuccess: async () => {
      setReplyText("");
      setNotice("Сообщение отправлено");
      await refreshConversationQueries(queryClient, activeConversationId);
    },
    onError: (error) =>
      setNotice(getApiErrorMessage(error, "Не удалось отправить сообщение.")),
  });

  function handleSelect(id: string) {
    setSelectedConversationId(id);
    setNotice(null);
  }

  function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = replyText.trim();
    if (!text) return;
    setNotice(null);
    replyMutation.mutate(text);
  }

  function handleAttachmentClick() {
    fileInputRef.current?.click();
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setNotice(`Файл «${file.name}» выбран. Отправка вложений появится вместе с серверным хранилищем.`);
    }
    event.target.value = "";
  }

  return (
    <AppShell
      title="Диалоги"
      description="Все обращения в одном спокойном рабочем пространстве."
      showTopbar={false}
    >
      <div className="inbox-frame overflow-hidden bg-white">
        <div className="inbox-grid grid lg:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="border-b border-[#d8ddd9] bg-white lg:border-b-0 lg:border-r">
            <div className="px-4 py-4">
              <label className="flex h-10 items-center gap-2 rounded-full bg-[#f0f2f1] px-4 text-[#63716c] focus-within:ring-2 focus-within:ring-[#25a885]/25">
                <Search size={17} strokeWidth={1.8} aria-hidden="true" />
                <span className="sr-only">Поиск диалогов</span>
                <input
                  aria-label="Поиск диалогов"
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#182a24] outline-none placeholder:text-[#7c8985]"
                  placeholder="Поиск"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>

            <div className="border-t border-[#eef0ef]" aria-live="polite">
              {conversationsQuery.isLoading ? (
                <InboxState icon={<Loader2 className="animate-spin" size={20} />} title="Загружаем диалоги" />
              ) : conversationsQuery.error ? (
                <InboxState
                  icon={<AlertCircle size={20} />}
                  title="Не удалось загрузить диалоги"
                  description={getApiErrorMessage(
                    conversationsQuery.error,
                    "Войдите в аккаунт и проверьте подключение к backend.",
                  )}
                />
              ) : visibleConversations.length ? (
                visibleConversations.map((conversation) => {
                  const active = conversation.id === activeConversationId;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleSelect(conversation.id)}
                      className={`relative flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#f5f7f6] ${
                        active ? "bg-[#eef7f3]" : "bg-white"
                      }`}
                    >
                      {active ? <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-[#25a885]" /> : null}
                      <Avatar name={conversation.customerName} />
                      <span className="min-w-0 flex-1 border-b border-[#edf0ee] pb-3">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-semibold text-[#1f2d28]">{conversation.customerName}</span>
                          <time className={`shrink-0 text-[11px] ${conversation.unreadCount ? "font-semibold text-[#159570]" : "text-[#8a9692]"}`}>
                            {formatConversationTime(conversation.lastMessageAt)}
                          </time>
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-xs text-[#6c7975]">
                            {conversation.lastMessagePreview || "Сообщений пока нет"}
                          </span>
                          {conversation.unreadCount > 0 ? (
                            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#25a885] text-[10px] font-bold text-white">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <InboxState title={search ? "Ничего не найдено" : "Диалогов пока нет"} />
              )}
            </div>
          </aside>

          <section
            className="inbox-chat flex min-w-0 flex-col bg-[#efeae2]"
            aria-label={thread ? `Диалог с ${thread.customerName}` : "Область диалога"}
          >
            <header className="flex min-h-16 items-center gap-3 border-b border-[#d8ddd9] bg-[#f7f9f8] px-4 sm:px-5">
              {thread ? (
                <>
                  <Avatar name={thread.customerName} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-[#1d2b26]">{thread.customerName}</h2>
                    <p className="truncate text-xs text-[#71807a]">{conversationStatusLabel(thread.status)}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#71807a]">Выберите диалог</p>
              )}
            </header>

            <div className="chat-wallpaper flex-1 overflow-y-auto px-4 py-6 sm:px-7" aria-live="polite">
              <div className="relative z-[1] flex w-full flex-col gap-2.5">
                {threadQuery.isLoading ? (
                  <InboxState icon={<Loader2 className="animate-spin" size={20} />} title="Загружаем историю" />
                ) : threadQuery.error ? (
                  <InboxState
                    icon={<AlertCircle size={20} />}
                    title="Не удалось загрузить историю"
                    description={getApiErrorMessage(threadQuery.error, "Попробуйте выбрать диалог ещё раз.")}
                  />
                ) : thread?.messages.length ? (
                  <MessageTimeline messages={thread.messages} />
                ) : (
                  <InboxState title="История диалога пуста" />
                )}
              </div>
            </div>

            <form onSubmit={handleReply} className="border-t border-[#d8ddd9] bg-[#f4f6f5] px-3 py-3 sm:px-4">
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  aria-label="Выбрать файл"
                  onChange={handleAttachmentChange}
                />
                <button
                  type="button"
                  aria-label="Прикрепить файл"
                  onClick={handleAttachmentClick}
                  className="grid size-10 shrink-0 place-items-center rounded-full text-[#63716c] hover:bg-[#e5eae7]"
                >
                  <Paperclip size={19} />
                </button>
                <div className="flex min-h-11 flex-1 items-center rounded-[22px] bg-white px-3.5 shadow-sm ring-1 ring-[#e0e5e2]">
                  <label className="sr-only" htmlFor="inbox-reply">Ответ</label>
                  <input
                    id="inbox-reply"
                    aria-label="Ответ"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[#22312c] outline-none placeholder:text-[#84908c] focus-visible:outline-none"
                    placeholder="Написать сообщение"
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    disabled={!activeConversationId || replyMutation.isPending}
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Отправить сообщение"
                  disabled={!activeConversationId || !replyText.trim() || replyMutation.isPending}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-[#1fa681] text-white shadow-sm hover:bg-[#198f70] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {replyMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
              {notice ? <p role="status" className="mx-auto mt-2 max-w-3xl text-center text-xs text-[#53635d]">{notice}</p> : null}
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#d8eee6] text-sm font-semibold text-[#176b55]">
      {getInitials(name)}
    </span>
  );
}

function MessageBubble({ message }: { message: ConversationMessageResponse }) {
  const outgoing = message.direction === "outbound" || message.sender_type === "manager" || message.sender_type === "ai";
  return (
    <div className={outgoing ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[82%] rounded-[18px] px-3.5 py-2.5 text-[13px] leading-5 text-[#26332f] shadow-[0_1px_1px_rgba(25,40,34,.12)] sm:text-sm ${
        outgoing ? "rounded-br-[5px] bg-[#d9fdd3]" : "rounded-bl-[5px] bg-white"
      }`}>
        <p>{message.text || "Пустое сообщение"}</p>
        <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#73817c]">
          <time>{formatMessageTime(message.created_at)}</time>
          {outgoing ? <CheckCheck size={14} className="text-[#2496c7]" aria-label="Отправлено" /> : null}
        </span>
      </div>
    </div>
  );
}

function MessageTimeline({ messages }: { messages: ConversationMessageResponse[] }) {
  let dateKey = "";

  return messages.map((message) => {
    const nextDateKey = getMessageDateKey(message.created_at);
    const showDate = nextDateKey !== dateKey;
    dateKey = nextDateKey;

    return (
      <div key={message.id} className="contents">
        {showDate ? <DateSeparator value={message.created_at} /> : null}
        <MessageBubble message={message} />
      </div>
    );
  });
}

function DateSeparator({ value }: { value: string }) {
  return (
    <div className="flex justify-center py-2">
      <time className="rounded-lg bg-[#e7ede9] px-3 py-1 text-[11px] font-medium text-[#53635d] shadow-sm">
        {formatConversationDay(value)}
      </time>
    </div>
  );
}

function InboxState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="m-4 rounded-2xl bg-white/85 p-5 text-center text-[#53635d] shadow-sm">
      {icon ? <span className="mx-auto grid size-9 place-items-center text-[#16845f]">{icon}</span> : null}
      <p className="font-semibold">{title}</p>
      {description ? <p className="mt-2 text-xs leading-5 text-[#71807a]">{description}</p> : null}
    </div>
  );
}

function normalizeConversations(value: ConversationResponse[] | undefined): ConversationView[] {
  if (!Array.isArray(value)) return [];
  return value.map((conversation) => ({
    id: conversation.id,
    customerName: safeText(conversation.customer_name, "Клиент"),
    status: conversation.status,
    lastMessageAt: conversation.last_message_at,
    lastMessagePreview: safeText(conversation.last_message_preview, ""),
    unreadCount: Number.isFinite(conversation.unread_count) ? conversation.unread_count : 0,
    messages: [],
  }));
}

function normalizeThread(value: ConversationThreadResponse | undefined, fallback?: ConversationView): ConversationView | null {
  if (!value) return fallback ?? null;
  return {
    id: value.id,
    customerName: safeText(value.customer_name, "Клиент"),
    status: value.status,
    lastMessageAt: value.last_message_at,
    lastMessagePreview: safeText(value.last_message_preview, ""),
    unreadCount: Number.isFinite(value.unread_count) ? value.unread_count : 0,
    messages: Array.isArray(value.messages) ? value.messages : [],
  };
}

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toLocaleUpperCase("ru") || "К";
}

function formatConversationTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const today = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat("ru-RU", today ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit" }).format(date);
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function getMessageDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatConversationDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата неизвестна";

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startMessage = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const difference = Math.round((startToday.getTime() - startMessage.getTime()) / 86_400_000);

  if (difference === 0) return "Сегодня";
  if (difference === 1) return "Вчера";

  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function conversationStatusLabel(status: string) {
  if (status === "escalated") return "Передан менеджеру";
  if (status === "closed") return "Диалог закрыт";
  if (status === "auto" || status === "ai_replied") return "Отвечает Автопилот";
  return "Активный диалог";
}

async function refreshConversationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string | null,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    conversationId
      ? queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] })
      : Promise.resolve(),
  ]);
}
