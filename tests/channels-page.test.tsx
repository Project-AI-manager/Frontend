import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ChannelsPage from "@/app/channels/page";

const api = vi.hoisted(() => ({
  listChannelsApiV1ChannelsGet: vi.fn(),
  disconnect: vi.fn(),
  startAccount: vi.fn(),
  confirmCode: vi.fn(),
  confirmPassword: vi.fn(),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/lib/api/generated/channels/channels", () => ({
  getChannels: () => api,
}));

vi.mock("@/lib/api/telegram", () => ({
  telegramApi: {
    startAccount: api.startAccount,
    confirmCode: api.confirmCode,
    confirmPassword: api.confirmPassword,
  },
}));

vi.mock("@/lib/api/channels", () => ({
  channelsManagementApi: { disconnect: api.disconnect },
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <ChannelsPage />
    </QueryClientProvider>,
  );
}

describe("ChannelsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listChannelsApiV1ChannelsGet.mockReset();
    api.disconnect.mockReset();
    api.disconnect.mockResolvedValue(undefined);
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([
      {
        id: "telegram-account",
        type: "telegram",
        name: "Telegram Тимура",
        status: "active",
        settings: { transport: "mtproto", username: "timur" },
        created_at: "2026-07-27T00:00:00Z",
        updated_at: "2026-07-27T00:00:00Z",
      },
    ]);
    api.startAccount.mockResolvedValue({ channel_id: "channel-new", status: "code_required" });
    api.confirmCode.mockResolvedValue({ channel_id: "channel-new", status: "password_required", display_name: "" });
    api.confirmPassword.mockResolvedValue({ channel_id: "channel-new", status: "active", display_name: "Тимур" });
  });

  it("opens channel actions and disconnects Telegram", async () => {
    renderPage();

    const menuButton = await screen.findByRole("button", { name: "Меню канала Telegram" });
    fireEvent.click(menuButton);
    fireEvent.click(screen.getByRole("menuitem", { name: "Отключить канал" }));

    await waitFor(() => expect(api.disconnect).toHaveBeenCalledWith("telegram-account"));
    expect(await screen.findByRole("status")).toHaveTextContent("Канал отключён");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the channel block moved from settings with live connection state", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Каналы" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Каналы связи")).toBeInTheDocument();
    expect(screen.getByText("Telegram")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("VK")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Логотип VK" })).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.getByText("Avito")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Меню канала Telegram" })).toBeInTheDocument();
    expect(screen.getByText("@timur")).toBeInTheDocument();
    expect(screen.getByText("Работает")).toBeInTheDocument();
    expect(screen.getAllByText("Не подключено")).toHaveLength(5);
  });

  it("shows which Telegram account is connected and exposes reconnection", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Меню канала Telegram" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Заменить аккаунт…" }));

    expect(screen.getByRole("dialog", { name: "Заменить Telegram-аккаунт" })).toBeInTheDocument();
    expect(screen.getByText(/текущий канал будет приостановлен/)).toBeInTheDocument();
    expect(screen.getByText("@timur")).toBeInTheDocument();
  });

  it("keeps connection controls available when statuses cannot be loaded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    api.listChannelsApiV1ChannelsGet.mockRejectedValue(
      new Error("Network Error"),
    );
    renderPage();

    expect(
      await screen.findByText(
        "Статусы каналов недоступны",
        {},
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Подключить" }),
    ).toBeInTheDocument();
  });

  it("connects a Telegram account through the moved settings dialog", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    renderPage();

    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Загружаем каналы" }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Подключить" }));
    fireEvent.click(screen.getByRole("button", { name: /По номеру телефона/ }));
    fireEvent.change(screen.getByLabelText("Номер телефона"), {
      target: { value: "+79991234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Получить код" }));
    await waitFor(() =>
      expect(api.startAccount).toHaveBeenCalledWith({ phone: "+79991234567" }),
    );
  });
});
