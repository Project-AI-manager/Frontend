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
    attachmentApi.replyToConversationWithFile.mockResolvedValue({});
    attachmentApi.getAuthenticatedAttachment.mockResolvedValue(
      new Blob(["file"]),
    );
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
    fireEvent.click(screen.getByRole("button", { name: "Удалить вложение" }));
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview"),
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
        file,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByText("terms.pdf")).not.toBeInTheDocument(),
    );
    expect(
      api.replyApiV1ConversationsConversationIdReplyPost,
    ).not.toHaveBeenCalled();
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
      screen.getByText("Этот формат файла не поддерживается."),
    ).toBeInTheDocument();

    const oversized = new File(["x"], "large.pdf", { type: "application/pdf" });
    Object.defineProperty(oversized, "size", { value: 10 * 1024 * 1024 + 1 });
    fireEvent.change(screen.getByLabelText("Выбрать вложение"), {
      target: { files: [oversized] },
    });
    expect(
      screen.getByText("Файл превышает максимальный размер 10 МБ."),
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
    fireEvent.click(await screen.findByRole("button", { name: /terms\.pdf/ }));

    await waitFor(() =>
      expect(attachmentApi.getAuthenticatedAttachment).toHaveBeenCalledWith(
        "/api/v1/conversations/conversation-1/attachments/attachment-1",
      ),
    );
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
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
      ).toHaveBeenCalledTimes(initialThreadCalls + 1);
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
    );
    expect(managerMessage.closest("article")).toHaveClass(
      "self-end",
      "bg-[#eaf1ff]",
    );
    expect(screen.queryByText("Менеджер")).not.toBeInTheDocument();
    expect(screen.queryByText("Анна · Клиент")).not.toBeInTheDocument();
    expect(screen.getAllByText("Отвечено")).toHaveLength(2);
    expect(screen.getByText("Telegram")).toBeInTheDocument();
    expect(
      within(managerMessage.closest("article")!).getByLabelText("Отправлено"),
    ).toBeInTheDocument();
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
    expect(
      within(text.closest("article")!).getByLabelText("Прочитано"),
    ).toHaveClass("text-[#2463eb]");
  });

  it.each([
    ["pending", "Отправляется"],
    ["failed", "Ошибка отправки"],
  ])(
    "shows the %s outgoing state without a delivery check",
    async (status, label) => {
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
      expect(bubble.getByLabelText(label)).toBeInTheDocument();
      expect(bubble.queryByLabelText("Отправлено")).not.toBeInTheDocument();
      expect(bubble.queryByLabelText("Прочитано")).not.toBeInTheDocument();
    },
  );

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
      "bg-[#eaf1ff]",
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
    expect(bubble).toHaveClass("self-end", "border-[#cddfff]", "bg-[#eaf1ff]");
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
