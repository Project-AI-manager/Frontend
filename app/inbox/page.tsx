"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Download,
  FileText,
  Inbox,
  Loader2,
  Plus,
  Search,
  Send,
  WandSparkles,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AppShell } from "@/components/layout/app-shell";
import {
  downloadConversationExport,
  getAuthenticatedAttachment,
  replyToConversationWithFile,
  type ConversationAttachment,
} from "@/lib/api/conversation-attachments";
import { markConversationRead } from "@/lib/api/conversations";
import { axiosInstance } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  ConversationMessageResponse,
  ConversationResponse,
} from "@/lib/api/generated/ai.schemas";
import { getConversations } from "@/lib/api/generated/conversations/conversations";
import { getUsers } from "@/lib/api/generated/users/users";
import { conversationListTime, messageTime } from "@/lib/inbox-time";

const api = getConversations();
const usersApi = getUsers();
const filters = ["Все", "Нужен человек", "Отвечено", "Закрытые"];
const attachmentAccept = ".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.txt,.md";
const attachmentExtensions = new Set(attachmentAccept.split(","));
const maxAttachmentSize = 10 * 1024 * 1024;
const maxAttachmentsPerMessage = 10;
const composerMaxHeight = 160;
const messageViewportBottomThreshold = 32;

type OptimisticConversationMessage = ConversationMessageResponse & {
  confirmedMessageId?: string;
  renderKey?: string;
  attachments?: { items: ConversationAttachment[] };
};

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <AppShell
          title="Диалоги"
          description="Все обращения клиентов в одном месте"
        >
          <State title="Загружаем диалоги…" />
        </AppShell>
      }
    >
      <InboxContent />
    </Suspense>
  );
}

function InboxContent() {
  const client = useQueryClient();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    searchParams.get("conversation"),
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Все");
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<
    Record<string, OptimisticConversationMessage[]>
  >({});
  const [scrollRequest, setScrollRequest] = useState<{
    conversationId: string;
    optimisticId: string;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const replyInput = useRef<HTMLTextAreaElement>(null);
  const messageViewport = useRef<HTMLDivElement>(null);
  const initiallyScrolledConversation = useRef<string | null>(null);
  const messageViewportNearBottom = useRef(true);
  const observedThreadMessageIds = useRef(new Map<string, Set<string>>());
  const [messageRenderKeys, setMessageRenderKeys] = useState<
    Record<string, string>
  >({});
  const optimisticSequence = useRef(0);
  const readAttempts = useRef(new Set<string>());
  const list = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.listConversationItemsApiV1ConversationsGet(),
    retry: 1,
    refetchInterval: 4_000,
    refetchIntervalInBackground: false,
  });
  const currentUser = useQuery({
    queryKey: ["profile-user"],
    queryFn: usersApi.meApiV1UsersMeGet,
    retry: 1,
  });
  const effectiveSelectedId = selectedId ?? list.data?.[0]?.id ?? null;
  const thread = useQuery({
    queryKey: ["conversation", effectiveSelectedId],
    queryFn: () =>
      api.getConversationApiV1ConversationsConversationIdGet(
        effectiveSelectedId!,
      ),
    enabled: Boolean(effectiveSelectedId),
    retry: 1,
    refetchInterval: (query) =>
      hasAwaitingReceipt(query.state.data) ? 1_000 : 4_000,
    refetchIntervalInBackground: false,
  });
  const selectedConversation = list.data?.find(
    (item) => item.id === effectiveSelectedId,
  );
  const markRead = useMutation({
    mutationFn: (conversationId: string) =>
      markConversationRead(conversationId),
    onMutate: async (conversationId) => {
      await Promise.all([
        client.cancelQueries({ queryKey: ["conversations"] }),
        client.cancelQueries({ queryKey: ["conversation", conversationId] }),
      ]);
      client.setQueryData<ConversationResponse[]>(
        ["conversations"],
        (current) =>
          current?.map((item) =>
            item.id === conversationId ? { ...item, unread_count: 0 } : item,
          ),
      );
      client.setQueryData(
        ["conversation", conversationId],
        (current: unknown) =>
          current && typeof current === "object"
            ? { ...current, unread_count: 0 }
            : current,
      );
    },
    onSuccess: (_conversation, conversationId) => {
      client.setQueryData(
        ["conversation", conversationId],
        (current: unknown) =>
          current && typeof current === "object"
            ? { ...current, unread_count: 0 }
            : current,
      );
      client.setQueryData<ConversationResponse[]>(
        ["conversations"],
        (current) =>
          current?.map((item) =>
            item.id === conversationId ? { ...item, unread_count: 0 } : item,
          ),
      );
    },
  });
  const markReadConversation = markRead.mutate;

  useEffect(() => {
    const readKey =
      effectiveSelectedId && selectedConversation
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

  useLayoutEffect(() => {
    const viewport = messageViewport.current;
    if (
      !effectiveSelectedId ||
      !viewport ||
      thread.data?.id !== effectiveSelectedId
    ) {
      return;
    }

    const currentMessageIds = new Set(
      thread.data.messages.map((message) => message.id),
    );
    if (initiallyScrolledConversation.current !== effectiveSelectedId) {
      viewport.scrollTop = viewport.scrollHeight;
      messageViewportNearBottom.current = true;
      initiallyScrolledConversation.current = effectiveSelectedId;
      observedThreadMessageIds.current.set(
        effectiveSelectedId,
        currentMessageIds,
      );
      return;
    }

    const previousMessageIds = observedThreadMessageIds.current.get(
      effectiveSelectedId,
    );
    const receivedNewMessage =
      previousMessageIds !== undefined &&
      thread.data.messages.some(
        (message) => !previousMessageIds.has(message.id),
      );
    observedThreadMessageIds.current.set(effectiveSelectedId, currentMessageIds);

    if (receivedNewMessage && messageViewportNearBottom.current) {
      viewport.scrollTo?.({
        top: viewport.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [effectiveSelectedId, thread.data]);

  function updateMessageViewportPosition() {
    const viewport = messageViewport.current;
    if (!viewport) return;
    messageViewportNearBottom.current =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <=
      messageViewportBottomThreshold;
  }

  useEffect(() => {
    const viewport = messageViewport.current;
    if (
      !scrollRequest ||
      !effectiveSelectedId ||
      !viewport ||
      scrollRequest.conversationId !== effectiveSelectedId
    ) {
      return;
    }

    viewport.scrollTo?.({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
    setScrollRequest(null);
  }, [effectiveSelectedId, optimisticMessages, scrollRequest]);

  const send = useMutation({
    mutationFn: (variables: {
      conversationId: string;
      text: string;
      files: File[];
      optimisticId: string;
    }) =>
      variables.files.length > 0
        ? replyToConversationWithFile({
            conversationId: variables.conversationId,
            text: variables.text,
            files: variables.files,
          })
        : api.replyApiV1ConversationsConversationIdReplyPost(
            variables.conversationId,
            {
              text: variables.text,
            },
          ),
    onSuccess: async (response, variables) => {
      const confirmedMessageId =
        response.message?.id ??
        findConfirmedMessageId(
          response.conversation.messages,
          variables.text,
          variables.optimisticId,
          messageRenderKeys,
        );
      if (confirmedMessageId) {
        setMessageRenderKeys((current) => ({
          ...current,
          [confirmedMessageId]: variables.optimisticId,
        }));
      }
      client.setQueryData(
        ["conversation", variables.conversationId],
        response.conversation,
      );
      setOptimisticMessages((current) => ({
        ...current,
        [variables.conversationId]: (
          current[variables.conversationId] ?? []
        ).map((message) =>
          message.id === variables.optimisticId && confirmedMessageId
            ? { ...message, confirmedMessageId }
            : message,
        ),
      }));
      setActionMessage(null);
      await client.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error, variables) => {
      setOptimisticMessages((current) => ({
        ...current,
        [variables.conversationId]: (
          current[variables.conversationId] ?? []
        ).map((message) =>
          message.id === variables.optimisticId
            ? { ...message, status: "failed" }
            : message,
        ),
      }));
      setActionMessage(
        getApiErrorMessage(error, "Не удалось отправить ответ."),
      );
    },
  });

  function sendReply(text: string, files: File[]) {
    if (!effectiveSelectedId) return;
    const conversationId = effectiveSelectedId;
    const filesToSend = [...files];
    const shouldScrollToMessage = messageViewportNearBottom.current;
    optimisticSequence.current += 1;
    const optimisticId = `optimistic-${optimisticSequence.current}`;
    setScrollRequest(
      shouldScrollToMessage
        ? { conversationId, optimisticId }
        : null,
    );
    const optimisticMessage: OptimisticConversationMessage = {
      id: optimisticId,
      direction: "outbound",
      sender_type: "manager",
      sender_user_id: currentUser.data?.id ?? null,
      text,
      status: "pending",
      confidence: null,
      ai_meta: { optimistic: true },
      created_at: new Date().toISOString(),
      renderKey: optimisticId,
      attachments: filesToSend.length > 0
        ? {
            items: filesToSend.map((file) => ({
                filename: file.name,
                content_type: file.type,
                size_bytes: file.size,
              })),
          }
        : undefined,
    };
    setOptimisticMessages((current) => ({
      ...current,
      [conversationId]: [
        ...(current[conversationId] ?? []).filter(
          (message) => message.status !== "failed",
        ),
        optimisticMessage,
      ],
    }));
    setReply("");
    resetComposerHeight();
    setAttachments([]);
    if (fileInput.current) fileInput.current.value = "";
    setActionMessage(null);
    send.mutate({ conversationId, text, files: filesToSend, optimisticId });
  }

  function resizeComposer(element: HTMLTextAreaElement) {
    if (!element.value) {
      element.style.height = "40px";
      element.style.overflowY = "hidden";
      return;
    }
    element.style.height = "auto";
    const nextHeight = Math.min(element.scrollHeight, composerMaxHeight);
    element.style.height = `${nextHeight}px`;
    element.style.overflowY =
      element.scrollHeight > composerMaxHeight ? "auto" : "hidden";
  }

  function resetComposerHeight() {
    requestAnimationFrame(() => {
      const element = replyInput.current;
      if (!element) return;
      element.style.height = "40px";
      element.style.overflowY = "hidden";
    });
  }

  function selectAttachments(files: File[]) {
    if (files.length === 0) return;
    const validFiles: File[] = [];
    let validationMessage: string | null = null;

    files.forEach((file) => {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      if (!attachmentExtensions.has(extension)) {
        validationMessage ??= `Файл «${file.name}» имеет неподдерживаемый формат.`;
        return;
      }
      if (file.size > maxAttachmentSize) {
        validationMessage ??= `Файл «${file.name}» превышает максимальный размер 10 МБ.`;
        return;
      }
      validFiles.push(file);
    });

    setAttachments((current) => {
      const next = [...current];
      let skippedForLimit = false;
      validFiles.forEach((file) => {
        if (next.length >= maxAttachmentsPerMessage) {
          skippedForLimit = true;
          return;
        }
        next.push(file);
      });
      if (skippedForLimit) {
        validationMessage ??= `Можно прикрепить не более ${maxAttachmentsPerMessage} файлов.`;
      }
      return next;
    });
    setActionMessage(validationMessage);
  }

  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }
  const exportConversation = useMutation({
    mutationFn: () => downloadConversationExport(effectiveSelectedId!),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dialog-${effectiveSelectedId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) =>
      setActionMessage(
        getApiErrorMessage(error, "Не удалось скачать диалог."),
      ),
  });
  const conversations = useMemo(
    () =>
      (list.data ?? []).filter((item) => {
        const matchesSearch =
          `${item.customer_name} ${item.last_message_preview}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const status = item.status.toLowerCase();
        const matchesFilter =
          filter === "Все" ||
          (filter === "Нужен человек" && needsHuman(status)) ||
          (filter === "Отвечено" && isAnswered(status)) ||
          (filter === "Закрытые" && status.includes("clos"));
        return matchesSearch && matchesFilter;
      }),
    [filter, list.data, search],
  );

  return (
    <AppShell
      title="Диалоги"
      description="Все обращения клиентов в одном окне."
      immersive
    >
      <div className="grid h-full min-h-0 lg:grid-cols-[392px_minmax(0,1fr)]">
        <section data-tour="tour-inbox-list" className="flex min-h-0 flex-col border-r border-[#d9e1ec] bg-white">
          <div className="flex h-[65px] shrink-0 items-center border-b border-[#d9e1ec] px-4">
            <label className="flex min-h-10 flex-1 items-center gap-2.5 rounded-full border border-[#d9e1ec] bg-[#f8fbff] px-4 focus-within:border-[#2463eb] focus-within:ring-3 focus-within:ring-[#eaf1ff]">
              <Search size={16} className="text-[#64717f]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по диалогам"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
          </div>
          <div data-tour="tour-inbox-statuses" className="grid grid-cols-4 items-center gap-0.5 overflow-hidden border-b border-[#e5eaf1] px-3 py-2.5">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`inbox-filter-button min-w-0 whitespace-nowrap rounded-full px-1.5 py-1.5 ${filter === item ? "bg-[#eaf1ff] font-semibold text-[#1546ad]" : "font-medium text-[#526071] hover:bg-[#f4f7fb] hover:text-[#101828]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.isLoading ? (
              <ListSkeleton />
            ) : list.error ? (
              <State
                title="Список диалогов не загрузился"
                text={getApiErrorMessage(
                  list.error,
                  "Ошибка запроса к серверу.",
                )}
                action="Повторить"
                onAction={() => list.refetch()}
              />
            ) : (list.data ?? []).length === 0 ? (
              <EmptyChatsState />
            ) : conversations.length === 0 ? (
              <State
                title="Ничего не найдено"
                text="Попробуйте изменить поиск или фильтр."
              />
            ) : (
              conversations.map((item) => (
                <ConversationItem
                  key={item.id}
                  item={item}
                  active={item.id === effectiveSelectedId}
                  onClick={() => {
                    if (item.id === effectiveSelectedId) return;
                    setSelectedId(item.id);
                    setReply("");
                    setAttachments([]);
                    if (fileInput.current) fileInput.current.value = "";
                    setActionMessage(null);
                  }}
                />
              ))
            )}
          </div>
        </section>

        <section data-tour="tour-inbox-thread" className="relative hidden min-h-0 min-w-0 flex-col overflow-hidden lg:flex">
          {!effectiveSelectedId ? (
            <State title="Выберите диалог" text="Переписка откроется здесь." />
          ) : thread.isLoading ? (
            <div className="relative grid flex-1 place-items-center">
              <Loader2 className="animate-spin text-[#2463eb]" />
            </div>
          ) : thread.error ? (
            <State
              title="Диалог не загрузился"
              text={getApiErrorMessage(thread.error, "Попробуйте ещё раз.")}
              action="Повторить"
              onAction={() => thread.refetch()}
            />
          ) : thread.data ? (
            <>
              <header className="relative flex h-[65px] shrink-0 items-center justify-between gap-4 border-b border-[#d9e1ec] bg-white px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <CustomerAvatar
                    name={thread.data.customer_name}
                    url={thread.data.avatar_url}
                    size="header"
                  />
                  <h2 className="truncate font-heading text-base font-extrabold tracking-[-0.02em]">
                    {thread.data.customer_name}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={thread.data.status} />
                  {isClosed(thread.data.status) ? (
                    <button
                      type="button"
                      onClick={() => exportConversation.mutate()}
                      disabled={exportConversation.isPending}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-3.5 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-50"
                    >
                      {exportConversation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      Скачать диалог
                    </button>
                  ) : null}
                </div>
              </header>
              <div
                ref={messageViewport}
                data-testid="inbox-message-viewport"
                onScroll={updateMessageViewportPosition}
                className={`relative flex min-h-0 flex-1 flex-col overflow-y-auto px-8 pt-6 ${attachments.length > 1 ? "pb-[190px]" : attachments.length === 1 ? "pb-[74px]" : "pb-2"}`}
              >
                <p className="self-center rounded-full border border-[#e5eaf1] bg-white px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">
                  Сегодня
                </p>
                <ConversationMessages
                  messages={mergeMessagesWithoutConfirmedOptimisticDuplicates(
                    thread.data.messages,
                    optimisticMessages[thread.data.id] ?? [],
                    messageRenderKeys,
                  )}
                  currentUserId={currentUser.data?.id}
                />
              </div>
              <form
                data-testid="inbox-composer-region"
                onSubmit={(event) => {
                  event.preventDefault();
                  const text = reply.trim();
                  if (!text && attachments.length === 0)
                    return;
                  setActionMessage(null);
                  sendReply(text, attachments);
                }}
                className="relative flex shrink-0 flex-col px-6 pb-[18px] pt-0"
              >
                {attachments.length > 0 ? (
                  <div
                    data-testid="inbox-attachment-preview-layer"
                    className="pointer-events-none absolute right-6 bottom-[78px] left-6 z-10"
                  >
                    <div className="flex max-h-[176px] w-fit max-w-full flex-col gap-1.5 overflow-y-auto pr-1">
                      {attachments.map((file, index) => (
                        <AttachmentPreview
                          key={`${attachmentFileKey(file)}\u0000${index}`}
                          file={file}
                          onRemove={() => removeAttachment(index)}
                          disabled={false}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
                <div
                  data-testid="inbox-composer"
                  className="flex min-h-[52px] w-full items-end gap-1.5 overflow-hidden rounded-[22px] border border-[#d9e1ec] bg-white px-1.5 py-1.5 shadow-[0_10px_22px_rgba(18,39,76,.07)] focus-within:border-[#2463eb] focus-within:ring-3 focus-within:ring-[#eaf1ff]"
                >
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    accept={attachmentAccept}
                    className="hidden"
                    aria-label="Выбрать вложение"
                    onChange={(event) => {
                      selectAttachments(Array.from(event.target.files ?? []));
                      event.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Прикрепить файл"
                    title="Прикрепить фото или документ"
                    onClick={() => fileInput.current?.click()}
                    className="flex size-10 shrink-0 self-end items-center justify-center rounded-full text-[#64717f] hover:bg-[#eaf1ff] disabled:opacity-40"
                  >
                    <Plus size={22} />
                  </button>
                  <textarea
                    ref={replyInput}
                    aria-label="Ответ клиенту"
                    value={reply}
                    onChange={(event) => {
                      setReply(event.target.value);
                      resizeComposer(event.currentTarget);
                    }}
                    placeholder="Введите сообщение"
                    rows={1}
                    className="inbox-composer-input min-h-10 max-h-40 flex-1 resize-none overflow-x-hidden overflow-y-hidden bg-transparent py-2.5 pl-1.5 pr-3 text-sm leading-5 outline-none [scrollbar-gutter:stable] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    aria-label="Отправить ответ"
                    disabled={!reply.trim() && attachments.length === 0}
                    className="flex size-10 shrink-0 self-end items-center justify-center rounded-full text-[#2463eb] hover:bg-[#eaf1ff] disabled:opacity-40"
                  >
                    <Send size={21} />
                  </button>
                </div>
              </form>
            </>
          ) : null}
          {actionMessage && (
            <p
              role="status"
              className={`absolute right-6 bottom-20 z-10 rounded-lg px-3 py-2 text-xs ${send.error ? "bg-[#fdeded] text-[#a72f2f]" : "bg-[#e8f7ef] text-[#16734a]"}`}
            >
              {actionMessage}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ConversationMessages({
  messages,
  currentUserId,
}: {
  messages: OptimisticConversationMessage[];
  currentUserId?: string;
}) {
  return messages.map((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];
    const groupStart = !previous || !messagesBelongToGroup(previous, message);
    const groupEnd = !next || !messagesBelongToGroup(message, next);
    const outgoing = isOutgoingMessage(message);
    const tailStart = outgoing
      ? !previous || !isOutgoingMessage(previous)
      : groupStart;

    return (
      <MessageBubble
        key={message.renderKey ?? message.id}
        message={message}
        currentUserId={currentUserId}
        groupStart={groupStart}
        groupEnd={groupEnd}
        tailStart={tailStart}
      />
    );
  });
}

const messageGroupWindowMs = 5 * 60 * 1_000;

function messagesBelongToGroup(
  previous: ConversationMessageResponse,
  current: ConversationMessageResponse,
) {
  if (messageGroupKey(previous) !== messageGroupKey(current)) return false;

  const previousTime = new Date(previous.created_at);
  const currentTime = new Date(current.created_at);
  const delta = currentTime.getTime() - previousTime.getTime();
  if (!Number.isFinite(delta) || delta < 0 || delta > messageGroupWindowMs)
    return false;

  return previousTime.toDateString() === currentTime.toDateString();
}

function messageGroupKey(message: ConversationMessageResponse) {
  const side = isOutgoingMessage(message) ? "outgoing" : "incoming";
  return `${side}:${message.sender_type}:${message.sender_user_id ?? "anonymous"}`;
}

function isOutgoingMessage(message: ConversationMessageResponse) {
  return (
    message.direction === "outbound" ||
    message.sender_type === "manager" ||
    message.sender_type === "ai"
  );
}

function mergeMessagesWithoutConfirmedOptimisticDuplicates(
  serverMessages: ConversationMessageResponse[],
  optimisticMessages: OptimisticConversationMessage[],
  renderKeys: Record<string, string>,
) {
  const serverMessageIds = new Set(
    serverMessages.map((message) => message.id),
  );
  const unresolvedOptimisticMessages = optimisticMessages.filter((message) => {
    return (
      !message.confirmedMessageId ||
      !serverMessageIds.has(message.confirmedMessageId)
    );
  });

  return [
    ...serverMessages.map((message) => ({
      ...message,
      renderKey: renderKeys[message.id] ?? message.id,
    })),
    ...unresolvedOptimisticMessages,
  ];
}

function findConfirmedMessageId(
  serverMessages: ConversationMessageResponse[],
  text: string,
  optimisticId: string,
  renderKeys: Record<string, string>,
) {
  for (let index = serverMessages.length - 1; index >= 0; index -= 1) {
    const message = serverMessages[index];
    if (
      isOutgoingMessage(message) &&
      message.text === text &&
      !renderKeys[message.id] &&
      message.id !== optimisticId
    ) {
      return message.id;
    }
  }

  return null;
}

function MessageBubble({
  message,
  currentUserId,
  groupStart,
  groupEnd,
  tailStart,
}: {
  message: ConversationMessageResponse;
  currentUserId?: string;
  groupStart: boolean;
  groupEnd: boolean;
  tailStart: boolean;
}) {
  const isCurrentUser =
    message.sender_type === "manager" &&
    Boolean(currentUserId) &&
    message.sender_user_id === currentUserId;
  const outgoing = isOutgoingMessage(message);
  const spacingStart = outgoing ? tailStart : groupStart;
  const spacing = spacingStart ? "mt-[18px]" : "mt-1";
  const attachments = messageAttachments(message);
  const hasOnlyDocumentAttachments =
    attachments.length > 0 &&
    attachments.every((attachment) => !isImageAttachment(attachment));
  const bubblePadding = hasOnlyDocumentAttachments
    ? "px-3 py-2.5"
    : "px-4 py-3.5";
  const outgoingShape = tailStart
    ? "rounded-[14px_4px_14px_14px]"
    : groupEnd
      ? "rounded-[14px_14px_4px_14px]"
      : "rounded-[14px_14px_6px_14px]";
  const incomingShape = groupStart
    ? "rounded-[4px_14px_14px_14px]"
    : groupEnd
      ? "rounded-[14px_14px_14px_4px]"
      : "rounded-[14px_14px_14px_6px]";
  if (isCurrentUser) {
    return (
      <article
        data-group-start={groupStart || undefined}
        data-group-end={groupEnd || undefined}
        data-tail-start={tailStart || undefined}
        className={`relative w-fit max-w-[min(560px,100%)] self-end border border-[#a9c4f2] bg-[#dce9ff] shadow-[0_10px_24px_rgba(24,73,161,.13)] ${bubblePadding} ${spacing} ${outgoingShape}`}
      >
        {tailStart ? <MessageTail outgoing /> : null}
        <MessageAttachments message={message} />
        {message.text ? (
          <p
            className={`wrap-break-word whitespace-pre-wrap text-sm leading-[1.6] text-[#0b1f3a] ${attachments.length > 0 ? (hasOnlyDocumentAttachments ? "mt-1.5" : "mt-2") : ""}`}
          >
            {message.text}
          </p>
        ) : null}
        <MessageMeta message={message} outgoing />
      </article>
    );
  }
  const isAutopilot = message.sender_type === "ai";

  return outgoing ? (
    <article
      data-group-start={groupStart || undefined}
      data-group-end={groupEnd || undefined}
      data-tail-start={tailStart || undefined}
      className={`relative w-fit max-w-[min(560px,100%)] self-end border border-[#a9c4f2] bg-[#dce9ff] shadow-[0_10px_24px_rgba(24,73,161,.13)] ${bubblePadding} ${spacing} ${outgoingShape}`}
    >
      {tailStart ? <MessageTail outgoing /> : null}
      {groupStart ? (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#124394]">
          {isAutopilot ? (
            <WandSparkles size={14} strokeWidth={1.75} aria-hidden="true" />
          ) : null}
          {isAutopilot ? "Автопилот" : "Менеджер"}
        </div>
      ) : null}
      <MessageAttachments message={message} />
      {message.text ? (
        <p
          className={`wrap-break-word whitespace-pre-wrap text-sm leading-[1.6] text-[#0b1f3a] ${attachments.length > 0 ? (hasOnlyDocumentAttachments ? "mt-1.5" : "mt-2") : ""}`}
        >
          {message.text}
        </p>
      ) : null}
      <MessageMeta message={message} outgoing />
    </article>
  ) : (
    <article
      data-group-start={groupStart || undefined}
      data-group-end={groupEnd || undefined}
      data-tail-start={tailStart || undefined}
      className={`relative w-fit max-w-[min(560px,100%)] self-start border border-[#e5eaf1] bg-white shadow-[0_10px_22px_rgba(18,39,76,.07)] ${bubblePadding} ${spacing} ${incomingShape}`}
    >
      {tailStart ? <MessageTail /> : null}
      <MessageAttachments message={message} />
      {message.text ? (
        <p
          className={`wrap-break-word whitespace-pre-wrap text-sm leading-[1.6] text-[#101828] ${attachments.length > 0 ? (hasOnlyDocumentAttachments ? "mt-1.5" : "mt-2") : ""}`}
        >
          {message.text}
        </p>
      ) : null}
      <MessageMeta message={message} />
    </article>
  );
}

function MessageTail({ outgoing = false }: { outgoing?: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-message-tail={outgoing ? "outgoing" : "incoming"}
      className={`absolute top-[-1px] h-4 w-3 ${
        outgoing
          ? "-right-[10px]"
          : "-left-[10px] -scale-x-100"
      }`}
    >
      <svg viewBox="0 0 12 16" className="block h-4 w-3" fill="none">
        <path
          d="M0.5 0.5H11L0.5 13Z"
          fill={outgoing ? "#dce9ff" : "#ffffff"}
          stroke="none"
        />
        <path
          d="M0.5 0.5H11L0.5 13"
          fill="none"
          stroke={outgoing ? "#a9c4f2" : "#e5eaf1"}
        />
      </svg>
    </span>
  );
}

function AttachmentPreview({
  file,
  onRemove,
  disabled,
}: {
  file: File;
  onRemove: () => void;
  disabled: boolean;
}) {
  const previewUrl = useMemo(
    () => (isImageFile(file) ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  return (
    <div className="pointer-events-auto flex w-fit max-w-full items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white p-2 pr-1 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Предпросмотр вложения"
          className="size-10 rounded-md object-cover"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eaf1ff] text-[#1546ad]">
          <FileText size={19} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block max-w-64 truncate text-xs font-semibold">
          {file.name}
        </span>
        <span className="block text-[11px] text-[#64717f]">
          {formatBytes(file.size)}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Удалить вложение ${file.name}`}
        onClick={onRemove}
        disabled={disabled}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#64717f] hover:bg-[#f4f7fb] disabled:opacity-40"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function MessageAttachments({
  message,
}: {
  message: ConversationMessageResponse;
}) {
  const attachments = messageAttachments(message);
  if (attachments.length === 0) return null;
  const hasOnlyDocuments = attachments.every(
    (attachment) => !isImageAttachment(attachment),
  );

  return (
    <div
      className={
        hasOnlyDocuments
          ? "mt-0 flex flex-col gap-1.5"
          : `${message.text ? "mt-0" : "mt-2"} flex flex-col gap-2`
      }
    >
      {attachments.map((attachment, index) => (
        <AuthenticatedAttachment
          key={
            attachment.id ??
            attachment.download_url ??
            `${attachmentName(attachment)}-${index}`
          }
          attachment={attachment}
        />
      ))}
    </div>
  );
}

function messageAttachments(message: ConversationMessageResponse) {
  return normalizeAttachments(
    (message as ConversationMessageResponse & { attachments?: unknown })
      .attachments,
  );
}

function isImageAttachment(attachment: ConversationAttachment) {
  const name = attachmentName(attachment);
  return (
    isImageMime(attachment.content_type ?? attachment.mime_type ?? "") ||
    isImageName(name)
  );
}

function AuthenticatedAttachment({
  attachment,
}: {
  attachment: ConversationAttachment;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const downloadUrl = attachment.download_url ?? attachment.url;
  const name = attachmentName(attachment);
  const image = isImageAttachment(attachment);

  async function openAttachment() {
    if (!downloadUrl || isLoading) return;
    setIsLoading(true);
    try {
      const blob = await getAuthenticatedAttachment(downloadUrl);
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = name;
      anchor.click();
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );

  return (
    <button
      type="button"
      onClick={() => void openAttachment()}
      disabled={!downloadUrl || isLoading}
      aria-label={isLoading ? `Скачивание ${name}` : `Скачать ${name}`}
      className={`flex max-w-sm items-center rounded-lg border border-[#cddfff] bg-white/70 text-left hover:bg-white disabled:cursor-default ${
        image ? "gap-2 p-2" : "gap-1.5 p-1.5"
      }`}
    >
      {image && objectUrl ? (
        <img
          src={objectUrl}
          alt={name}
          className="size-12 rounded-md object-cover"
        />
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center rounded-md bg-[#eaf1ff] text-[#1546ad] ${
            image ? "size-10" : "size-9"
          }`}
        >
          {isLoading ? (
            <Loader2 size={image ? 18 : 17} className="animate-spin" />
          ) : (
            <FileText size={image ? 18 : 17} />
          )}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{name}</span>
        {typeof attachment.size_bytes === "number" ? (
          <span className="text-[11px] text-[#64717f]">
            {formatBytes(attachment.size_bytes)}
          </span>
        ) : null}
      </span>
      <Download
        aria-hidden="true"
        size={16}
        strokeWidth={1.8}
        className="ml-auto shrink-0 text-[#2463eb]"
      />
    </button>
  );
}

function normalizeAttachments(value: unknown): ConversationAttachment[] {
  if (Array.isArray(value))
    return value.filter((item): item is ConversationAttachment =>
      Boolean(item && typeof item === "object"),
    );
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.items)) return normalizeAttachments(record.items);
  return Object.values(record).filter((item): item is ConversationAttachment =>
    Boolean(item && typeof item === "object"),
  );
}

function attachmentName(attachment: ConversationAttachment) {
  return attachment.name ?? attachment.filename ?? "Вложение";
}

function attachmentFileKey(file: File) {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}\u0000${file.type}`;
}

function isImageFile(file: File) {
  return isImageMime(file.type) || isImageName(file.name);
}

function isImageMime(value: string) {
  return value.toLowerCase().startsWith("image/");
}

function isImageName(value: string) {
  return /\.(?:jpe?g|png|webp)$/i.test(value);
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} Б`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} КБ`;
  return `${(value / (1024 * 1024)).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} МБ`;
}

function MessageMeta({
  message,
  outgoing = false,
}: {
  message: ConversationMessageResponse;
  outgoing?: boolean;
}) {
  const state = message.status.toLowerCase();
  const isRead = state === "read" || state === "seen";
  const isSent = isRead || state === "sent" || state === "delivered";
  const isFailed = state === "failed";
  const label = isRead
    ? "Прочитано"
    : isSent
      ? "Отправлено"
      : isFailed
        ? "Ошибка отправки"
        : "Отправляется";
  const receiptTone = isFailed
    ? "text-[#c43d3d]"
    : isRead
      ? "text-[#18a86b]"
      : "text-[#253145]";

  return (
    <p className="mt-1.5 flex min-h-4 items-center justify-end gap-1 text-right text-[11px] leading-none tabular-nums text-[#596779]">
      <span className={outgoing ? "text-right" : undefined}>
        {messageTime(message.created_at)}
      </span>
      {outgoing ? (
        <span
          aria-label={label}
          title={label}
          className={`relative inline-block h-4 w-5 shrink-0 ${receiptTone}`}
        >
          {isFailed ? (
            <AlertCircle
              className="absolute left-1 top-px"
              size={15}
              strokeWidth={2}
            />
          ) : (
            <DeliveryReceipt isSent={isSent} isRead={isRead} />
          )}
        </span>
      ) : null}
    </p>
  );
}

function DeliveryReceipt({
  isSent,
  isRead,
}: {
  isSent: boolean;
  isRead: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 16"
      className="absolute inset-0 h-4 w-5"
      fill="none"
    >
      <path
        d="M2.5 7.5 5.3 10.2 11.2 2.8"
        stroke={isSent ? "#18a86b" : "#253145"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 7.5 10.2 10.2 16.1 2.8"
        stroke={isRead ? "#18a86b" : "#253145"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function hasAwaitingReceipt(value: unknown) {
  if (!value || typeof value !== "object" || !("messages" in value))
    return false;
  const messages = (value as { messages?: unknown }).messages;
  return (
    Array.isArray(messages) &&
    messages.some((message) => {
      if (!message || typeof message !== "object") return false;
      const item = message as { direction?: unknown; status?: unknown };
      return (
        item.direction === "outbound" &&
        typeof item.status === "string" &&
        ["pending", "sent", "delivered"].includes(item.status.toLowerCase())
      );
    })
  );
}

function StatusBadge({ status }: { status: string }) {
  if (needsHuman(status))
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#fff5df] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#94600b]">
        <span className="size-1.5 rounded-full bg-[#e89120]" />
        Нужен человек
      </span>
    );
  return (
    <span
      className={`rounded-[5px] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[.08em] ${statusTone(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function ConversationItem({
  item,
  active,
  onClick,
}: {
  item: ConversationResponse;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`block w-full border-b border-[#e5eaf1] px-4 py-3.5 text-left transition hover:bg-[#f8fbff] ${active ? "bg-[#f8fbff]" : ""}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <CustomerAvatar
          name={item.customer_name}
          url={item.avatar_url}
          size="list"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-5">
              {item.customer_name}
            </span>
            <span className="flex shrink-0 flex-col items-center gap-1 text-xs tabular-nums text-[#64717f]">
              <span>{conversationListTime(item.last_message_at)}</span>
              {item.unread_count > 0 ? (
                <span
                  aria-label="Непрочитанный диалог"
                  className="size-1.5 rounded-full bg-[#2463eb]"
                />
              ) : null}
            </span>
          </div>
          <p className="mt-1 truncate text-[13px] leading-5 text-[#526071]">
            {item.last_message_preview || "Новый диалог"}
          </p>
          <div className="mt-1.5 flex gap-1.5">
            <span
              className={`rounded-[5px] px-[7px] py-0.5 text-[11px] font-bold uppercase tracking-[.04em] ${statusTone(item.status)}`}
            >
              {statusLabel(item.status)}
            </span>
            <span className="rounded-[5px] bg-[#f4f7fb] px-[7px] py-0.5 text-[11px] font-bold uppercase tracking-[.04em] text-[#526071]">
              {channelLabel(item.channel_type)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function CustomerAvatar({
  name,
  url,
  size,
}: {
  name: string;
  url?: string | null;
  size: "list" | "header";
}) {
  if (url) {
    return (
      <AuthenticatedCustomerAvatar
        key={url}
        name={name}
        url={url}
        size={size}
      />
    );
  }

  return <CustomerAvatarShell name={name} size={size} />;
}

function AuthenticatedCustomerAvatar({
  name,
  url,
  size,
}: {
  name: string;
  url: string;
  size: "list" | "header";
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;

    axiosInstance
      .get<Blob>(url, { responseType: "blob", signal: controller.signal })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (!imageUrl || failed) {
    return <CustomerAvatarShell name={name} size={size} />;
  }

  return (
    <CustomerAvatarShell name={name} size={size}>
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API response is exposed as a local blob URL. */}
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 size-full object-cover"
        onError={() => setFailed(true)}
      />
    </CustomerAvatarShell>
  );
}

function CustomerAvatarShell({
  name,
  size,
  children,
}: {
  name: string;
  size: "list" | "header";
  children?: React.ReactNode;
}) {
  const sizeClass = size === "header" ? "size-10 text-sm" : "size-10 text-xs";

  return (
    <span
      aria-label={`Аватар ${name}`}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#cddfff] bg-[#eaf1ff] font-heading font-extrabold text-[#1546ad] ${sizeClass}`}
    >
      {children ?? initials(name)}
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="h-[84px] animate-pulse rounded-lg bg-[#e5eaf1]"
        />
      ))}
    </div>
  );
}
function EmptyChatsState() {
  return (
    <div className="m-4 flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-[#f8fbff] px-8 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-[#d9e1ec] bg-white text-[#2463eb]">
        <Inbox size={22} strokeWidth={1.75} />
      </span>
      <h3 className="mt-3 font-heading text-base font-extrabold tracking-[-0.02em] text-[#101828]">
        У вас ещё нет ни одного чата
      </h3>
      <p className="mt-2 max-w-[280px] text-sm leading-[1.6] text-[#526071]">
        Новые обращения появятся здесь после подключения канала.
      </p>
    </div>
  );
}
function State({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="relative flex min-h-64 flex-1 flex-col items-center justify-center px-6 text-center">
      <h3 className="font-extrabold">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-sm text-[#526071]">{text}</p>}
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-semibold text-white"
        >
          {action}
        </button>
      )}
    </div>
  );
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
function isClosed(status: string) {
  return status.toLowerCase().includes("clos");
}
function isAnswered(status: string) {
  const value = status.toLowerCase();
  return (
    value === "auto" ||
    value.includes("answer") ||
    value.includes("replied") ||
    value.includes("ai_replied")
  );
}
function needsHuman(status: string) {
  const value = status.toLowerCase();
  return value === "open" || value.includes("escalat");
}
function statusTone(status: string) {
  if (isClosed(status)) return "bg-[#f4f7fb] text-[#526071]";
  if (needsHuman(status)) return "bg-[#fff5df] text-[#94600b]";
  if (isAnswered(status)) return "bg-[#e6f7f0] text-[#0c7a4e]";
  return "bg-[#f4f7fb] text-[#526071]";
}
function channelLabel(channel: string) {
  const value = channel.toLowerCase();
  if (value.includes("telegram")) return "Telegram";
  if (value.includes("whatsapp")) return "WhatsApp";
  if (value.includes("avito")) return "Avito";
  if (value === "vk" || value.includes("vkontakte")) return "VK";
  if (value.includes("instagram")) return "Instagram";
  return channel || "Канал";
}
function statusLabel(status: string) {
  const value = status.toLowerCase();
  if (needsHuman(value)) return "Нужен человек";
  if (isClosed(value)) return "Закрыт";
  if (isAnswered(value)) return "Отвечено";
  return status || "Нужен человек";
}
