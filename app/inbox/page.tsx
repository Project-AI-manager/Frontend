"use client";

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronRight,
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

type ConversationStatus =
  | "open"
  | "ai_replied"
  | "escalated"
  | "closed"
  | "unknown";
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
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
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
    queryFn: () =>
      conversationsApi.listConversationItemsApiV1ConversationsGet(),
    retry: 1,
  });

  const conversations = useMemo(
    () => normalizeConversations(conversationsData),
    [conversationsData],
  );

  const activeConversationId =
    selectedConversationId ?? conversations[0]?.id ?? null;
  const selectedConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );

  const {
    data: threadData,
    isLoading: isThreadLoading,
    isFetching: isThreadFetching,
    error: threadError,
    refetch: refetchThread,
  } = useQuery({
    queryKey: ["conversation", activeConversationId],
    queryFn: () =>
      conversationsApi.getConversationApiV1ConversationsConversationIdGet(
        activeConversationId ?? "",
      ),
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
      setActionMessage(
        getApiErrorMessage(
          error,
          "Не удалось отправить ответ. Проверь подключение к сервису.",
        ),
      );
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async () => {
      if (!activeConversationId) {
        throw new Error("Диалог не выбран");
      }

      return conversationsApi.escalateApiV1ConversationsConversationIdEscalatePost(
        activeConversationId,
      );
    },
    onSuccess: async () => {
      setActionMessage("Диалог передан менеджеру и обновлён.");
      await refetchAfterAction(queryClient, activeConversationId);
    },
    onError: (error) => {
      setActionMessage(
        getApiErrorMessage(
          error,
          "Не удалось эскалировать диалог. Попробуй ещё раз.",
        ),
      );
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
    await Promise.all([
      refetchConversations(),
      activeConversationId ? refetchThread() : Promise.resolve(),
    ]);
  }

  const isActionPending = replyMutation.isPending || escalateMutation.isPending;

  return (
    <AppShell
      title="Диалоги"
      description="Разбирайте обращения последовательно: выберите диалог, изучите контекст и ответьте клиенту."
    >
      <section className="glass-card overflow-hidden rounded-lg">
        <div className="border-b border-[#d9e1ec] bg-white/75 px-5 py-4 md:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold text-[#526071]">
              <WorkflowStep number="1" label="Выберите обращение" active />
              <ChevronRight
                size={15}
                className="hidden text-neutral-300 sm:block"
              />
              <WorkflowStep
                number="2"
                label="Проверьте контекст"
                active={Boolean(thread)}
              />
              <ChevronRight
                size={15}
                className="hidden text-neutral-300 sm:block"
              />
              <WorkflowStep
                number="3"
                label="Ответьте клиенту"
                active={Boolean(thread)}
              />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="secondary-button self-start px-3 py-2 text-xs md:self-auto"
            >
              {isConversationsFetching || isThreadFetching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Обновить данные
            </button>
          </div>
        </div>

        <div className="grid min-h-[680px] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-[#d9e1ec] bg-[#f8fbff]/80 lg:border-b-0 lg:border-r">
            <div className="flex items-end justify-between border-b border-[#d9e1ec] px-5 py-4">
              <div>
                <p className="brand-kicker">Очередь</p>
                <h2 className="mt-1 text-lg font-black">Входящие</h2>
              </div>
              <span className="font-mono text-sm font-bold text-[#526071]">
                {conversations.length}
              </span>
            </div>

            <div className="divide-y divide-[#d9e1ec]">
              {isConversationsLoading ? (
                <div className="p-4">
                  <StateCard
                    icon={<Loader2 className="animate-spin" size={18} />}
                    title="Загружаем диалоги"
                  />
                </div>
              ) : conversationsError ? (
                <div className="p-4">
                  <StateCard
                    icon={<AlertCircle size={18} />}
                    title="Не удалось загрузить диалоги"
                    description={getApiErrorMessage(
                      conversationsError,
                      "Проверь авторизацию и подключение к сервису.",
                    )}
                    tone="error"
                  />
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setSelectedConversationId(conversation.id);
                        setActionMessage(null);
                      }}
                      className={`relative w-full px-5 py-4 text-left transition-colors hover:bg-white ${
                        isActive ? "bg-white" : "bg-transparent"
                      }`}
                    >
                      {isActive ? (
                        <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#2463eb]" />
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 truncate text-sm font-black">
                          {conversation.customerName}
                        </h3>
                        <span className="shrink-0 font-mono text-[11px] text-neutral-400">
                          {formatCompactDate(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-neutral-500">
                        {conversation.lastMessagePreview ||
                          "Сообщений пока нет"}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <StatusPill status={conversation.status} />
                        {conversation.unreadCount > 0 ? (
                          <span className="flex size-6 items-center justify-center rounded-full bg-[#2463eb] text-[11px] font-black text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4">
                  <StateCard
                    icon={<MessageCircle size={20} />}
                    title="Диалогов пока нет"
                    description="Новое обращение появится здесь сразу после поступления из подключённого канала."
                  />
                </div>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col bg-white/70">
            <header className="border-b border-[#d9e1ec] px-5 py-5 md:px-6">
              {thread ? (
                <>
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-xl font-black">
                          {thread.customerName}
                        </h2>
                        <StatusPill status={thread.status} />
                      </div>
                      <p className="mt-2 text-sm text-neutral-500">
                        Канал {thread.channelId} · клиент {thread.customerId}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-neutral-500">
                      <span>{thread.unreadCount} непрочитано</span>
                      <span>{aiSignal(messages)}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#d9e1ec] pt-3 text-xs text-neutral-500">
                    <Signal
                      icon={<CheckCircle2 size={14} />}
                      title="История синхронизирована"
                    />
                    <Signal
                      icon={<Clock size={14} />}
                      title={`Обновлено ${formatNullableDate(thread.lastMessageAt, "нет даты")}`}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <h2 className="text-xl font-black">Выберите диалог</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    История обращения и действия появятся в этой рабочей
                    области.
                  </p>
                </div>
              )}
            </header>

            <div
              className="min-h-[380px] flex-1 space-y-4 overflow-y-auto bg-[#f8fbff]/60 p-5 md:p-6"
              aria-live="polite"
            >
              {isThreadLoading ? (
                <StateCard
                  icon={<Loader2 className="animate-spin" size={18} />}
                  title="Загружаем историю"
                />
              ) : threadError ? (
                <StateCard
                  icon={<AlertCircle size={18} />}
                  title="Не удалось загрузить диалог"
                  description={getApiErrorMessage(
                    threadError,
                    "Попробуй обновить данные или выбрать другой диалог.",
                  )}
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

            <div className="border-t border-[#d9e1ec] bg-white p-5 md:p-6">
              <form onSubmit={handleReplySubmit}>
                <label
                  htmlFor="conversation-reply"
                  className="flex items-center gap-2 text-sm font-black"
                >
                  <Sparkles size={16} className="text-[#2463eb]" />
                  Ответ клиенту
                </label>
                <textarea
                  id="conversation-reply"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Напишите короткий и точный ответ..."
                  disabled={!activeConversationId || isActionPending}
                  className="form-field mt-3 min-h-24 resize-y px-4 py-3 text-sm leading-6 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-70"
                />
                {actionMessage ? (
                  <p
                    role="status"
                    className="mt-3 border-l-2 border-[#2463eb] pl-3 text-sm font-semibold text-neutral-600"
                  >
                    {actionMessage}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => escalateMutation.mutate()}
                    disabled={!activeConversationId || isActionPending}
                    className="secondary-button px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {escalateMutation.isPending
                      ? "Передаём менеджеру..."
                      : "Передать менеджеру"}
                  </button>
                  <button
                    type="submit"
                    disabled={!activeConversationId || isActionPending}
                    className="primary-button px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    Отправить ответ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function WorkflowStep({
  number,
  label,
  active,
}: {
  number: string;
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-2 ${active ? "text-[#1546ad]" : ""}`}
    >
      <span
        className={`flex size-6 items-center justify-center rounded-full font-mono text-[11px] font-black ${
          active ? "bg-[#2463eb] text-white" : "bg-neutral-100 text-neutral-400"
        }`}
      >
        {number}
      </span>
      {label}
    </span>
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
            ? "max-w-[78%] rounded-lg bg-[#2463eb] px-5 py-3 text-sm leading-6 text-white"
            : isInternal
              ? "max-w-[78%] rounded-lg bg-[#eaf1ff] px-5 py-3 text-sm leading-6 text-[#1546ad] shadow-sm"
              : "max-w-[78%] rounded-lg border border-[#d9e1ec] bg-white px-5 py-3 text-sm leading-6 shadow-sm"
        }
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-black opacity-70">
          {isOutbound ? <Bot size={13} /> : <UserRound size={13} />}
          {directionLabel(direction, message.sender_type)}
          <span>·</span>
          <span>{formatNullableDate(message.created_at, "нет даты")}</span>
        </div>
        <p>{message.text || "Пустое сообщение"}</p>
        <p className="mt-2 text-xs font-semibold opacity-60">
          {messageStatusLabel(message.status)}
        </p>
      </div>
    </div>
  );
}

function Signal({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <span className="flex items-center gap-2 font-semibold">
      <span className="text-[#2463eb]">{icon}</span>
      {title}
    </span>
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
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[#d9e1ec] bg-white text-neutral-600"
      }`}
    >
      <div className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-white shadow-sm">
        {icon}
      </div>
      <p className="mt-3 font-black">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 opacity-75">{description}</p>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: ConversationStatus }) {
  const className =
    status === "open"
      ? "bg-[#eaf1ff] text-[#1546ad]"
      : status === "ai_replied"
        ? "bg-emerald-100 text-emerald-700"
        : status === "escalated"
          ? "bg-[#fff5df] text-[#94600b]"
          : status === "closed"
            ? "bg-neutral-200 text-neutral-700"
            : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${className}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function normalizeConversations(
  value: ConversationResponse[] | undefined,
): ConversationView[] {
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
    unreadCount: Number.isFinite(conversation.unread_count)
      ? conversation.unread_count
      : 0,
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
  if (
    value === "open" ||
    value === "ai_replied" ||
    value === "escalated" ||
    value === "closed"
  ) {
    return value;
  }

  return "unknown";
}

function normalizeDirection(
  direction: unknown,
  senderType?: string,
): MessageDirection {
  if (
    direction === "inbound" ||
    direction === "outbound" ||
    direction === "internal"
  ) {
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

function formatNullableDate(
  value: string | null | undefined,
  fallback: string,
) {
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

function formatCompactDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return new Intl.DateTimeFormat("ru-RU", {
    ...(isToday
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit" }),
  }).format(date);
}

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function aiSignal(messages: ConversationMessageResponse[]) {
  const aiMessages = messages.filter((message) => message.sender_type === "ai");
  const confidenceValues = aiMessages
    .map((message) => message.confidence)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );

  if (confidenceValues.length === 0) {
    return aiMessages.length > 0
      ? "AI уже участвовал в диалоге"
      : "AI ещё не отвечал";
  }

  const average =
    confidenceValues.reduce((sum, value) => sum + value, 0) /
    confidenceValues.length;
  return `Средняя уверенность AI: ${Math.round(average * 100)}%`;
}

async function refetchAfterAction(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string | null,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    conversationId
      ? queryClient.invalidateQueries({
          queryKey: ["conversation", conversationId],
        })
      : Promise.resolve(),
  ]);
}
