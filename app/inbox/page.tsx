"use client";

import { ArrowUpRight, ChevronRight, RefreshCw, Send } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { StateCard } from "@/components/ui/state-card";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  ConversationMessageResponse,
  ConversationMessageResponseAiMeta,
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
type StatusFilter = ConversationStatus | "all";
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

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "open", label: statusLabel("open") },
  { value: "ai_replied", label: statusLabel("ai_replied") },
  { value: "escalated", label: statusLabel("escalated") },
  { value: "closed", label: statusLabel("closed") },
];

const skeletonRows = [0, 1, 2];

/** Подписи типов каналов — те же, что на странице «Каналы». */
const channelTypeLabels: Record<string, string | undefined> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  viber: "Viber",
  vk: "ВКонтакте",
  avito: "Авито",
  max: "MAX",
  email: "Почта",
  sms: "SMS",
  web: "Веб-чат",
  widget: "Веб-чат",
};

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [replyText, setReplyText] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  const visibleConversations = useMemo(
    () =>
      statusFilter === "all"
        ? conversations
        : conversations.filter(
            (conversation) => conversation.status === statusFilter,
          ),
    [conversations, statusFilter],
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
  // В ответах /conversations и /conversations/{id} есть только channel_id.
  // Показываем название канала, когда тип читается из идентификатора,
  // иначе строку не печатаем: внутренний UUID пользователю ничего не говорит.
  const channelName = channelLabel(thread?.channelId);

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
  const isRefreshing = isConversationsFetching || isThreadFetching;

  return (
    <AppShell
      title="Диалоги"
      description="Разбирайте обращения последовательно: выберите диалог, изучите контекст и ответьте клиенту."
    >
      <div className="flex flex-col gap-4">
        <div className="wf-box flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="scroll-thin -mx-1 flex min-w-0 flex-1 items-center gap-3 overflow-x-auto px-1 py-0.5">
            <WorkflowStep number="01" label="Выберите обращение" active />
            <ChevronRight
              size={16}
              className="shrink-0 text-faint"
              aria-hidden="true"
            />
            <WorkflowStep
              number="02"
              label="Проверьте контекст"
              active={Boolean(thread)}
            />
            <ChevronRight
              size={16}
              className="shrink-0 text-faint"
              aria-hidden="true"
            />
            <WorkflowStep
              number="03"
              label="Ответьте клиенту"
              active={Boolean(thread)}
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            aria-busy={isRefreshing}
            className="wf-btn shrink-0 self-start md:self-auto"
          >
            <RefreshCw size={18} className="text-muted" aria-hidden="true" />
            Обновить данные
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_260px]">
          {/* Колонка 1 — список диалогов. */}
          <section className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="wf-kicker">Очередь</p>
                <h2 className="wf-title mt-1">Входящие</h2>
              </div>
              <span className="wf-muted shrink-0 text-sm tabular-nums">
                {conversations.length}
              </span>
            </div>

            <div
              role="group"
              aria-label="Фильтр диалогов по статусу"
              className="mt-3 flex flex-wrap gap-2"
            >
              {statusFilters.map((filter) => {
                const isSelected = statusFilter === filter.value;
                const count =
                  filter.value === "all"
                    ? conversations.length
                    : conversations.filter(
                        (conversation) => conversation.status === filter.value,
                      ).length;

                // bg-fill! — .wf-btn объявлен вне каскадных слоёв, поэтому
                // обычная утилита фона его не перебивает.
                return (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={isSelected}
                    data-active={isSelected ? "true" : undefined}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`wf-btn ${isSelected ? "bg-fill!" : ""}`}
                  >
                    {filter.label}
                    <span className="wf-muted tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 space-y-2">
              {isConversationsLoading ? (
                <div
                  role="status"
                  aria-label="Загружаем диалоги"
                  className="space-y-2"
                >
                  {skeletonRows.map((row) => (
                    <div key={row} className="wf-box p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="wf-skeleton block h-3.5 w-28" />
                        <span className="wf-skeleton block h-3 w-10" />
                      </div>
                      <span className="wf-skeleton mt-3 block h-3 w-full" />
                      <span className="wf-skeleton mt-2 block h-3 w-3/5" />
                      <span className="wf-skeleton mt-3 block h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : conversationsError ? (
                <StateCard
                  title="Не удалось загрузить диалоги"
                  description={getApiErrorMessage(
                    conversationsError,
                    "Проверь авторизацию и подключение к сервису.",
                  )}
                  variant="error"
                  action={
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="wf-btn"
                    >
                      <RefreshCw
                        size={18}
                        className="text-muted"
                        aria-hidden="true"
                      />
                      Обновить данные
                    </button>
                  }
                />
              ) : visibleConversations.length > 0 ? (
                visibleConversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;

                  // bg-fill! — .wf-box объявлен вне каскадных слоёв, поэтому
                  // обычная утилита фона его не перебивает.
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setSelectedConversationId(conversation.id);
                        setActionMessage(null);
                      }}
                      className={`wf-box block w-full p-3 text-left ${
                        isActive ? "bg-fill!" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          {conversation.unreadCount > 0 ? (
                            <span
                              className="wf-dot shrink-0"
                              aria-hidden="true"
                            />
                          ) : null}
                          <h3 className="min-w-0 truncate text-sm font-semibold">
                            {conversation.customerName}
                          </h3>
                        </div>
                        <span className="wf-muted shrink-0 text-xs tabular-nums">
                          {formatCompactDate(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="wf-muted mt-1.5 line-clamp-2 text-sm break-words">
                        {conversation.lastMessagePreview ||
                          "Сообщений пока нет"}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <StatusTag status={conversation.status} />
                        {conversation.unreadCount > 0 ? (
                          <span className="wf-muted shrink-0 text-xs tabular-nums">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              ) : conversations.length > 0 ? (
                <StateCard
                  title="Нет диалогов с таким статусом"
                  description="Смените фильтр очереди, чтобы увидеть остальные обращения."
                />
              ) : (
                <StateCard
                  title="Диалогов пока нет"
                  description="Новое обращение появится здесь сразу после поступления из подключённого канала."
                />
              )}
            </div>
          </section>

          {/* Колонка 2 — лента переписки и композер. */}
          <section className="min-w-0">
            <p className="wf-kicker">Переписка</p>

            {thread ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="wf-title min-w-0 truncate">
                  {thread.customerName}
                </h2>
                <StatusTag status={thread.status} />
                {channelName ? (
                  <span
                    className="wf-muted text-sm"
                    title={thread.channelId || undefined}
                  >
                    {channelName}
                  </span>
                ) : null}
              </div>
            ) : (
              <>
                <h2 className="wf-title mt-1">Выберите диалог</h2>
                <p className="wf-muted mt-2 text-sm">
                  История обращения и действия появятся в этой рабочей области.
                </p>
              </>
            )}

            <div className="mt-3 space-y-2" aria-live="polite">
              {isThreadLoading ? (
                <div
                  role="status"
                  aria-label="Загружаем историю"
                  className="space-y-2"
                >
                  {skeletonRows.map((row) => (
                    <div
                      key={row}
                      className={
                        row === 1 ? "flex justify-end" : "flex justify-start"
                      }
                    >
                      <div className="wf-box w-[78%] max-w-md p-3">
                        <span className="wf-skeleton block h-3 w-24" />
                        <span className="wf-skeleton mt-3 block h-3 w-full" />
                        <span className="wf-skeleton mt-2 block h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : threadError ? (
                <StateCard
                  title="Не удалось загрузить диалог"
                  description={getApiErrorMessage(
                    threadError,
                    "Попробуй обновить данные или выбрать другой диалог.",
                  )}
                  variant="error"
                  action={
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="wf-btn"
                    >
                      <RefreshCw
                        size={18}
                        className="text-muted"
                        aria-hidden="true"
                      />
                      Обновить данные
                    </button>
                  }
                />
              ) : !activeConversationId ? (
                <StateCard
                  title="Нет выбранного диалога"
                  description="Список обращений пуст или ещё загружается."
                />
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <MessageRow key={message.id} message={message} />
                ))
              ) : (
                <StateCard
                  title="История пуста"
                  description="В этом диалоге пока нет сообщений."
                />
              )}
            </div>

            <form onSubmit={handleReplySubmit} className="mt-4">
              <label htmlFor="conversation-reply" className="wf-label">
                Ответ клиенту
              </label>
              <textarea
                id="conversation-reply"
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Напишите короткий и точный ответ..."
                disabled={!activeConversationId || isActionPending}
                className="wf-field scroll-thin text-sm"
              />
              {actionMessage ? (
                <p role="status" className="wf-hint">
                  {actionMessage}
                </p>
              ) : null}
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!activeConversationId || isActionPending}
                  className="wf-btn wf-btn-primary w-full sm:w-auto"
                >
                  <Send size={18} aria-hidden="true" />
                  {replyMutation.isPending
                    ? "Отправляем ответ..."
                    : "Отправить ответ"}
                </button>
              </div>
            </form>
          </section>

          {/* Колонка 3 — контекст диалога. */}
          <section className="min-w-0">
            <p className="wf-kicker">Контекст</p>

            {thread ? (
              <>
                <dl className="mt-2">
                  {channelName ? (
                    <>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <dt className="wf-muted shrink-0 text-sm">Канал</dt>
                        <dd
                          className="min-w-0 truncate text-sm"
                          title={thread.channelId || undefined}
                        >
                          {channelName}
                        </dd>
                      </div>
                      <div className="wf-divider" />
                    </>
                  ) : null}
                  <div className="flex items-baseline justify-between gap-4 py-2">
                    <dt className="wf-muted shrink-0 text-sm">Клиент</dt>
                    <dd
                      className="min-w-0 truncate text-sm"
                      title={thread.customerId || undefined}
                    >
                      {thread.customerName}
                    </dd>
                  </div>
                  <div className="wf-divider" />
                  <div className="flex items-center justify-between gap-4 py-2">
                    <dt className="wf-muted shrink-0 text-sm">Статус</dt>
                    <dd className="min-w-0">
                      <StatusTag status={thread.status} />
                    </dd>
                  </div>
                  <div className="wf-divider" />
                </dl>

                <ul className="wf-muted mt-3 space-y-1 text-sm">
                  <li>{aiSignal(messages)}</li>
                  <li>{`${thread.unreadCount} непрочитано`}</li>
                  <li>История синхронизирована</li>
                  <li>
                    {`Обновлено ${formatNullableDate(thread.lastMessageAt, "нет даты")}`}
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => escalateMutation.mutate()}
                  disabled={!activeConversationId || isActionPending}
                  className="wf-btn mt-4 w-full"
                >
                  <ArrowUpRight
                    size={18}
                    className="text-muted"
                    aria-hidden="true"
                  />
                  {escalateMutation.isPending
                    ? "Передаём менеджеру..."
                    : "Передать менеджеру"}
                </button>
              </>
            ) : (
              <p className="wf-muted mt-2 text-sm">
                Карточка клиента появится после выбора обращения.
              </p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

/** Шаг маршрута разбора обращения. Пройденный шаг отличается только тоном
    текста: цвета в каркасе нет, поэтому неактивный шаг приглушён. */
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
    <span className="flex shrink-0 items-center gap-2">
      <span className="wf-muted text-xs tabular-nums" aria-hidden="true">
        {number}
      </span>
      <span
        className={`whitespace-nowrap text-[13px] font-medium ${
          active ? "text-ink" : "text-faint"
        }`}
      >
        {label}
      </span>
    </span>
  );
}

function MessageRow({ message }: { message: ConversationMessageResponse }) {
  const direction = normalizeDirection(message.direction, message.sender_type);
  const isOutbound = direction === "outbound";
  const isInternal = direction === "internal";
  const isAi = isOutbound && message.sender_type === "ai";
  const sources = messageSources(message.ai_meta);
  const confidence = confidencePercent(message.confidence);

  if (isInternal) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[86%] text-center">
          <p className="wf-muted text-xs">
            {directionLabel(direction, message.sender_type)}
            <span className="px-1.5">·</span>
            {formatNullableDate(message.created_at, "нет даты")}
          </p>
          <p className="wf-muted mt-1 text-sm break-words">
            {message.text || "Пустое сообщение"}
          </p>
          <p className="wf-muted mt-1 text-xs">
            {messageStatusLabel(message.status)}
          </p>
        </div>
      </div>
    );
  }

  // Клиент — слева на сером фоне, AI и менеджер — справа на белом.
  return (
    <div className={isOutbound ? "flex justify-end" : "flex justify-start"}>
      <div className={`${isOutbound ? "wf-box" : "wf-fill"} max-w-[86%] p-3`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-semibold">
            {directionLabel(direction, message.sender_type)}
          </span>
          <span className="wf-muted tabular-nums">
            {formatNullableDate(message.created_at, "нет даты")}
          </span>
          {isAi && confidence !== null ? (
            <span className="wf-muted tabular-nums">
              Уверенность {confidence}%
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm break-words whitespace-pre-line">
          {message.text || "Пустое сообщение"}
        </p>
        {sources.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold">Источники ответа</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {sources.map((source) => (
                <li key={source} className="max-w-full">
                  <span className="wf-tag max-w-full truncate">{source}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="wf-muted mt-2 text-xs">
          {messageStatusLabel(message.status)}
        </p>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: ConversationStatus }) {
  return <span className="wf-tag">{statusLabel(status)}</span>;
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

/**
 * Человекочитаемое название канала из channel_id. Идентификатор вида
 * `telegram` или `telegram-1` даёт тип канала, непрозрачный UUID — нет:
 * в этом случае возвращаем null, и строка канала просто не выводится.
 */
function channelLabel(channelId: string | null | undefined): string | null {
  if (typeof channelId !== "string") {
    return null;
  }

  const type = channelId.trim().toLowerCase().split(/[-_:.\s]/)[0];

  return channelTypeLabels[type] ?? null;
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

function messageSources(
  aiMeta: ConversationMessageResponseAiMeta | undefined,
): string[] {
  const rawSources = aiMeta?.sources;

  if (!Array.isArray(rawSources)) {
    return [];
  }

  return rawSources
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function confidencePercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100);
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
