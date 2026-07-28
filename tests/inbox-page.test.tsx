import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InboxPage from "@/app/inbox/page";

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
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <InboxPage />
    </QueryClientProvider>,
  );
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
    api.listConversationItemsApiV1ConversationsGet.mockImplementation(async () => conversationItems);
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
    expect(within(maria).getByLabelText("Непрочитанный диалог")).toBeInTheDocument();

    fireEvent.click(maria);

    await waitFor(() =>
      expect(conversationActions.markConversationRead).toHaveBeenCalledWith("conversation-2"),
    );
    await waitFor(() =>
      expect(within(maria).queryByLabelText("Непрочитанный диалог")).not.toBeInTheDocument(),
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

  it("polls the conversation list and selected thread", async () => {
    vi.useFakeTimers();
    try {
      renderPage();
      await act(async () => { await vi.advanceTimersByTimeAsync(1); });
      await act(async () => { await Promise.resolve(); });
      const initialListCalls = api.listConversationItemsApiV1ConversationsGet.mock.calls.length;
      const initialThreadCalls = api.getConversationApiV1ConversationsConversationIdGet.mock.calls.length;

      await act(async () => { await vi.advanceTimersByTimeAsync(4_000); });
      expect(api.listConversationItemsApiV1ConversationsGet).toHaveBeenCalledTimes(initialListCalls + 1);
      expect(api.getConversationApiV1ConversationsConversationIdGet).toHaveBeenCalledTimes(initialThreadCalls + 1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders customer messages on the left and current user replies as plain bubbles on the right", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    const customerMessage = screen.getAllByText("Когда будет доставка?").find((element) => element.closest("article"));
    const managerMessage = await screen.findByText("Доставим завтра.");

    expect(customerMessage?.closest("article")).toHaveClass("self-start", "bg-white");
    expect(managerMessage.closest("article")).toHaveClass("self-end", "bg-[#eaf1ff]");
    expect(screen.queryByText("Менеджер")).not.toBeInTheDocument();
    expect(screen.queryByText("Анна · Клиент")).not.toBeInTheDocument();
    expect(screen.getAllByText("Отвечено")).toHaveLength(2);
    expect(screen.getByText("Telegram")).toBeInTheDocument();
  });

  it("keeps the manager label for a reply sent by another user", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce({
      ...(await api.getConversationApiV1ConversationsConversationIdGet()),
      messages: [{
        id: "message-3",
        text: "Ответ коллеги.",
        direction: "inbound",
        sender_type: "manager",
        sender_user_id: "another-user",
        status: "delivered",
        created_at: "2026-07-21T10:02:00Z",
      }],
    });

    renderPage();

    const colleagueMessage = await screen.findByText("Ответ коллеги.");
    expect(colleagueMessage.closest("article")).toHaveClass("self-end", "bg-[#eaf1ff]");
    expect(screen.getByText("Менеджер")).toBeInTheDocument();
    expect(colleagueMessage.closest("article")?.querySelector(".border-t")).toBeNull();
  });

  it("labels every AI reply as Autopilot in the blue outgoing bubble", async () => {
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce({
      ...(await api.getConversationApiV1ConversationsConversationIdGet()),
      messages: [{
        id: "message-ai",
        text: "Демо-тариф бесплатный, включает один Telegram-канал и 500 диалогов.",
        direction: "inbound",
        sender_type: "ai",
        sender_user_id: null,
        status: "delivered",
        created_at: "2026-07-21T15:38:00",
      }],
    });

    renderPage();

    const aiMessage = await screen.findByText(
      "Демо-тариф бесплатный, включает один Telegram-канал и 500 диалогов.",
    );
    const bubble = aiMessage.closest("article")!;
    expect(bubble).toHaveClass("self-end", "border-[#cddfff]", "bg-[#eaf1ff]");
    expect(within(bubble).getByText("Автопилот")).toBeInTheDocument();
    expect(within(bubble).getByText("15:38")).toHaveClass("text-right");
    expect(bubble.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("Менеджер")).not.toBeInTheDocument();
  });

  it("does not show a success notification after sending a reply", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    fireEvent.change(screen.getByLabelText("Ответ клиенту"), { target: { value: "Проверка." } });
    fireEvent.click(screen.getByRole("button", { name: "Отправить ответ" }));

    await waitFor(() => expect(api.replyApiV1ConversationsConversationIdReplyPost).toHaveBeenCalled());
    expect(screen.queryByText("Ответ отправлен.")).not.toBeInTheDocument();
  });

  it("renders a styled empty state only when there are no chats", async () => {
    api.listConversationItemsApiV1ConversationsGet.mockResolvedValueOnce([]);

    renderPage();

    expect(await screen.findByText("У вас ещё нет ни одного чата")).toBeInTheDocument();
    expect(screen.getByText("Новые обращения появятся здесь после подключения канала.")).toBeInTheDocument();
  });

  it("renders a separate state when the current search has no matches", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    fireEvent.change(screen.getByPlaceholderText("Поиск по диалогам"), { target: { value: "Несуществующий клиент" } });

    expect(screen.getByText("Ничего не найдено")).toBeInTheDocument();
    expect(screen.getByText("Попробуйте изменить поиск или фильтр.")).toBeInTheDocument();
    expect(screen.queryByText("У вас ещё нет ни одного чата")).not.toBeInTheDocument();
  });

  it("keeps a needs-human chat waiting until a manager actually replies", async () => {
    api.listConversationItemsApiV1ConversationsGet.mockResolvedValueOnce([{
      id: "conversation-maria",
      channel_id: "telegram",
      channel_type: "telegram",
      customer_id: "customer-maria",
      customer_name: "Мария Волкова",
      status: "escalated",
      last_message_at: "2026-07-21T10:00:00Z",
      last_message_preview: "Нам нужна интеграция с CRM.",
      unread_count: 0,
    }]);
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValueOnce({
      id: "conversation-maria",
      channel_id: "telegram",
      channel_type: "telegram",
      customer_id: "customer-maria",
      customer_name: "Мария Волкова",
      status: "escalated",
      last_message_at: "2026-07-21T10:00:00Z",
      last_message_preview: "Нам нужна интеграция с CRM.",
      unread_count: 0,
      messages: [{
        id: "message-maria",
        text: "Нам нужна интеграция с CRM.",
        direction: "inbound",
        sender_type: "customer",
        sender_user_id: null,
        status: "received",
        created_at: "2026-07-21T10:00:00Z",
      }],
    });

    renderPage();

    expect(await screen.findByRole("heading", { name: "Мария Волкова", level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText("Нужен человек").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Менеджер")).not.toBeInTheDocument();
  });
});
