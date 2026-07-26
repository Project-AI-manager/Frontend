import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InboxPage from "@/app/inbox/page";

const api = vi.hoisted(() => ({
  listConversationItemsApiV1ConversationsGet: vi.fn(),
  getConversationApiV1ConversationsConversationIdGet: vi.fn(),
  replyApiV1ConversationsConversationIdReplyPost: vi.fn(),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api/generated/conversations/conversations", () => ({
  getConversations: () => api,
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}><InboxPage /></QueryClientProvider>);
}

describe("Inbox page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listConversationItemsApiV1ConversationsGet.mockResolvedValue([
      {
        id: "conversation-1",
        channel_id: "telegram",
        customer_id: "customer-1",
        customer_name: "Анна",
        status: "open",
        last_message_at: "2026-07-21T10:00:00Z",
        last_message_preview: "Когда будет доставка?",
        unread_count: 1,
      },
    ]);
    api.getConversationApiV1ConversationsConversationIdGet.mockResolvedValue({
      id: "conversation-1",
      channel_id: "telegram",
      customer_id: "customer-1",
      customer_name: "Анна",
      status: "open",
      last_message_at: "2026-07-21T10:00:00Z",
      last_message_preview: "Когда будет доставка?",
      unread_count: 1,
      messages: [
        {
          id: "message-1",
          text: "Когда будет доставка?",
          direction: "inbound",
          sender_type: "customer",
          status: "delivered",
          confidence: null,
          ai_meta: {},
          created_at: "2026-07-21T10:00:00Z",
        },
        {
          id: "message-2",
          text: "Доставим завтра.",
          direction: "outbound",
          sender_type: "manager",
          status: "sent",
          confidence: null,
          ai_meta: {},
          created_at: "2026-07-21T10:05:00Z",
        },
      ],
    });
    api.replyApiV1ConversationsConversationIdReplyPost.mockResolvedValue({});
  });

  it("loads conversations and messages from the API without the removed controls", async () => {
    renderPage();
    expect(screen.getByLabelText("Поиск диалогов")).toBeInTheDocument();
    expect(await screen.findByText("Когда будет доставка?")).toBeInTheDocument();
    expect(await screen.findByText("Доставим завтра.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Чаты" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Все" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Нужен человек" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Действия с диалогом" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Добавить эмодзи" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Отправлено")).toBeInTheDocument();
    expect(screen.getByText(/вторник, 21 июля/i)).toBeInTheDocument();
  });

  it("sends a reply through the backend API", async () => {
    renderPage();
    await screen.findByText("Когда будет доставка?");
    fireEvent.change(screen.getByLabelText("Ответ"), { target: { value: "Доставим завтра." } });
    fireEvent.click(screen.getByRole("button", { name: "Отправить сообщение" }));
    await waitFor(() =>
      expect(api.replyApiV1ConversationsConversationIdReplyPost).toHaveBeenCalledWith(
        "conversation-1",
        { text: "Доставим завтра." },
      ),
    );
  });

  it("opens the native file chooser from the attachment button", async () => {
    renderPage();
    await screen.findByText("Когда будет доставка?");
    const click = vi.spyOn(HTMLInputElement.prototype, "click");
    fireEvent.click(screen.getByRole("button", { name: "Прикрепить файл" }));
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});
