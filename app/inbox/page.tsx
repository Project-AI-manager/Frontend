"use client";

import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Bot,
  Cable,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
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

  return (
    <AppShell
      title="Диалоги"
      description="Разбирайте обращения последовательно: выберите диалог, изучите контекст и ответьте клиенту."
    >
      <div className="flex flex-col gap-4">
        <div className="soft-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-5">
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
            className="btn btn-secondary btn-sm shrink-0 self-start md:self-auto"
          >
            {isConversationsFetching || isThreadFetching ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={15} aria-hidden="true" />
            )}
            Обновить данные
          </button>
        </div>

        {/* 16rem = шапка AppShell (~4.7rem) + вертикальные отступы main (4rem)
            + панель шагов (5rem) + gap-4 (1rem) и небольшой запас: рабочая
            область умещается в экран, а прокручиваются только колонки. */}
        <section className="panel grid overflow-hidden lg:h-[calc(100dvh-16rem)] lg:min-h-[560px] lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_320px] xl:grid-rows-[minmax(0,1fr)]">
          <aside className="flex min-h-0 min-w-0 flex-col border-b border-line bg-mist lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:border-b-0 lg:border-r xl:row-span-1">
            <div className="flex-none border-b border-line bg-white/70 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="section-kicker">Очередь</p>
                  <h2 className="font-display mt-1 text-lg font-extrabold tracking-[-0.04em]">
                    Входящие
                  </h2>
                </div>
                <span className="font-display shrink-0 text-2xl font-extrabold tabular-nums text-brand">
                  {conversations.length}
                </span>
              </div>

              <div
                role="group"
                aria-label="Фильтр диалогов по статусу"
                className="segmented scroll-thin mt-3 w-full overflow-x-auto align-top"
              >
                {statusFilters.map((filter) => {
                  const isSelected = statusFilter === filter.value;
                  const count =
                    filter.value === "all"
                      ? conversations.length
                      : conversations.filter(
                          (conversation) =>
                            conversation.status === filter.value,
                        ).length;

                  // min-h-10! — .segmented-item задаёт 36px вне каскадных слоёв,
                  // обычная утилита его не перебивает, а цель нажатия нужна 40px.
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      aria-pressed={isSelected}
                      data-active={isSelected ? "true" : undefined}
                      onClick={() => setStatusFilter(filter.value)}
                      className="segmented-item min-h-10! shrink-0"
                    >
                      {filter.label}
                      <span
                        className={`tabular-nums ${
                          isSelected ? "text-on-brand-strong" : "text-faint"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="scroll-thin min-h-0 max-h-[26rem] flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
              {isConversationsLoading ? (
                <div
                  role="status"
                  aria-label="Загружаем диалоги"
                  className="space-y-2"
                >
                  {skeletonRows.map((row) => (
                    <div
                      key={row}
                      className="rounded-md border border-line bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="skeleton block h-3.5 w-28" />
                        <span className="skeleton block h-3 w-10" />
                      </div>
                      <span className="skeleton mt-3 block h-3 w-full" />
                      <span className="skeleton mt-2 block h-3 w-3/5" />
                      <span className="skeleton mt-4 block h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : conversationsError ? (
                <StateCard
                  icon={<AlertCircle size={22} />}
                  title="Не удалось загрузить диалоги"
                  description={getApiErrorMessage(
                    conversationsError,
                    "Проверь авторизацию и подключение к сервису.",
                  )}
                  variant="error"
                  align="center"
                  action={
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="btn btn-secondary btn-sm"
                    >
                      <RefreshCw size={15} aria-hidden="true" />
                      Обновить данные
                    </button>
                  }
                />
              ) : visibleConversations.length > 0 ? (
                visibleConversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;

                  // border-brand!/bg-brand-soft! — .card объявлен вне каскадных
                  // слоёв, поэтому обычные утилиты цвета его не перебивают.
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setSelectedConversationId(conversation.id);
                        setActionMessage(null);
                      }}
                      className={`card card-hover block w-full px-4 py-3.5 text-left ${
                        isActive ? "border-brand! bg-brand-soft!" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          {conversation.unreadCount > 0 ? (
                            <span
                              className="size-1.5 shrink-0 rounded-full bg-brand"
                              aria-hidden="true"
                            />
                          ) : null}
                          <h3 className="font-display min-w-0 truncate text-sm font-extrabold tracking-[-0.03em]">
                            {conversation.customerName}
                          </h3>
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-faint">
                          {formatCompactDate(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 break-words text-muted">
                        {conversation.lastMessagePreview ||
                          "Сообщений пока нет"}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <StatusChip status={conversation.status} />
                        {conversation.unreadCount > 0 ? (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold tabular-nums text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              ) : conversations.length > 0 ? (
                <StateCard
                  icon={<MessageCircle size={22} />}
                  title="Нет диалогов с таким статусом"
                  description="Смените фильтр очереди, чтобы увидеть остальные обращения."
                  align="center"
                />
              ) : (
                <StateCard
                  icon={<MessageCircle size={22} />}
                  title="Диалогов пока нет"
                  description="Новое обращение появится здесь сразу после поступления из подключённого канала."
                  align="center"
                />
              )}
            </div>
          </aside>

          <aside className="scroll-thin flex min-h-0 min-w-0 flex-col gap-4 border-b border-line bg-white p-4 md:p-5 lg:col-start-2 lg:row-start-1 lg:max-h-60 lg:overflow-y-auto xl:col-start-3 xl:row-start-1 xl:max-h-none xl:overflow-y-auto xl:border-b-0 xl:border-l">
            <p className="section-kicker">Контекст</p>

            {thread ? (
              <>
                <dl className="flex flex-wrap gap-x-8 gap-y-4 xl:block xl:space-y-4">
                  {channelName ? (
                    <div className="min-w-0">
                      <dt className="micro-label">Канал</dt>
                      <dd
                        className="font-display mt-1 truncate text-sm font-bold text-ink"
                        title={thread.channelId || undefined}
                      >
                        {channelName}
                      </dd>
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <dt className="micro-label">Клиент</dt>
                    <dd
                      className="font-display mt-1 truncate text-sm font-bold text-ink"
                      title={thread.customerId || undefined}
                    >
                      {thread.customerName}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="micro-label">Статус</dt>
                    <dd className="mt-1.5">
                      <StatusChip status={thread.status} />
                    </dd>
                  </div>
                </dl>

                <div className="soft-panel flex items-center gap-3 p-4">
                  <span className="icon-badge shrink-0" aria-hidden="true">
                    <Gauge size={20} />
                  </span>
                  <p className="font-display min-w-0 text-[13px] font-bold leading-5 text-ink">
                    {aiSignal(messages)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                  <Signal
                    icon={<MessageCircle size={14} />}
                    title={`${thread.unreadCount} непрочитано`}
                  />
                  <Signal
                    icon={<CheckCircle2 size={14} />}
                    title="История синхронизирована"
                  />
                  <Signal
                    icon={<Clock size={14} />}
                    title={`Обновлено ${formatNullableDate(thread.lastMessageAt, "нет даты")}`}
                  />
                </div>

                <div className="xl:mt-auto xl:pt-2">
                  <button
                    type="button"
                    onClick={() => escalateMutation.mutate()}
                    disabled={!activeConversationId || isActionPending}
                    className="btn btn-secondary w-full sm:w-auto xl:w-full"
                  >
                    {escalateMutation.isPending ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowUpRight size={15} aria-hidden="true" />
                    )}
                    {escalateMutation.isPending
                      ? "Передаём менеджеру..."
                      : "Передать менеджеру"}
                  </button>
                </div>
              </>
            ) : (
              <div className="soft-panel flex items-center gap-3 p-4">
                <span className="icon-badge shrink-0" aria-hidden="true">
                  <UserRound size={20} />
                </span>
                <p className="text-[13px] leading-5 text-muted">
                  Карточка клиента появится после выбора обращения.
                </p>
              </div>
            )}
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col bg-white lg:col-start-2 lg:row-start-2 xl:col-start-2 xl:row-start-1">
            <header className="flex-none border-b border-line px-4 py-4 md:px-6 md:py-5">
              {thread ? (
                <>
                  <p className="section-kicker">Переписка</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h2 className="font-display min-w-0 truncate text-xl font-extrabold tracking-[-0.04em] md:text-2xl">
                      {thread.customerName}
                    </h2>
                    <StatusChip status={thread.status} />
                    {channelName ? (
                      <span
                        className="chip chip-grey"
                        title={thread.channelId || undefined}
                      >
                        <Cable size={12} aria-hidden="true" />
                        {channelName}
                      </span>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <p className="section-kicker">Переписка</p>
                  <h2 className="font-display mt-1.5 text-xl font-extrabold tracking-[-0.04em] md:text-2xl">
                    Выберите диалог
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    История обращения и действия появятся в этой рабочей
                    области.
                  </p>
                </>
              )}
            </header>

            <div
              className="scroll-thin min-h-[20rem] max-h-[60vh] flex-1 space-y-3 overflow-y-auto bg-surface p-4 md:p-6 lg:max-h-none lg:min-h-0"
              aria-live="polite"
            >
              {isThreadLoading ? (
                <div
                  role="status"
                  aria-label="Загружаем историю"
                  className="space-y-3"
                >
                  {skeletonRows.map((row) => (
                    <div
                      key={row}
                      className={
                        row === 1 ? "flex justify-end" : "flex justify-start"
                      }
                    >
                      <div className="w-[78%] max-w-md rounded-md border border-line bg-white p-4">
                        <span className="skeleton block h-3 w-24" />
                        <span className="skeleton mt-3 block h-3 w-full" />
                        <span className="skeleton mt-2 block h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : threadError ? (
                <StateCard
                  icon={<AlertCircle size={22} />}
                  title="Не удалось загрузить диалог"
                  description={getApiErrorMessage(
                    threadError,
                    "Попробуй обновить данные или выбрать другой диалог.",
                  )}
                  variant="error"
                  align="center"
                  action={
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="btn btn-secondary btn-sm"
                    >
                      <RefreshCw size={15} aria-hidden="true" />
                      Обновить данные
                    </button>
                  }
                />
              ) : !activeConversationId ? (
                <StateCard
                  icon={<MessageCircle size={22} />}
                  title="Нет выбранного диалога"
                  description="Список обращений пуст или ещё загружается."
                  align="center"
                />
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              ) : (
                <StateCard
                  icon={<MessageCircle size={22} />}
                  title="История пуста"
                  description="В этом диалоге пока нет сообщений."
                  align="center"
                />
              )}
            </div>

            <div className="flex-none border-t border-line bg-white p-4 md:p-6">
              <form onSubmit={handleReplySubmit}>
                <label htmlFor="conversation-reply" className="field-label">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles
                      size={15}
                      className="text-brand"
                      aria-hidden="true"
                    />
                    Ответ клиенту
                  </span>
                </label>
                <textarea
                  id="conversation-reply"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Напишите короткий и точный ответ..."
                  disabled={!activeConversationId || isActionPending}
                  className="field scroll-thin max-h-56 text-sm leading-6 placeholder:text-faint [field-sizing:content]"
                />
                {actionMessage ? (
                  <p
                    role="status"
                    className="mt-3 rounded-md border border-line border-l-2 border-l-brand bg-mist px-4 py-3 text-sm font-semibold text-ink-soft"
                  >
                    {actionMessage}
                  </p>
                ) : null}
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={!activeConversationId || isActionPending}
                    className="btn btn-primary w-full sm:w-auto"
                  >
                    {replyMutation.isPending ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Send size={16} aria-hidden="true" />
                    )}
                    Отправить ответ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
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
    <span className="flex shrink-0 items-center gap-3">
      <span className="num-badge num-badge-sm" aria-hidden="true">
        {number}
      </span>
      <span
        className={`font-display whitespace-nowrap text-[13px] font-bold tracking-[-0.02em] ${
          active ? "text-ink" : "text-faint"
        }`}
      >
        {label}
      </span>
    </span>
  );
}

function MessageBubble({ message }: { message: ConversationMessageResponse }) {
  const direction = normalizeDirection(message.direction, message.sender_type);
  const isOutbound = direction === "outbound";
  const isInternal = direction === "internal";
  const isAi = isOutbound && message.sender_type === "ai";
  const isManager = isOutbound && !isAi;
  const sources = messageSources(message.ai_meta);
  const confidence = confidencePercent(message.confidence);

  if (isInternal) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[86%] text-center">
          <p className="micro-label">
            {directionLabel(direction, message.sender_type)}
            <span className="px-1.5">·</span>
            {formatNullableDate(message.created_at, "нет даты")}
          </p>
          <p className="mt-1 text-[13px] leading-5 break-words text-muted">
            {message.text || "Пустое сообщение"}
          </p>
          <p className="mt-1 text-[11px] text-faint">
            {messageStatusLabel(message.status)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={isOutbound ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isManager
            ? "max-w-[86%] rounded-md bg-brand p-4 text-white shadow-brand"
            : isAi
              ? "max-w-[86%] rounded-md border border-brand/35 bg-white p-4 shadow-soft"
              : "soft-panel max-w-[78%] p-4"
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {isAi ? (
            <span className="chip chip-blue">
              <Bot size={12} aria-hidden="true" />
              {directionLabel(direction, message.sender_type)}
            </span>
          ) : isManager ? (
            <span className="chip chip-inverse">
              <UserRound size={12} aria-hidden="true" />
              {directionLabel(direction, message.sender_type)}
            </span>
          ) : (
            <span className="chip chip-grey">
              <UserRound size={12} aria-hidden="true" />
              {directionLabel(direction, message.sender_type)}
            </span>
          )}
          {isAi && confidence !== null ? (
            <span className="chip chip-grey">
              <Gauge size={12} aria-hidden="true" />
              {confidence}%
            </span>
          ) : null}
          <span
            className={`text-[11px] font-semibold tabular-nums ${
              isManager ? "text-on-brand-strong" : "text-faint"
            }`}
          >
            {formatNullableDate(message.created_at, "нет даты")}
          </span>
        </div>
        <p
          className={`mt-2.5 break-words whitespace-pre-line text-sm leading-6 ${
            isManager ? "text-white" : "text-ink"
          }`}
        >
          {message.text || "Пустое сообщение"}
        </p>
        {sources.length > 0 ? (
          <div
            className={`mt-3 flex items-start gap-3 rounded-md p-3 ${
              isManager ? "bg-white/12" : "border border-line-soft bg-mist"
            }`}
          >
            <span className="icon-badge shrink-0" aria-hidden="true">
              <BookOpen size={20} />
            </span>
            <div className="min-w-0">
              <p
                className={`font-display text-[13px] font-extrabold tracking-[-0.02em] ${
                  isManager ? "text-white" : "text-ink"
                }`}
              >
                Источники ответа
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {sources.map((source) => (
                  <li key={source} className="max-w-full">
                    <span className="chip chip-grey max-w-full truncate">
                      {source}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
        {message.status === "failed" ? (
          // Красный тон — только для настоящей ошибки: сбоя отправки.
          <span className="chip chip-red mt-2">
            <AlertCircle size={12} aria-hidden="true" />
            {messageStatusLabel(message.status)}
          </span>
        ) : (
          <p
            className={`mt-2 text-[11px] font-semibold ${
              isManager ? "text-on-brand-strong" : "text-faint"
            }`}
          >
            {messageStatusLabel(message.status)}
          </p>
        )}
      </div>
    </div>
  );
}

function Signal({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-muted">
      <span className="text-brand" aria-hidden="true">
        {icon}
      </span>
      {title}
    </span>
  );
}

function StatusChip({ status }: { status: ConversationStatus }) {
  // Красный тон означает сбой, а не «состояние неизвестно»:
  // неизвестный статус — нейтральный, поэтому серый.
  const toneClass =
    status === "open"
      ? "chip-blue"
      : status === "ai_replied"
        ? "chip-green"
        : status === "escalated"
          ? "chip-amber"
          : "chip-grey";

  return <span className={`chip ${toneClass}`}>{statusLabel(status)}</span>;
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
