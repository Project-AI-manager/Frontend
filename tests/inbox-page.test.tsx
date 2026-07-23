import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InboxPage from "@/app/inbox/page";

const api = vi.hoisted(() => ({
  listConversationItemsApiV1ConversationsGet: vi.fn(),
  getConversationApiV1ConversationsConversationIdGet: vi.fn(),
  replyApiV1ConversationsConversationIdReplyPost: vi.fn(),
  escalateApiV1ConversationsConversationIdEscalatePost: vi.fn(),
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

  return render(
    <QueryClientProvider client={client}>
      <InboxPage />
    </QueryClientProvider>,
  );
}

describe("InboxPage live actions", () => {
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
          created_at: "2026-07-21T10:00:00Z",
        },
      ],
    });
    api.replyApiV1ConversationsConversationIdReplyPost.mockResolvedValue({});
    api.escalateApiV1ConversationsConversationIdEscalatePost.mockResolvedValue(
      {},
    );
  });

  it("loads the live thread and sends a manager reply", async () => {
    renderPage();

    expect(
      await screen.findByText("Когда будет доставка?"),
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

  it("passes the selected conversation to a manager", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Анна", level: 2 });
    fireEvent.click(screen.getByRole("button", { name: "Передать менеджеру" }));

    await waitFor(() =>
      expect(
        api.escalateApiV1ConversationsConversationIdEscalatePost,
      ).toHaveBeenCalledWith("conversation-1"),
    );
  });
});
