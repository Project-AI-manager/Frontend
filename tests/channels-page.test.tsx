import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ChannelsPage from "@/app/channels/page";

const api = vi.hoisted(() => ({
  listChannelsApiV1ChannelsGet: vi.fn(),
  connectChannelApiV1ChannelsPost: vi.fn(),
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
    api.connectChannelApiV1ChannelsPost.mockReset();
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
    api.connectChannelApiV1ChannelsPost.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the standalone channel catalog and live connection state", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Каналы" }),
    ).toBeInTheDocument();
    await screen.findByText("Telegram Тимура");
    expect(screen.getByText("Telegram Тимура")).toBeInTheDocument();
    expect(screen.getByText("@timur")).toBeInTheDocument();
    expect(screen.getAllByText("Подключено").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Telegram Bot")).toBeInTheDocument();
    expect(screen.getAllByText("VK").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("MAX").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Avito")).toBeInTheDocument();
    expect(screen.getByText("Веб-чат")).toBeInTheDocument();
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
    expect(
      screen.getByRole("button", { name: "Отправить код" }),
    ).toBeInTheDocument();
  });

  it("connects a Telegram bot through the generated channels client", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    renderPage();

    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Загружаем каналы" }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Подключить" }));
    fireEvent.change(screen.getByLabelText("Токен Telegram Bot"), {
      target: { value: "1234567890:telegram-token" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "@autopilot_bot" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(api.connectChannelApiV1ChannelsPost).toHaveBeenCalledWith({
        type: "telegram",
        bot_token: "1234567890:telegram-token",
        bot_username: "@autopilot_bot",
        name: "Telegram Bot",
      }),
    );
  });
});
