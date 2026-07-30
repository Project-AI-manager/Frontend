import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InboxPage from "@/app/inbox/page";
import { conversationListTime } from "@/lib/inbox-time";
import { axiosInstance } from "@/lib/api/client";

const api = vi.hoisted(() => ({
  listConversationItemsApiV1ConversationsGet: vi.fn(),
  getConversationApiV1ConversationsConversationIdGet: vi.fn(),
  replyApiV1ConversationsConversationIdReplyPost: vi.fn(),
  escalateApiV1ConversationsConversationIdEscalatePost: vi.fn(),
  closeApiV1ConversationsConversationIdClosePost: vi.fn(),
}));

const usersApi = vi.hoisted(() => ({
  meApiV1UsersMeGet: vi.fn(),
}));
const conversationActions = vi.hoisted(() => ({
  markConversationRead: vi.fn(),
}));
const attachmentApi = vi.hoisted(() => ({
  replyToConversationWithFile: vi.fn(),
  getAuthenticatedAttachment: vi.fn(),
  downloadConversationExport: vi.fn(),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api/generated/conversations/conversations", () => ({
  getConversations: () => api,
}));

vi.mock("@/lib/api/generated/users/users", () => ({
  getUsers: () => usersApi,
}));

vi.mock("@/lib/api/conversations", () => conversationActions);
vi.mock("@/lib/api/conversation-attachments", () => attachmentApi);
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    ...render(
    <QueryClientProvider client={client}>
      <InboxPage />
    </QueryClientProvider>,
    ),
    client,
  };
}

describe("InboxPage live actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersApi.meApiV1UsersMeGet.mockResolvedValue({
      id: "current-user",
      tenant_id: "tenant-1",
      email: "manager@example.com",
      full_name: "Текущий пользователь",
      role: "manager",
      status: "active",
    });
    api.listConversationItemsApiV1ConversationsGet.mockResolvedValue([
      {
        id: "conversation-1",
        channel_id: "telegram",
        channel_type: "telegram",
        customer_id: "customer-1",
        customer_name: "Анна",
        status: "open",
        last_message_at: "2026-07-21T10:00:00Z",
        last_message_preview: "Когда будет доставка?",
        unread_count: 0,
      },
    ]);
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValue({
      id: "conversation-1",
      channel_id: "telegram",
      channel_type: "telegram",
      customer_id: "customer-1",
      customer_name: "Анна",
      status: "answered",
      last_message_at: "2026-07-21T10:00:00Z",
      last_message_preview: "Когда будет доставка?",
      unread_count: 0,
      messages: [
        {
          id: "message-1",
          text: "Когда будет доставка?",
          direction: "inbound",
          sender_type: "customer",
          sender_user_id: null,
          status: "delivered",
          created_at: "2026-07-21T10:00:00Z",
        },
        {
          id: "message-2",
          text: "Доставим завтра.",
          direction: "outbound",
          sender_type: "manager",
          sender_user_id: "current-user",
          status: "delivered",
          created_at: "2026-07-21T10:01:00Z",
        },
      ],
    });
    api.replyApiV1ConversationsConversationIdReplyPost.mockResolvedValue({});
    api.escalateApiV1ConversationsConversationIdEscalatePost.mockResolvedValue(
      {},
    );
    api.closeApiV1ConversationsConversationIdClosePost.mockResolvedValue({});
    conversationActions.markConversationRead.mockResolvedValue({});
    attachmentApi.replyToConversationWithFile.mockResolvedValue({});
    attachmentApi.getAuthenticatedAttachment.mockResolvedValue(
      new Blob(["file"]),
    );
    attachmentApi.downloadConversationExport.mockResolvedValue(
      new Blob(["dialog"]),
    );
  });

  it("formats conversation list time relative to the local day", () => {
    const now = new Date(2026, 6, 30, 15, 0);

    expect(conversationListTime("2026-07-30T09:05:00", now)).toBe("09:05");
    expect(conversationListTime("2026-07-29T23:55:00", now)).toBe("Вчера");
    expect(conversationListTime("2026-07-03T10:00:00", now)).toBe("03.07");
    expect(conversationListTime("2025-12-31T10:00:00", now)).toBe("31.12.25");
  });

  it("grows and shrinks the composer while Enter only adds a new line", async () => {
    renderPage();

    const input = await screen.findByLabelText("Ответ клиенту");
    const composer = screen.getByTestId("inbox-composer");
    const viewport = screen.getByTestId("inbox-message-viewport");
    const composerRegion = screen.getByTestId("inbox-composer-region");
    const plus = screen.getByRole("button", { name: "Прикрепить файл" });
    const send = screen.getByRole("button", { name: "Отправить ответ" });
    expect(composer).toHaveClass(
      "items-end",
      "overflow-hidden",
      "rounded-[22px]",
      "py-1.5",
    );
    expect(viewport).toHaveClass("pt-6", "pb-2");
    expect(viewport).not.toHaveClass("py-6");
    expect(composerRegion).toHaveClass("pt-0");
    expect(composerRegion).not.toHaveClass("pt-3.5");
    expect(plus).toHaveClass("self-end");
    expect(send).toHaveClass("self-end");
    expect(input).toHaveClass(
      "pr-3",
      "overflow-x-hidden",
      "[scrollbar-gutter:stable]",
    );
    let scrollHeight = 96;
    Object.defineProperty(input, "scrollHeight", {
      configurable: true,
      get: () => scrollHeight,
    });
    fireEvent.change(input, {
      target: { value: "Первая строка\nВторая строка" },
    });
    expect(input).toHaveStyle({ height: "96px", overflowY: "hidden" });

    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(
      api.replyApiV1ConversationsConversationIdReplyPost,
    ).not.toHaveBeenCalled();

    scrollHeight = 36;
    fireEvent.change(input, { target: { value: "Коротко" } });
    expect(input).toHaveStyle({ height: "36px", overflowY: "hidden" });

    scrollHeight = 220;
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveStyle({ height: "40px", overflowY: "hidden" });

    fireEvent.change(input, {
      target: { value: "Очень длинный текст\n".repeat(9) },
    });
    expect(input).toHaveStyle({ height: "160px", overflowY: "auto" });
  });

  it("shows an unread dot under the time and clears it when the chat is opened", async () => {
    const conversationItems = [
      {
        id: "conversation-1",
        channel_id: "telegram",
        channel_type: "telegram",
        customer_id: "customer-1",
        customer_name: "Анна",
        status: "answered",
        last_message_at: "2026-07-21T10:00:00Z",
        last_message_preview: "Первый диалог",
        unread_count: 0,
      },
      {
        id: "conversation-2",
        channel_id: "telegram",
        channel_type: "telegram",
        customer_id: "customer-2",
        customer_name: "Мария",
        status: "open",
        last_message_at: "2026-07-21T10:03:00Z",
        last_message_preview: "Новое сообщение",
        unread_count: 1,
      },
    ];
    api.listConversationItemsApiV1ConversationsGet.mockImplementation(
      async () => conversationItems,
    );
    conversationActions.markConversationRead.mockImplementation(async () => {
      conversationItems[1] = { ...conversationItems[1], unread_count: 0 };
      return {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        id: "conversation-2",
        customer_name: "Мария",
        unread_count: 0,
      };
    });

    renderPage();

    const maria = await screen.findByRole("button", { name: /Мария/ });
    expect(
      within(maria).getByLabelText("Непрочитанный диалог"),
    ).toBeInTheDocument();

    fireEvent.click(maria);

    await waitFor(() =>
      expect(conversationActions.markConversationRead).toHaveBeenCalledWith(
        "conversation-2",
      ),
    );
    await waitFor(() =>
      expect(
        within(maria).queryByLabelText("Непрочитанный диалог"),
      ).not.toBeInTheDocument(),
    );
  });

  it("loads the Telegram avatar through the authenticated API and reuses it in the list and header", async () => {
    api.listConversationItemsApiV1ConversationsGet.mockResolvedValueOnce([
      {
        ...(await api.listConversationItemsApiV1ConversationsGet())[0],
        avatar_url: "/api/v1/conversations/conversation-1/avatar",
      },
    ]);
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        avatar_url: "/api/v1/conversations/conversation-1/avatar",
      },
    );
    const blobUrl = "blob:customer-avatar";
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue(blobUrl);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(axiosInstance, "get").mockResolvedValue({
      data: new Blob(["avatar"], { type: "image/jpeg" }),
    });

    renderPage();

    const avatars = await screen.findAllByLabelText("Аватар Анна");
    await waitFor(() =>
      expect(
        avatars.every((avatar) => avatar.querySelector("img")?.src === blobUrl),
      ).toBe(true),
    );
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/avatar",
      expect.objectContaining({ responseType: "blob" }),
    );
  });

  it("loads the live thread and sends a manager reply", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Анна", level: 2 }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Ответ клиенту"), {
      target: { value: "Доставим завтра." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить ответ" }));

    await waitFor(() =>
      expect(
        api.replyApiV1ConversationsConversationIdReplyPost,
      ).toHaveBeenCalledWith("conversation-1", { text: "Доставим завтра." }),
    );
  });

  it("opens the initially loaded conversation at the latest message without smooth scrolling", async () => {
    const scrollTopByElement = new WeakMap<HTMLElement, number>();
    const originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollHeight",
    );
    const originalScrollTop = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollTop",
    );
    Object.defineProperties(HTMLElement.prototype, {
      scrollHeight: { configurable: true, get: () => 1_000 },
      scrollTop: {
        configurable: true,
        get() {
          return scrollTopByElement.get(this) ?? 0;
        },
        set(value: number) {
          scrollTopByElement.set(this, value);
        },
      },
    });

    try {
      const { client } = renderPage();

      const viewport = await screen.findByTestId("inbox-message-viewport");
      expect(viewport.scrollTop).toBe(1_000);

      viewport.scrollTop = 120;
      await act(async () => {
        client.setQueryData(["conversation", "conversation-1"], (current) => ({
          ...(current as Record<string, unknown>),
          last_message_at: "2026-07-21T10:02:00Z",
        }));
      });
      expect(viewport.scrollTop).toBe(120);
    } finally {
      if (originalScrollHeight) {
        Object.defineProperty(
          HTMLElement.prototype,
          "scrollHeight",
          originalScrollHeight,
        );
      } else {
        delete (HTMLElement.prototype as { scrollHeight?: number })
          .scrollHeight;
      }
      if (originalScrollTop) {
        Object.defineProperty(
          HTMLElement.prototype,
          "scrollTop",
          originalScrollTop,
        );
      } else {
        delete (HTMLElement.prototype as { scrollTop?: number }).scrollTop;
      }
    }
  });

  it("smoothly scrolls after sending only when the message viewport is already near the bottom", async () => {
    api.replyApiV1ConversationsConversationIdReplyPost.mockImplementation(
      () => new Promise(() => undefined),
    );
    renderPage();

    await screen.findByRole("heading", { level: 2 });
    const viewport = screen.getByTestId("inbox-message-viewport");
    const scrollTo = vi.fn();
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, value: 1_000 },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, writable: true, value: 590 },
      scrollTo: { configurable: true, value: scrollTo },
    });

    const composerRegion = screen.getByTestId("inbox-composer-region");
    const input = composerRegion.querySelector("textarea")!;
    fireEvent.change(input, { target: { value: "near-bottom message" } });
    fireEvent.submit(composerRegion);

    await screen.findByText("near-bottom message");
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        top: 1_000,
        behavior: "smooth",
      }),
    );

    scrollTo.mockClear();
    viewport.scrollTop = 100;
    fireEvent.scroll(viewport);
    fireEvent.change(input, { target: { value: "scrolled-up message" } });
    fireEvent.submit(composerRegion);

    await screen.findByText("scrolled-up message");
    await act(async () => undefined);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(viewport.scrollTop).toBe(100);
  });

  it("smoothly follows new inbound messages only while the viewport is near the bottom", async () => {
    const { client } = renderPage();

    await screen.findByRole("heading", { level: 2 });
    const viewport = screen.getByTestId("inbox-message-viewport");
    const scrollTo = vi.fn();
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, value: 1_000 },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, writable: true, value: 590 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    fireEvent.scroll(viewport);

    await act(async () => {
      client.setQueryData(["conversation", "conversation-1"], (current) => {
        const conversation = current as {
          messages: Array<Record<string, unknown>>;
        };
        return {
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              id: "inbound-message-2",
              text: "New customer message",
              direction: "inbound",
              sender_type: "customer",
              sender_user_id: null,
              status: "delivered",
              created_at: "2026-07-21T10:02:00Z",
            },
          ],
        };
      });
    });

    await screen.findByText("New customer message");
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        top: 1_000,
        behavior: "smooth",
      }),
    );

    scrollTo.mockClear();
    viewport.scrollTop = 100;
    fireEvent.scroll(viewport);
    await act(async () => {
      client.setQueryData(["conversation", "conversation-1"], (current) => {
        const conversation = current as {
          messages: Array<Record<string, unknown>>;
        };
        return {
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              id: "inbound-message-3",
              text: "Another customer message",
              direction: "inbound",
              sender_type: "customer",
              sender_user_id: null,
              status: "delivered",
              created_at: "2026-07-21T10:03:00Z",
            },
          ],
        };
      });
    });

    expect(scrollTo).not.toHaveBeenCalled();
    expect(viewport.scrollTop).toBe(100);
  });

  it("smoothly follows a new Autopilot reply only while the viewport is near the bottom", async () => {
    const { client } = renderPage();

    await screen.findByRole("heading", { level: 2 });
    const viewport = screen.getByTestId("inbox-message-viewport");
    const scrollTo = vi.fn();
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, value: 1_000 },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, writable: true, value: 590 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    fireEvent.scroll(viewport);

    await act(async () => {
      client.setQueryData(["conversation", "conversation-1"], (current) => {
        const conversation = current as { messages: Array<Record<string, unknown>> };
        return {
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              id: "autopilot-message-1",
              text: "Autopilot answer",
              direction: "outbound",
              sender_type: "ai",
              sender_user_id: null,
              status: "sent",
              created_at: "2026-07-21T10:02:00Z",
            },
          ],
        };
      });
    });

    await screen.findByText("Autopilot answer");
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        top: 1_000,
        behavior: "smooth",
      }),
    );
  });

  it("preserves line breaks in sent and rendered messages", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    const multiline = "Первая строка\nВторая строка";
    fireEvent.change(screen.getByLabelText("Ответ клиенту"), {
      target: { value: multiline },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить ответ" }));

    const optimisticMessage = await screen.findByText((_, element) =>
      element?.tagName === "P" && element.textContent === multiline,
    );
    expect(optimisticMessage).toHaveClass("whitespace-pre-wrap");
    await waitFor(() =>
      expect(
        api.replyApiV1ConversationsConversationIdReplyPost,
      ).toHaveBeenCalledWith("conversation-1", { text: multiline }),
    );
  });

  it("renders optimistic time and pending checks before the reply request finishes", async () => {
    api.replyApiV1ConversationsConversationIdReplyPost.mockImplementationOnce(
      () => new Promise(() => undefined),
    );
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    fireEvent.change(screen.getByLabelText("Ответ клиенту"), {
      target: { value: "Optimistic pending reply" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить ответ" }));

    const text = await screen.findByText("Optimistic pending reply");
    const bubble = within(text.closest("article")!);
    expect(bubble.getByText(/^\d{2}:\d{2}$/)).toBeInTheDocument();
    const receipt = bubble.getByLabelText("Отправляется");
    const paths = receipt.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    expect(paths[0]).toHaveAttribute("stroke", "#253145");
    expect(paths[1]).toHaveAttribute("stroke", "#253145");
    expect(text.closest("article")).toHaveClass("mt-1");
  });

  it("keeps the outgoing bubble DOM stable when a pending reply becomes sent", async () => {
    let resolveReply!: (value: {
      conversation: Record<string, unknown>;
      delivered: boolean;
      message: Record<string, unknown>;
    }) => void;
    api.replyApiV1ConversationsConversationIdReplyPost.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveReply = resolve;
        }),
    );
    renderPage();

    await screen.findByRole("heading", { level: 2 });
    const composerRegion = screen.getByTestId("inbox-composer-region");
    fireEvent.change(composerRegion.querySelector("textarea")!, {
      target: { value: "Stable receipt transition" },
    });
    fireEvent.submit(composerRegion);

    const pendingText = await screen.findByText("Stable receipt transition");
    const pendingArticle = pendingText.closest("article")!;
    const pendingMeta = pendingArticle.lastElementChild!;
    const pendingReceipt = pendingMeta.lastElementChild!;
    const pendingSvg = pendingReceipt.querySelector("svg")!;
    const pendingContract = {
      articleClass: pendingArticle.className,
      grouping: [
        pendingArticle.getAttribute("data-group-start"),
        pendingArticle.getAttribute("data-group-end"),
        pendingArticle.getAttribute("data-tail-start"),
      ],
      childOrder: Array.from(pendingArticle.children).map((child) => ({
        tag: child.tagName,
        className: child.className,
      })),
      metaClass: pendingMeta.className,
      receiptClass: pendingReceipt.className,
      svgClass: pendingSvg.getAttribute("class"),
      svgViewBox: pendingSvg.getAttribute("viewBox"),
    };
    expect(pendingSvg.querySelectorAll('path[stroke="#253145"]')).toHaveLength(
      2,
    );

    const sentAt = new Date().toISOString();
    await act(async () => {
      resolveReply({
        delivered: true,
        message: {
          id: "server-message-3",
          text: "Stable receipt transition",
          direction: "outbound",
          sender_type: "manager",
          sender_user_id: "current-user",
          status: "sent",
          created_at: sentAt,
        },
        conversation: {
          id: "conversation-1",
          channel_id: "telegram",
          channel_type: "telegram",
          customer_id: "customer-1",
          customer_name: "Customer",
          status: "answered",
          last_message_at: sentAt,
          last_message_preview: "Stable receipt transition",
          unread_count: 0,
          messages: [
            {
              id: "message-1",
              text: "Customer question",
              direction: "inbound",
              sender_type: "customer",
              sender_user_id: null,
              status: "delivered",
              created_at: "2026-07-21T10:00:00Z",
            },
            {
              id: "message-2",
              text: "Previous manager reply",
              direction: "outbound",
              sender_type: "manager",
              sender_user_id: "current-user",
              status: "delivered",
              created_at: "2026-07-21T10:01:00Z",
            },
            {
              id: "server-message-3",
              text: "Stable receipt transition",
              direction: "outbound",
              sender_type: "manager",
              sender_user_id: "current-user",
              status: "sent",
              created_at: sentAt,
            },
          ],
        },
      });
    });

    await waitFor(() => {
      const article = screen
        .getByText("Stable receipt transition")
        .closest("article")!;
      expect(
        article.querySelectorAll('path[stroke="#18a86b"]'),
      ).toHaveLength(1);
    });
    const sentArticle = screen
      .getByText("Stable receipt transition")
      .closest("article")!;
    const sentMeta = sentArticle.lastElementChild!;
    const sentReceipt = sentMeta.lastElementChild!;
    const sentSvg = sentReceipt.querySelector("svg")!;
    const sentContract = {
      articleClass: sentArticle.className,
      grouping: [
        sentArticle.getAttribute("data-group-start"),
        sentArticle.getAttribute("data-group-end"),
        sentArticle.getAttribute("data-tail-start"),
      ],
      childOrder: Array.from(sentArticle.children).map((child) => ({
        tag: child.tagName,
        className: child.className,
      })),
      metaClass: sentMeta.className,
      receiptClass: sentReceipt.className,
      svgClass: sentSvg.getAttribute("class"),
      svgViewBox: sentSvg.getAttribute("viewBox"),
    };

    expect(sentContract).toEqual(pendingContract);
    expect(sentArticle).toBe(pendingArticle);
  });

  it("never removes the outgoing bubble while its pending state is confirmed", async () => {
    let resolveReply!: (value: {
      conversation: Record<string, unknown>;
      delivered: boolean;
      message: Record<string, unknown>;
    }) => void;
    api.replyApiV1ConversationsConversationIdReplyPost.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveReply = resolve;
        }),
    );
    renderPage();

    await screen.findByRole("heading", { level: 2 });
    const viewport = screen.getByTestId("inbox-message-viewport");
    const composerRegion = screen.getByTestId("inbox-composer-region");
    fireEvent.change(composerRegion.querySelector("textarea")!, {
      target: { value: "No transient receipt gap" },
    });
    fireEvent.submit(composerRegion);

    await screen.findByText("No transient receipt gap");
    const observedCounts: number[] = [];
    const recordCount = () => {
      observedCounts.push(
        Array.from(viewport.querySelectorAll("article")).filter((article) =>
          article.textContent?.includes("No transient receipt gap"),
        ).length,
      );
    };
    recordCount();
    const observer = new MutationObserver(recordCount);
    observer.observe(viewport, { childList: true, subtree: true });

    const sentAt = new Date().toISOString();
    await act(async () => {
      resolveReply({
        delivered: true,
        message: {
          id: "server-message-without-gap",
          text: "No transient receipt gap",
          direction: "outbound",
          sender_type: "manager",
          sender_user_id: "current-user",
          status: "sent",
          created_at: sentAt,
        },
        conversation: {
          id: "conversation-1",
          channel_id: "telegram",
          channel_type: "telegram",
          customer_id: "customer-1",
          customer_name: "Customer",
          status: "answered",
          last_message_at: sentAt,
          last_message_preview: "No transient receipt gap",
          unread_count: 0,
          messages: [
            {
              id: "message-1",
              text: "Customer question",
              direction: "inbound",
              sender_type: "customer",
              sender_user_id: null,
              status: "delivered",
              created_at: "2026-07-21T10:00:00Z",
            },
            {
              id: "message-2",
              text: "Previous manager reply",
              direction: "outbound",
              sender_type: "manager",
              sender_user_id: "current-user",
              status: "delivered",
              created_at: "2026-07-21T10:01:00Z",
            },
            {
              id: "server-message-without-gap",
              text: "No transient receipt gap",
              direction: "outbound",
              sender_type: "manager",
              sender_user_id: "current-user",
              status: "sent",
              created_at: sentAt,
            },
          ],
        },
      });
    });

    await waitFor(() => {
      expect(
        within(screen.getByText("No transient receipt gap").closest("article")!)
          .getByLabelText("Отправлено"),
      ).toBeInTheDocument();
    });
    recordCount();
    observer.disconnect();

    expect(observedCounts.length).toBeGreaterThan(0);
    expect(observedCounts.every((count) => count === 1)).toBe(true);
  });

  it("keeps a sent bubble stable when the API omits the optional message field", async () => {
    let resolveReply!: (value: {
      conversation: Record<string, unknown>;
      delivered: boolean;
    }) => void;
    api.replyApiV1ConversationsConversationIdReplyPost.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveReply = resolve;
        }),
    );
    renderPage();

    await screen.findByRole("heading", { level: 2 });
    const composerRegion = screen.getByTestId("inbox-composer-region");
    fireEvent.change(composerRegion.querySelector("textarea")!, {
      target: { value: "Fallback confirmed message" },
    });
    fireEvent.submit(composerRegion);

    const pendingArticle = (await screen.findByText("Fallback confirmed message"))
      .closest("article")!;
    const sentAt = new Date().toISOString();
    await act(async () => {
      resolveReply({
        delivered: true,
        conversation: {
          id: "conversation-1",
          channel_id: "telegram",
          channel_type: "telegram",
          customer_id: "customer-1",
          customer_name: "Customer",
          status: "answered",
          last_message_at: sentAt,
          last_message_preview: "Fallback confirmed message",
          unread_count: 0,
          messages: [
            {
              id: "message-1",
              text: "Customer question",
              direction: "inbound",
              sender_type: "customer",
              sender_user_id: null,
              status: "delivered",
              created_at: "2026-07-21T10:00:00Z",
            },
            {
              id: "message-2",
              text: "Previous manager reply",
              direction: "outbound",
              sender_type: "manager",
              sender_user_id: "current-user",
              status: "delivered",
              created_at: "2026-07-21T10:01:00Z",
            },
            {
              id: "server-message-fallback",
              text: "Fallback confirmed message",
              direction: "outbound",
              sender_type: "manager",
              sender_user_id: "current-user",
              status: "sent",
              created_at: sentAt,
            },
          ],
        },
      });
    });

    await waitFor(() => {
      expect(
        within(screen.getByText("Fallback confirmed message").closest("article")!)
          .getByLabelText("Отправлено"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Fallback confirmed message").closest("article"),
    ).toBe(pendingArticle);
  });

  it("closes the selected conversation", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    fireEvent.click(screen.getByRole("button", { name: "Закрыть диалог" }));

    await waitFor(() =>
      expect(
        api.closeApiV1ConversationsConversationIdClosePost,
      ).toHaveBeenCalledWith("conversation-1"),
    );
  });

  it("keeps the composer enabled and exports a closed conversation", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce({
      ...(await api.getConversationApiV1ConversationsConversationIdGet()),
      status: "closed",
    });
    const createObjectURL = vi.fn(() => "blob:dialog-export");
    const revokeObjectURL = vi.fn();
    const linkClick = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      linkClick,
    );

    renderPage();

    expect(await screen.findByText("Диалог закрыт")).toBeInTheDocument();
    expect(screen.getByLabelText("Ответ клиенту")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Прикрепить файл" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Скачать диалог" }));

    await waitFor(() =>
      expect(attachmentApi.downloadConversationExport).toHaveBeenCalledWith(
        "conversation-1",
      ),
    );
    expect(linkClick).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:dialog-export");
    click.mockRestore();
  });

  it("hides the successful close notification after three seconds", async () => {
    vi.useFakeTimers();
    try {
      renderPage();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Закрыть диалог" }),
      );
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByRole("status")).toHaveTextContent("Диалог закрыт.");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_999);
      });
      expect(screen.getByRole("status")).toHaveTextContent("Диалог закрыт.");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("selects, previews and removes an image attachment", async () => {
    const createObjectURL = vi.fn(() => "blob:preview");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    const file = new File(["photo"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Выбрать вложение"), {
      target: { files: [file] },
    });

    expect(await screen.findByAltText("Предпросмотр вложения")).toHaveAttribute(
      "src",
      "blob:preview",
    );
    expect(screen.getByText("photo.png")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: `Удалить вложение ${file.name}` }),
    );
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview"),
    );
  });

  it("appends files from consecutive selections and removes only the chosen attachment", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    const input = screen.getByLabelText(
      "Выбрать вложение",
    ) as HTMLInputElement;
    const first = new File(["first"], "first-contract.pdf", {
      type: "application/pdf",
    });
    const second = new File(["second"], "second-contract.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    expect(input).toHaveAttribute("multiple");

    fireEvent.change(input, { target: { files: [first] } });
    await screen.findByText(first.name);
    fireEvent.change(input, { target: { files: [second] } });

    const firstPreview = await screen.findByText(first.name);
    const secondPreview = await screen.findByText(second.name);
    expect(
      firstPreview.compareDocumentPosition(secondPreview) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: `Удалить вложение ${first.name}`,
      }),
    );

    expect(screen.queryByText(first.name)).not.toBeInTheDocument();
    expect(screen.getByText(second.name)).toBeInTheDocument();
  });

  it("clears selected files when switching to another conversation", async () => {
    api.listConversationItemsApiV1ConversationsGet.mockResolvedValueOnce([
      ...(await api.listConversationItemsApiV1ConversationsGet()),
      {
        id: "conversation-2",
        channel_id: "telegram",
        channel_type: "telegram",
        customer_id: "customer-2",
        customer_name: "Борис",
        status: "open",
        last_message_at: "2026-07-21T11:00:00Z",
        last_message_preview: "Второй диалог",
        unread_count: 0,
      },
    ]);
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    const file = new File(["private"], "for-anna.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(screen.getByLabelText("Выбрать вложение"), {
      target: { files: [file] },
    });
    expect(await screen.findByText(file.name)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Аватар Борис Борис21.07 Второй диалог Нужен человекTelegram",
      }),
    );

    expect(screen.queryByText(file.name)).not.toBeInTheDocument();
  });

  it("sends all selected files and renders optimistic files before caption and meta", async () => {
    attachmentApi.replyToConversationWithFile.mockImplementationOnce(
      () => new Promise(() => undefined),
    );
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    const input = screen.getByLabelText(
      "Выбрать вложение",
    ) as HTMLInputElement;
    const first = new File(["first"], "optimistic-first.pdf", {
      type: "application/pdf",
    });
    const second = new File(["second"], "optimistic-second.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const caption = "Сначала файлы, затем этот текст";

    fireEvent.change(input, { target: { files: [first] } });
    fireEvent.change(input, { target: { files: [second] } });
    fireEvent.change(screen.getByLabelText("Ответ клиенту"), {
      target: { value: caption },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить ответ" }));

    await waitFor(() =>
      expect(attachmentApi.replyToConversationWithFile).toHaveBeenCalledWith({
        conversationId: "conversation-1",
        text: caption,
        files: [first, second],
      }),
    );

    const firstFilename = await screen.findByText(first.name);
    const secondFilename = screen.getByText(second.name);
    const captionElement = screen.getByText(caption);
    const article = firstFilename.closest("article");

    expect(article).not.toBeNull();
    expect(secondFilename.closest("article")).toBe(article);
    expect(captionElement.closest("article")).toBe(article);

    const meta = within(article!).getByLabelText("Отправляется").closest("p");
    expect(meta).not.toBeNull();
    for (const [before, after] of [
      [firstFilename, secondFilename],
      [secondFilename, captionElement],
      [captionElement, meta!],
    ] as const) {
      expect(
        before.compareDocumentPosition(after) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    expect(article!.lastElementChild).toBe(meta);
  });

  it("keeps the attachment preview out of the composer flow and messages above it", async () => {
    renderPage();

    await screen.findByRole("heading", { level: 2 });
    const viewport = screen.getByTestId("inbox-message-viewport");
    const composerRegion = screen.getByTestId("inbox-composer-region");
    const composer = screen.getByTestId("inbox-composer");
    const composerRegionClass = composerRegion.className;

    expect(viewport).toHaveClass("pb-2");
    expect(viewport).not.toHaveClass("pb-[74px]");

    const file = new File(["terms"], "terms.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(
      composerRegion.querySelector('input[type="file"]') as HTMLInputElement,
      { target: { files: [file] } },
    );

    const previewLayer = await screen.findByTestId(
      "inbox-attachment-preview-layer",
    );
    const previewCard = screen.getByText("terms.xlsx").closest("div")!;

    expect(previewLayer).toHaveClass(
      "absolute",
      "left-6",
      "right-6",
      "bottom-[78px]",
      "z-10",
      "pointer-events-none",
    );
    expect(previewCard).toHaveClass("pointer-events-auto");
    expect(previewCard).not.toHaveClass("mb-2");
    expect(viewport).toHaveClass("pb-[74px]");
    expect(viewport).not.toHaveClass("pb-2");
    expect(screen.getByTestId("inbox-composer-region")).toBe(composerRegion);
    expect(composerRegion).toHaveClass(composerRegionClass);
    expect(screen.getByTestId("inbox-composer")).toBe(composer);
  });

  it("keeps the sticky bottom intent when selecting a file adds preview padding", async () => {
    attachmentApi.replyToConversationWithFile.mockImplementationOnce(
      () => new Promise(() => undefined),
    );
    renderPage();

    await screen.findByRole("heading", { level: 2 });
    const viewport = screen.getByTestId("inbox-message-viewport");
    const composerRegion = screen.getByTestId("inbox-composer-region");
    const scrollTo = vi.fn();
    let scrollHeight = 1_000;
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, get: () => scrollHeight },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, writable: true, value: 590 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    fireEvent.scroll(viewport);

    const file = new File(["terms"], "terms.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(
      composerRegion.querySelector('input[type="file"]') as HTMLInputElement,
      { target: { files: [file] } },
    );
    expect(viewport).toHaveClass("pb-[74px]");

    // The preview reserves extra room without a user scroll. That layout change
    // must not revoke the sticky-to-bottom intent captured by the scroll event.
    scrollHeight = 1_072;
    fireEvent.submit(composerRegion);

    expect(await screen.findByText("terms.xlsx")).toBeInTheDocument();
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        top: 1_072,
        behavior: "smooth",
      }),
    );
  });

  it("sends a file-only reply through multipart endpoint and clears preview", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    const file = new File(["terms"], "terms.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Выбрать вложение"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить ответ" }));

    await waitFor(() =>
      expect(attachmentApi.replyToConversationWithFile).toHaveBeenCalledWith({
        conversationId: "conversation-1",
        text: "",
        files: [file],
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId("inbox-attachment-preview-layer"),
      ).not.toBeInTheDocument(),
    );
    expect(
      api.replyApiV1ConversationsConversationIdReplyPost,
    ).not.toHaveBeenCalled();
  });

  it("shows a file-only optimistic bubble immediately and keeps it stable after confirmation", async () => {
    let resolveUpload!: (value: {
      conversation: Record<string, unknown>;
      delivered: boolean;
      message: Record<string, unknown>;
    }) => void;
    attachmentApi.replyToConversationWithFile.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );
    renderPage();

    await screen.findByRole("heading", { level: 2 });
    const composerRegion = screen.getByTestId("inbox-composer-region");
    const file = new File(["terms"], "terms.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(
      composerRegion.querySelector('input[type="file"]') as HTMLInputElement,
      { target: { files: [file] } },
    );
    fireEvent.submit(composerRegion);

    await waitFor(() => {
      expect(
        screen.queryByTestId("inbox-attachment-preview-layer"),
      ).not.toBeInTheDocument();
    });
    const pendingFilename = await screen.findByText("terms.pdf");
    const pendingArticle = pendingFilename.closest("article");
    expect(pendingArticle).not.toBeNull();
    expect(within(pendingArticle!).getByText("5 Б")).toBeInTheDocument();
    expect(
      within(pendingArticle!).getByLabelText("Отправляется"),
    ).toBeInTheDocument();

    const sentAt = new Date().toISOString();
    await act(async () => {
      resolveUpload({
        delivered: true,
        message: {
          id: "server-file-message",
          text: "",
          direction: "outbound",
          sender_type: "manager",
          sender_user_id: "current-user",
          status: "sent",
          created_at: sentAt,
          attachments: {
            items: [
              {
                id: "server-attachment",
                filename: "terms.pdf",
                size_bytes: 5,
                download_url:
                  "/api/v1/conversations/conversation-1/attachments/server-attachment",
              },
            ],
          },
        },
        conversation: {
          id: "conversation-1",
          channel_id: "telegram",
          channel_type: "telegram",
          customer_id: "customer-1",
          customer_name: "Customer",
          status: "answered",
          last_message_at: sentAt,
          last_message_preview: "terms.pdf",
          unread_count: 0,
          messages: [
            {
              id: "message-1",
              text: "Customer question",
              direction: "inbound",
              sender_type: "customer",
              sender_user_id: null,
              status: "delivered",
              created_at: "2026-07-21T10:00:00Z",
            },
            {
              id: "message-2",
              text: "Previous manager reply",
              direction: "outbound",
              sender_type: "manager",
              sender_user_id: "current-user",
              status: "delivered",
              created_at: "2026-07-21T10:01:00Z",
            },
            {
              id: "server-file-message",
              text: "",
              direction: "outbound",
              sender_type: "manager",
              sender_user_id: "current-user",
              status: "sent",
              created_at: sentAt,
              attachments: {
                items: [
                  {
                    id: "server-attachment",
                    filename: "terms.pdf",
                    size_bytes: 5,
                    download_url:
                      "/api/v1/conversations/conversation-1/attachments/server-attachment",
                  },
                ],
              },
            },
          ],
        },
      });
    });

    await waitFor(() => {
      expect(
        within(screen.getByText("terms.pdf").closest("article")!).getByLabelText(
          "Отправлено",
        ),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("terms.pdf").closest("article")).toBe(
      pendingArticle,
    );
  });

  it("keeps an attachment after upload failure and validates format and size", async () => {
    attachmentApi.replyToConversationWithFile.mockRejectedValueOnce(
      new Error("Network Error"),
    );
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    const unsupported = new File(["archive"], "archive.zip", {
      type: "application/zip",
    });
    fireEvent.change(screen.getByLabelText("Выбрать вложение"), {
      target: { files: [unsupported] },
    });
    expect(
      screen.getByText(`Файл «${unsupported.name}» имеет неподдерживаемый формат.`),
    ).toBeInTheDocument();

    const oversized = new File(["x"], "large.pdf", { type: "application/pdf" });
    Object.defineProperty(oversized, "size", { value: 10 * 1024 * 1024 + 1 });
    fireEvent.change(screen.getByLabelText("Выбрать вложение"), {
      target: { files: [oversized] },
    });
    expect(
      screen.getByText(
        `Файл «${oversized.name}» превышает максимальный размер 10 МБ.`,
      ),
    ).toBeInTheDocument();

    const valid = new File(["terms"], "terms.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Выбрать вложение"), {
      target: { files: [valid] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить ответ" }));
    await waitFor(() =>
      expect(attachmentApi.replyToConversationWithFile).toHaveBeenCalled(),
    );
    expect(screen.getByText("terms.pdf")).toBeInTheDocument();
  });

  it("renders server attachments and downloads them with authenticated API", async () => {
    const createObjectURL = vi.fn(() => "blob:download");
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        messages: [
          {
            id: "message-file",
            text: "Документ",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "sent",
            created_at: "2026-07-21T10:04:00Z",
            attachments: {
              items: [
                {
                  id: "attachment-1",
                  filename: "terms.pdf",
                  size_bytes: 2048,
                  download_url:
                    "/api/v1/conversations/conversation-1/attachments/attachment-1",
                },
              ],
            },
          },
        ],
      },
    );

    renderPage();
    const downloadButton = await screen.findByRole("button", {
      name: "Скачать terms.pdf",
    });
    fireEvent.click(downloadButton);

    await waitFor(() =>
      expect(attachmentApi.getAuthenticatedAttachment).toHaveBeenCalledWith(
        "/api/v1/conversations/conversation-1/attachments/attachment-1",
      ),
    );
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it("uses tighter bubble padding for documents without compacting image messages", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        messages: [
          {
            id: "message-document",
            text: "",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "sent",
            created_at: "2026-07-21T10:04:00Z",
            attachments: {
              items: [
                {
                  id: "attachment-document",
                  filename: "terms.xlsx",
                  size_bytes: 2048,
                  download_url: "/attachments/terms.xlsx",
                },
              ],
            },
          },
          {
            id: "message-image",
            text: "",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "sent",
            created_at: "2026-07-21T10:05:00Z",
            attachments: {
              items: [
                {
                  id: "attachment-image",
                  filename: "photo.png",
                  content_type: "image/png",
                  download_url: "/attachments/photo.png",
                },
              ],
            },
          },
        ],
      },
    );

    renderPage();

    const documentButton = await screen.findByRole("button", {
      name: /terms\.xlsx/,
    });
    const imageButton = screen.getByRole("button", { name: /photo\.png/ });
    const documentBubble = documentButton.closest("article");
    const imageBubble = imageButton.closest("article");

    expect(documentBubble).toHaveClass("px-3", "py-2.5");
    expect(documentBubble).not.toHaveClass("px-4", "py-3.5");
    expect(documentButton).toHaveClass("gap-1.5", "p-1.5");
    expect(documentButton.parentElement).toHaveClass("mt-0", "gap-1.5");
    expect(imageBubble).toHaveClass("px-4", "py-3.5");
    expect(imageBubble).not.toHaveClass("px-3", "py-2.5");
    expect(imageButton).toHaveClass("gap-2", "p-2");
    expect(imageButton.parentElement).toHaveClass("mt-2", "gap-2");
  });

  it("renders attachments before text and keeps message meta last", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        messages: [
          {
            id: "message-current-user-file-and-text",
            text: "Current user attachment caption",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "sent",
            created_at: "2026-07-21T10:04:00Z",
            attachments: {
              items: [
                {
                  id: "attachment-current-user",
                  filename: "current-user.pdf",
                  size_bytes: 2048,
                  download_url: "/attachments/current-user.pdf",
                },
              ],
            },
          },
          {
            id: "message-other-manager-file-and-text",
            text: "Other manager attachment caption",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "other-manager",
            status: "sent",
            created_at: "2026-07-21T10:10:00Z",
            attachments: {
              items: [
                {
                  id: "attachment-other-manager",
                  filename: "other-manager.xlsx",
                  size_bytes: 4096,
                  download_url: "/attachments/other-manager.xlsx",
                },
              ],
            },
          },
          {
            id: "message-customer-file-and-text",
            text: "Customer attachment caption",
            direction: "inbound",
            sender_type: "customer",
            sender_user_id: null,
            status: "delivered",
            created_at: "2026-07-21T10:16:00Z",
            attachments: {
              items: [
                {
                  id: "attachment-customer",
                  filename: "customer.docx",
                  size_bytes: 1024,
                  download_url: "/attachments/customer.docx",
                },
              ],
            },
          },
        ],
      },
    );

    renderPage();

    const cases = [
      ["current-user.pdf", "Current user attachment caption"],
      ["other-manager.xlsx", "Other manager attachment caption"],
      ["customer.docx", "Customer attachment caption"],
    ] as const;

    for (const [filename, caption] of cases) {
      const text = await screen.findByText(caption);
      const attachment = screen.getByRole("button", {
        name: new RegExp(filename.replace(".", "\\.")),
      });
      const article = text.closest("article");

      expect(article).not.toBeNull();
      expect(attachment.closest("article")).toBe(article);
      expect(
        attachment.compareDocumentPosition(text) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(article?.lastElementChild).not.toBe(text);
      expect(article?.lastElementChild?.tagName).toBe("P");
      expect(
        text.compareDocumentPosition(article!.lastElementChild!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("polls the conversation list and selected thread", async () => {
    vi.useFakeTimers();
    try {
      renderPage();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      await act(async () => {
        await Promise.resolve();
      });
      const initialListCalls =
        api.listConversationItemsApiV1ConversationsGet.mock.calls.length;
      const initialThreadCalls =
        api.getConversationApiV1ConversationsConversationIdGet.mock.calls
          .length;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4_000);
      });
      expect(
        api.listConversationItemsApiV1ConversationsGet,
      ).toHaveBeenCalledTimes(initialListCalls + 1);
      expect(
        api.getConversationApiV1ConversationsConversationIdGet,
      ).toHaveBeenCalled();
      expect(
        api.getConversationApiV1ConversationsConversationIdGet.mock.calls.length,
      ).toBeGreaterThan(initialThreadCalls);
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders customer messages on the left and current user replies as plain bubbles on the right", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    const customerMessage = screen
      .getAllByText("Когда будет доставка?")
      .find((element) => element.closest("article"));
    const managerMessage = await screen.findByText("Доставим завтра.");

    expect(customerMessage?.closest("article")).toHaveClass(
      "self-start",
      "bg-white",
      "w-fit",
      "max-w-[min(560px,100%)]",
    );
    expect(managerMessage.closest("article")).toHaveClass(
      "self-end",
      "bg-[#dce9ff]",
      "w-fit",
      "max-w-[min(560px,100%)]",
    );
    expect(customerMessage).toHaveClass("wrap-break-word", "whitespace-pre-wrap");
    expect(managerMessage).toHaveClass("wrap-break-word", "whitespace-pre-wrap");
    expect(screen.queryByText("Менеджер")).not.toBeInTheDocument();
    expect(screen.queryByText("Анна · Клиент")).not.toBeInTheDocument();
    expect(screen.getAllByText("Отвечено")).toHaveLength(2);
    expect(screen.getByText("Telegram")).toBeInTheDocument();
    expect(
      within(managerMessage.closest("article")!).getByLabelText("Отправлено"),
    ).toBeInTheDocument();
  });

  it("groups nearby messages from one author and shows a tail only at each group start", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        messages: [
          {
            id: "group-1",
            text: "First nearby message",
            direction: "inbound",
            sender_type: "customer",
            sender_user_id: null,
            status: "delivered",
            created_at: "2026-07-21T10:00:00Z",
          },
          {
            id: "group-2",
            text: "Second nearby message",
            direction: "inbound",
            sender_type: "customer",
            sender_user_id: null,
            status: "delivered",
            created_at: "2026-07-21T10:02:00Z",
          },
          {
            id: "group-3",
            text: "Message after time gap",
            direction: "inbound",
            sender_type: "customer",
            sender_user_id: null,
            status: "delivered",
            created_at: "2026-07-21T10:08:00Z",
          },
          {
            id: "group-4",
            text: "Outgoing run start",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "sent",
            created_at: "2026-07-21T10:09:00Z",
          },
          {
            id: "group-5",
            text: "Outgoing run continuation",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "sent",
            created_at: "2026-07-21T10:10:00Z",
          },
          {
            id: "group-6",
            text: "Customer resets the run",
            direction: "inbound",
            sender_type: "customer",
            sender_user_id: null,
            status: "delivered",
            created_at: "2026-07-21T10:11:00Z",
          },
          {
            id: "group-7",
            text: "New outgoing run start",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "sent",
            created_at: "2026-07-21T10:12:00Z",
          },
          {
            id: "group-8",
            text: "New outgoing run continuation",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "sent",
            created_at: "2026-07-21T10:13:00Z",
          },
        ],
      },
    );

    renderPage();

    const first = (await screen.findByText("First nearby message")).closest(
      "article",
    )!;
    const second = screen
      .getByText("Second nearby message")
      .closest("article")!;
    const afterGap = screen
      .getByText("Message after time gap")
      .closest("article")!;
    const outgoing = screen
      .getByText("Outgoing run start")
      .closest("article")!;
    const outgoingContinuation = screen
      .getByText("Outgoing run continuation")
      .closest("article")!;
    const inboundReset = screen
      .getByText("Customer resets the run")
      .closest("article")!;
    const newOutgoing = screen
      .getByText("New outgoing run start")
      .closest("article")!;
    const newOutgoingContinuation = screen
      .getByText("New outgoing run continuation")
      .closest("article")!;

    expect(first).toHaveAttribute("data-group-start", "true");
    expect(first).not.toHaveAttribute("data-group-end");
    expect(first).toHaveClass("mt-[18px]");
    expect(first.querySelector('[data-message-tail="incoming"]')).not.toBeNull();
    expect(second).not.toHaveAttribute("data-group-start");
    expect(second).toHaveAttribute("data-group-end", "true");
    expect(second).toHaveClass("mt-1");
    expect(second.querySelector("[data-message-tail]")).toBeNull();
    expect(afterGap).toHaveAttribute("data-group-start", "true");
    expect(outgoing).toHaveAttribute("data-group-start", "true");
    expect(outgoing).toHaveAttribute("data-tail-start", "true");
    expect(
      outgoing.querySelector('[data-message-tail="outgoing"]'),
    ).not.toBeNull();
    const outgoingTailPaths = outgoing.querySelectorAll(
      '[data-message-tail="outgoing"] path',
    );
    expect(outgoingTailPaths).toHaveLength(2);
    expect(outgoingTailPaths[0]).toHaveAttribute("stroke", "none");
    expect(outgoingTailPaths[1]).toHaveAttribute("d", "M0.5 0.5H11L0.5 13");
    expect(outgoingContinuation).not.toHaveAttribute("data-tail-start");
    expect(
      outgoingContinuation.querySelector("[data-message-tail]"),
    ).toBeNull();
    expect(inboundReset).toHaveAttribute("data-tail-start", "true");
    expect(newOutgoing).toHaveAttribute("data-tail-start", "true");
    const newOutgoingTail = newOutgoing.querySelector(
      '[data-message-tail="outgoing"]',
    );
    expect(newOutgoingTail).not.toBeNull();
    expect(newOutgoingTail).toHaveClass("top-[-1px]", "-right-[10px]");
    expect(newOutgoingContinuation).not.toHaveAttribute("data-tail-start");
    expect(
      newOutgoingContinuation.querySelector("[data-message-tail]"),
    ).toBeNull();
  });

  it("shows two blue checks after Telegram reports that the customer read the message", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        messages: [
          {
            id: "message-read",
            text: "Сообщение уже прочитано.",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "read",
            created_at: "2026-07-21T10:04:00Z",
          },
        ],
      },
    );

    renderPage();

    const text = await screen.findByText("Сообщение уже прочитано.");
    const receipt = within(text.closest("article")!).getByLabelText(
      "Прочитано",
    );
    expect(receipt).toHaveClass("text-[#18a86b]");
    const checks = receipt.querySelectorAll("svg");
    expect(checks).toHaveLength(1);
    expect(checks[0]).toHaveClass("h-4", "w-5");
    const paths = checks[0].querySelectorAll("path");
    expect(paths).toHaveLength(2);
    expect(paths[0]).toHaveAttribute("stroke", "#18a86b");
    expect(paths[1]).toHaveAttribute("stroke", "#18a86b");
  });

  it("shows two dark checks immediately for a pending outgoing message", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        messages: [
          {
            id: "message-pending",
            text: "Pending message.",
            direction: "outbound",
            sender_type: "manager",
            sender_user_id: "current-user",
            status: "pending",
            created_at: "2026-07-21T10:04:00Z",
          },
        ],
      },
    );

    renderPage();

    const text = await screen.findByText("Pending message.");
    const receipt = within(text.closest("article")!).getByLabelText(
      "Отправляется",
    );
    expect(receipt).toHaveClass("text-[#253145]");
    const paths = receipt.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    expect(paths[0]).toHaveAttribute("stroke", "#253145");
    expect(paths[1]).toHaveAttribute("stroke", "#253145");
  });

  it("shows the failed outgoing state without delivery checks", async () => {
    const status = "failed";
      api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
        {
          ...(await api.getConversationApiV1ConversationsConversationIdGet()),
          messages: [
            {
              id: `message-${status}`,
              text: `Статус ${status}.`,
              direction: "outbound",
              sender_type: "manager",
              sender_user_id: "current-user",
              status,
              created_at: "2026-07-21T10:04:00Z",
            },
          ],
        },
      );

      renderPage();

      const text = await screen.findByText(`Статус ${status}.`);
      const bubble = within(text.closest("article")!);
      expect(
        bubble.getByLabelText("Ошибка отправки"),
      ).toBeInTheDocument();
      expect(bubble.queryByLabelText("Отправлено")).not.toBeInTheDocument();
      expect(bubble.queryByLabelText("Прочитано")).not.toBeInTheDocument();
  });

  it("keeps the manager label for a reply sent by another user", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        messages: [
          {
            id: "message-3",
            text: "Ответ коллеги.",
            direction: "inbound",
            sender_type: "manager",
            sender_user_id: "another-user",
            status: "delivered",
            created_at: "2026-07-21T10:02:00Z",
          },
        ],
      },
    );

    renderPage();

    const colleagueMessage = await screen.findByText("Ответ коллеги.");
    expect(colleagueMessage.closest("article")).toHaveClass(
      "self-end",
      "bg-[#dce9ff]",
    );
    expect(screen.getByText("Менеджер")).toBeInTheDocument();
    expect(
      colleagueMessage.closest("article")?.querySelector(".border-t"),
    ).toBeNull();
  });

  it("labels every AI reply as Autopilot in the blue outgoing bubble", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        ...(await api.getConversationApiV1ConversationsConversationIdGet()),
        messages: [
          {
            id: "message-ai",
            text: "Демо-тариф бесплатный, включает один Telegram-канал и 500 диалогов.",
            direction: "inbound",
            sender_type: "ai",
            sender_user_id: null,
            status: "delivered",
            created_at: "2026-07-21T15:38:00",
          },
        ],
      },
    );

    renderPage();

    const aiMessage = await screen.findByText(
      "Демо-тариф бесплатный, включает один Telegram-канал и 500 диалогов.",
    );
    const bubble = aiMessage.closest("article")!;
    expect(bubble).toHaveClass("self-end", "border-[#a9c4f2]", "bg-[#dce9ff]");
    expect(within(bubble).getByText("Автопилот")).toBeInTheDocument();
    expect(within(bubble).getByText("15:38")).toHaveClass("text-right");
    expect(bubble.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("Менеджер")).not.toBeInTheDocument();
  });

  it("does not show a success notification after sending a reply", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    fireEvent.change(screen.getByLabelText("Ответ клиенту"), {
      target: { value: "Проверка." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить ответ" }));

    await waitFor(() =>
      expect(
        api.replyApiV1ConversationsConversationIdReplyPost,
      ).toHaveBeenCalled(),
    );
    expect(screen.queryByText("Ответ отправлен.")).not.toBeInTheDocument();
  });

  it("renders a styled empty state only when there are no chats", async () => {
    api.listConversationItemsApiV1ConversationsGet.mockResolvedValueOnce([]);

    renderPage();

    expect(
      await screen.findByText("У вас ещё нет ни одного чата"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Новые обращения появятся здесь после подключения канала.",
      ),
    ).toBeInTheDocument();
  });

  it("renders a separate state when the current search has no matches", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    fireEvent.change(screen.getByPlaceholderText("Поиск по диалогам"), {
      target: { value: "Несуществующий клиент" },
    });

    expect(screen.getByText("Ничего не найдено")).toBeInTheDocument();
    expect(
      screen.getByText("Попробуйте изменить поиск или фильтр."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("У вас ещё нет ни одного чата"),
    ).not.toBeInTheDocument();
  });

  it("keeps a needs-human chat waiting until a manager actually replies", async () => {
    api.listConversationItemsApiV1ConversationsGet.mockResolvedValueOnce([
      {
        id: "conversation-maria",
        channel_id: "telegram",
        channel_type: "telegram",
        customer_id: "customer-maria",
        customer_name: "Мария Волкова",
        status: "escalated",
        last_message_at: "2026-07-21T10:00:00Z",
        last_message_preview: "Нам нужна интеграция с CRM.",
        unread_count: 0,
      },
    ]);
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce(
      {
        id: "conversation-maria",
        channel_id: "telegram",
        channel_type: "telegram",
        customer_id: "customer-maria",
        customer_name: "Мария Волкова",
        status: "escalated",
        last_message_at: "2026-07-21T10:00:00Z",
        last_message_preview: "Нам нужна интеграция с CRM.",
        unread_count: 0,
        messages: [
          {
            id: "message-maria",
            text: "Нам нужна интеграция с CRM.",
            direction: "inbound",
            sender_type: "customer",
            sender_user_id: null,
            status: "received",
            created_at: "2026-07-21T10:00:00Z",
          },
        ],
      },
    );

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Мария Волкова", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Нужен человек").length).toBeGreaterThanOrEqual(
      2,
    );
    expect(screen.queryByText("Менеджер")).not.toBeInTheDocument();
  });
});
