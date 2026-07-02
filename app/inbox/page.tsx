"use client";

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  ConversationMessageResponse,
  ConversationReplyRequest,
  ConversationResponse,
  ConversationThreadResponse,
} from "@/lib/api/generated/ai.schemas";
import { getConversations } from "@/lib/api/generated/conversations/conversations";

type ConversationStatus = "open" | "ai_replied" | "escalated" | "closed" | "unknown";
type MessageDirection = "inbound" | "outbound" | "internal" | "unknown";
type ConversationView = {
  id: string;
  channelId: string;
  customerId: string;
  customerName: string;
  status: ConversationStatus;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  unreadCount: number;
  messages: ConversationMessageResponse[];
};

const conversationsApi = getConversations();

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const {
    data: conversationsData,
    isLoading: isConversationsLoading,
    isFetching: isConversationsFetching,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => conversationsApi.listConversationItemsApiV1ConversationsGet(),
    retry: 1,
  });

  const conversations = useMemo(() => normalizeConversations(conversationsData), [conversationsData]);

  const activeConversationId = selectedConversationId ?? conversations[0]?.id ?? null;
  const selectedConversation = conversations.find((conversation) => conversation.id === activeConversationId);

  const {
    data: threadData,
    isLoading: isThreadLoading,
    isFetching: isThreadFetching,
    error: threadError,
    refetch: refetchThread,
  } = useQuery({
    queryKey: ["conversation", activeConversationId],
    queryFn: () => conversationsApi.getConversationApiV1ConversationsConversationIdGet(activeConversationId ?? ""),
    enabled: Boolean(activeConversationId),
    retry: 1,
  });

  const thread = normalizeThread(threadData, selectedConversation);
  const messages = thread?.messages ?? [];

  const replyMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!activeConversationId) {
        throw new Error("Диалог не выбран");
      }

      const payload: ConversationReplyRequest = { text };

      return conversationsApi.replyApiV1ConversationsConversationIdReplyPost(
        activeConversationId,
        payload,
      );
    },
    onSuccess: async () => {
      setReplyText("");
      setActionMessage("Ответ отправлен. Диалог обновлён.");
      await refetchAfterAction(queryClient, activeConversationId);
    },
    onError: (error) => {
      setActionMessage(getApiErrorMessage(error, "Не удалось отправить ответ. Проверь доступность backend."));
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async () => {
      if (!activeConversationId) {
        throw new Error("Диалог не выбран");
      }

      return conversationsApi.escalateApiV1ConversationsConversationIdEscalatePost(activeConversationId);
    },
    onSuccess: async () => {
      setActionMessage("Диалог передан менеджеру и обновлён.");
      await refetchAfterAction(queryClient, activeConversationId);
    },
    onError: (error) => {
      setActionMessage(getApiErrorMessage(error, "Не удалось эскалировать диалог. Попробуй ещё раз."));
    },
  });

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage(null);

    const trimmedText = replyText.trim();

    if (!trimmedText) {
      setActionMessage("Напиши текст ответа перед отправкой.");
      return;
    }

    replyMutation.mutate(trimmedText);
  }

  async function handleRefresh() {
    setActionMessage(null);
    await Promise.all([refetchConversations(), activeConversationId ? refetchThread() : Promise.resolve()]);
  }

  const isActionPending = replyMutation.isPending || escalateMutation.isPending;

  return (
    <AppShell
      title="Диалоги"
      description="Единая лента обращений: живые сообщения из API, быстрый ответ и эскалация в одном рабочем окне."
    >
      <div className="grid gap-5 xl:grid-cols-[360px_1fr_320px]">
        <section className="glass-card rounded-[1.75rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Входящие</h2>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {conversations.length} всего
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {isConversationsFetching || isThreadFetching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Обновить
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {isConversationsLoading ? (
              <StateCard icon={<Loader2 className="animate-spin" size={18} />} title="Загружаем диалоги" />
            ) : conversationsError ? (
              <StateCard
                icon={<AlertCircle size={18} />}
                title="Не удалось загрузить диалоги"
                description={getApiErrorMessage(conversationsError, "Проверь авторизацию и доступность backend.")}
                tone="error"
              />
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setSelectedConversationId(conversation.id);
                    setActionMessage(null);
                  }}
                  className={`w-full rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    conversation.id === activeConversationId
                      ? "border-orange-300 bg-orange-50"
                      : "border-black/10 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-black">{conversation.customerName}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-600">
                        {conversation.lastMessagePreview || "Сообщений пока нет"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {formatNullableDate(conversation.lastMessageAt, "нет даты")}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusPill status={conversation.status} />
                    {conversation.unreadCount > 0 ? (
                      <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">
                        {conversation.unreadCount} новых
                      </span>
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <StateCard
                icon={<MessageCircle size={20} />}
                title="Диалогов пока нет"
                description="Когда backend получит входящее сообщение, оно появится в этой ленте."
              />
            )}
          </div>
        </section>

        <section className="glass-card overflow-hidden rounded-[1.75rem]">
          <div className="border-b border-black/10 bg-white/70 p-5">
            {thread ? (
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-black">{thread.customerName}</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    ID клиента: {thread.customerId} · канал: {thread.channelId}
                  </p>
                </div>
                <StatusPill status={thread.status} />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-black">Диалог не выбран</h2>
                <p className="mt-1 text-sm text-neutral-500">Выбери обращение слева, чтобы открыть историю.</p>
              </div>
            )}
          </div>

          <div className="min-h-[360px] space-y-4 p-5">
            {isThreadLoading ? (
              <StateCard icon={<Loader2 className="animate-spin" size={18} />} title="Загружаем историю" />
            ) : threadError ? (
              <StateCard
                icon={<AlertCircle size={18} />}
                title="Не удалось загрузить диалог"
                description={getApiErrorMessage(threadError, "Попробуй обновить страницу или выбрать другой диалог.")}
                tone="error"
              />
            ) : !activeConversationId ? (
              <StateCard
                icon={<MessageCircle size={20} />}
                title="Нет выбранного диалога"
                description="Список обращений пуст или ещё загружается."
              />
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            ) : (
              <StateCard
                icon={<MessageCircle size={20} />}
                title="История пуста"
                description="В этом диалоге пока нет сообщений."
              />
            )}
          </div>

          <div className="border-t border-black/10 bg-white/70 p-5">
            <form onSubmit={handleReplySubmit} className="rounded-3xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-orange-700">
                <Sparkles size={16} />
                Быстрый ответ
              </div>
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Напиши ответ клиенту..."
                disabled={!activeConversationId || isActionPending}
                className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-400 focus:border-orange-400 disabled:cursor-not-allowed disabled:opacity-70"
              />
              {actionMessage ? (
                <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-semibold text-neutral-700">
                  {actionMessage}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={!activeConversationId || isActionPending}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {replyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Отправить
                </button>
                <button
                  type="button"
                  onClick={() => escalateMutation.mutate()}
                  disabled={!activeConversationId || isActionPending}
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {escalateMutation.isPending ? "Передаём..." : "Эскалировать"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-5">
            <h2 className="font-black">Контекст клиента</h2>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Клиент" value={thread?.customerName ?? "не выбран"} />
              <InfoRow label="Статус" value={statusLabel(thread?.status ?? "unknown")} />
              <InfoRow label="Непрочитано" value={String(thread?.unreadCount ?? 0)} />
              <InfoRow label="Последнее сообщение" value={formatNullableDate(thread?.lastMessageAt, "нет даты")} />
            </div>
          </div>

          <div className="glass-card rounded-[1.75rem] p-5">
            <h2 className="font-black">Сигналы AI</h2>
            <div className="mt-4 space-y-3">
              <Signal icon={<CheckCircle2 size={16} />} title={thread ? "История синхронизирована" : "Ожидаем выбор диалога"} />
              <Signal icon={<Bot size={16} />} title={aiSignal(messages)} />
              <Signal icon={<Clock size={16} />} title={`Обновлено: ${formatNullableDate(thread?.lastMessageAt, "нет даты")}`} />
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function MessageBubble({ message }: { message: ConversationMessageResponse }) {
  const direction = normalizeDirection(message.direction, message.sender_type);
  const isOutbound = direction === "outbound";
  const isInternal = direction === "internal";

  return (
    <div className={isOutbound ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isOutbound
            ? "max-w-[78%] rounded-[1.5rem] bg-black px-5 py-3 text-sm leading-6 text-white"
            : isInternal
              ? "max-w-[78%] rounded-[1.5rem] bg-indigo-50 px-5 py-3 text-sm leading-6 text-indigo-900 shadow-sm"
              : "max-w-[78%] rounded-[1.5rem] bg-white px-5 py-3 text-sm leading-6 shadow-sm"
        }
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-black opacity-70">
          {isOutbound ? <Bot size={13} /> : <UserRound size={13} />}
          {directionLabel(direction, message.sender_type)}
          <span>·</span>
          <span>{formatNullableDate(message.created_at, "нет даты")}</span>
        </div>
        <p>{message.text || "Пустое сообщение"}</p>
        <p className="mt-2 text-xs font-semibold opacity-60">{messageStatusLabel(message.status)}</p>
      </div>
    </div>
  );
}

function Signal({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-semibold shadow-sm">
      <span className="text-orange-500">{icon}</span>
      {title}
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      className={`rounded-3xl border p-5 text-center ${
        tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-black/10 bg-white text-neutral-600"
      }`}
    >
      <div className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-white shadow-sm">{icon}</div>
      <p className="mt-3 font-black">{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 opacity-75">{description}</p> : null}
    </div>
  );
}

function StatusPill({ status }: { status: ConversationStatus }) {
  const className =
    status === "open"
      ? "bg-orange-100 text-orange-700"
      : status === "ai_replied"
        ? "bg-emerald-100 text-emerald-700"
        : status === "escalated"
          ? "bg-indigo-100 text-indigo-700"
          : status === "closed"
            ? "bg-neutral-200 text-neutral-700"
            : "bg-red-100 text-red-700";

  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {statusLabel(status)}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-black/5 pb-3 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}

function normalizeConversations(value: ConversationResponse[] | undefined): ConversationView[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((conversation) => ({
    id: conversation.id,
    channelId: conversation.channel_id,
    customerId: conversation.customer_id,
    customerName: safeText(conversation.customer_name, "Клиент без имени"),
    status: normalizeStatus(conversation.status),
    lastMessageAt: conversation.last_message_at,
    lastMessagePreview: safeText(conversation.last_message_preview, ""),
    unreadCount: Number.isFinite(conversation.unread_count) ? conversation.unread_count : 0,
    messages: [],
  }));
}

function normalizeThread(
  value: ConversationThreadResponse | undefined,
  fallback?: ConversationView,
): ConversationView | null {
  if (!value && fallback) {
    return fallback;
  }

  const thread = value;

  if (!thread) {
    return null;
  }

  return {
    id: thread.id,
    channelId: thread.channel_id,
    customerId: thread.customer_id,
    customerName: safeText(thread.customer_name, "Клиент без имени"),
    status: normalizeStatus(thread.status),
    lastMessageAt: thread.last_message_at,
    lastMessagePreview: safeText(thread.last_message_preview, ""),
    unreadCount: Number.isFinite(thread.unread_count) ? thread.unread_count : 0,
    messages: Array.isArray(thread.messages) ? thread.messages : [],
  };
}

function normalizeStatus(value: unknown): ConversationStatus {
  if (value === "open" || value === "ai_replied" || value === "escalated" || value === "closed") {
    return value;
  }

  return "unknown";
}

function normalizeDirection(direction: unknown, senderType?: string): MessageDirection {
  if (direction === "inbound" || direction === "outbound" || direction === "internal") {
    return direction;
  }

  if (senderType === "customer") {
    return "inbound";
  }

  if (senderType === "manager" || senderType === "ai") {
    return "outbound";
  }

  if (senderType === "system") {
    return "internal";
  }

  return "unknown";
}

function statusLabel(status: ConversationStatus) {
  switch (status) {
    case "open":
      return "Открыт";
    case "ai_replied":
      return "AI ответил";
    case "escalated":
      return "Эскалация";
    case "closed":
      return "Закрыт";
    default:
      return "Неизвестно";
  }
}

function directionLabel(direction: MessageDirection, senderType?: string) {
  if (direction === "inbound") {
    return "Клиент";
  }

  if (direction === "outbound") {
    return senderType === "ai" ? "AI" : "Менеджер";
  }

  if (direction === "internal") {
    return "Система";
  }

  return "Неизвестный отправитель";
}

function messageStatusLabel(status: string) {
  switch (status) {
    case "sent":
      return "отправлено";
    case "delivered":
      return "доставлено";
    case "failed":
      return "ошибка отправки";
    case "draft":
      return "черновик";
    default:
      return status ? `статус: ${status}` : "статус неизвестен";
  }
}

function formatNullableDate(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function aiSignal(messages: ConversationMessageResponse[]) {
  const aiMessages = messages.filter((message) => message.sender_type === "ai");
  const confidenceValues = aiMessages
    .map((message) => message.confidence)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (confidenceValues.length === 0) {
    return aiMessages.length > 0 ? "AI отвечал без confidence" : "AI ещё не отвечал";
  }

  const average = confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length;
  return `Средняя уверенность AI: ${Math.round(average * 100)}%`;
}

async function refetchAfterAction(queryClient: ReturnType<typeof useQueryClient>, conversationId: string | null) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    conversationId ? queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] }) : Promise.resolve(),
  ]);
}
