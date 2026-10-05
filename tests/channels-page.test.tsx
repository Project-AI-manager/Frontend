import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ChannelsPage from "@/app/channels/page";

const api = vi.hoisted(() => ({
  listChannelsApiV1ChannelsGet: vi.fn(),
  disconnect: vi.fn(),
  startAccount: vi.fn(),
  connectTelegramBot: vi.fn(),
  confirmCode: vi.fn(),
  confirmPassword: vi.fn(),
  connectWhatsApp: vi.fn(),
  connectVk: vi.fn(),
  startAvitoOAuth: vi.fn(),
  startInstagramOAuth: vi.fn(),
  connectMax: vi.fn(),
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
    connectBot: api.connectTelegramBot,
    confirmCode: api.confirmCode,
    confirmPassword: api.confirmPassword,
  },
}));

vi.mock("@/lib/api/channels", () => ({
  channelsManagementApi: { disconnect: api.disconnect },
}));

vi.mock("@/lib/api/whatsapp", () => ({
  whatsappApi: { connect: api.connectWhatsApp },
}));

vi.mock("@/lib/api/avito", () => ({
  avitoApi: { startOAuth: api.startAvitoOAuth },
}));

vi.mock("@/lib/api/vk", () => ({
  vkApi: { connect: api.connectVk },
}));

vi.mock("@/lib/api/instagram", () => ({
  instagramApi: { startOAuth: api.startInstagramOAuth },
}));

vi.mock("@/lib/api/max", () => ({
  maxApi: { connect: api.connectMax },
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
    api.connectWhatsApp.mockReset();
    api.startAvitoOAuth.mockReset();
    api.connectVk.mockReset();
    api.startInstagramOAuth.mockReset();
    api.connectMax.mockReset();
    api.disconnect.mockResolvedValue(undefined);
    api.connectWhatsApp.mockResolvedValue({
      id: "whatsapp-new",
      type: "whatsapp",
      name: "WhatsApp магазина",
      status: "active",
      settings: {},
      created_at: "2026-08-08T00:00:00Z",
      updated_at: "2026-08-08T00:00:00Z",
    });
    api.connectVk.mockResolvedValue({
      id: "vk-new",
      type: "vk",
      name: "VK магазина",
      status: "active",
      settings: { callback_url: "https://api.example.test/api/v1/channels/webhook/vk/opaque" },
      created_at: "2026-08-08T00:00:00Z",
      updated_at: "2026-08-08T00:00:00Z",
    });
    api.connectMax.mockResolvedValue({ id: "max-new", type: "max", name: "MAX", status: "active", settings: {} });
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
    api.connectTelegramBot.mockResolvedValue({ id: "telegram-bot-new", type: "telegram_bot", name: "Бот", status: "active", settings: {} });
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
    expect(screen.getByText("Telegram-бот")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("VK")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Логотип VK" })).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.getByText("Avito")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Меню канала Telegram" })).toBeInTheDocument();
    expect(screen.getByText("@timur")).toBeInTheDocument();
    expect(screen.getByText("Работает")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp Business")).toBeInTheDocument();
    expect(screen.getAllByText("Не подключено")).toHaveLength(7);
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
      screen.getByRole("button", { name: "Подключить Telegram" }),
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
    fireEvent.click(await screen.findByRole("button", { name: "Подключить Telegram" }));
    fireEvent.click(screen.getByRole("button", { name: /По номеру телефона/ }));
    fireEvent.change(screen.getByLabelText("Номер телефона"), {
      target: { value: "+79991234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Получить код" }));
    await waitFor(() =>
      expect(api.startAccount).toHaveBeenCalledWith({ phone: "+79991234567" }),
    );
  });

  it("opens WhatsApp Cloud API connection from the channel catalog", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Подключить WhatsApp Business" }));

    expect(
      screen.getByRole("dialog", { name: "WhatsApp Business" }),
    ).toBeInTheDocument();
  });

  it("opens personal WhatsApp QR connection from its own channel card", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Подключить WhatsApp" }));

    expect(screen.getByRole("dialog", { name: "Личный аккаунт WhatsApp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Получить QR-код" })).toBeInTheDocument();
  });

  it("connects a Telegram bot separately by its BotFather token", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Подключить Telegram-бот" }));
    expect(screen.getByRole("dialog", { name: "Подключить Telegram-бота" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Токен бота"), {
      target: { value: "123456789:abcdefghijklmnopqrstuvwxyz" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Подключить бота" }));

    await waitFor(() =>
      expect(api.connectTelegramBot).toHaveBeenCalledWith({ bot_token: "123456789:abcdefghijklmnopqrstuvwxyz" }),
    );
  });

  it("shows that a locally validated bot still needs a public HTTPS webhook", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([
      {
        id: "telegram-bot-pending",
        type: "telegram_bot",
        name: "Бот магазина",
        status: "pending",
        settings: { bot_username: "shop_bot", webhook_configured: false },
      },
    ]);
    renderPage();

    expect(await screen.findByText("Токен проверен · нужен HTTPS webhook")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Настроить Telegram-бота" }));
    expect(screen.getByText(/На локальном адресе Telegram не сможет доставлять сообщения/)).toBeInTheDocument();
  });

  it("shows one active personal WhatsApp by phone and keeps Business separate", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([
      {
        id: "whatsapp-personal-active",
        type: "whatsapp",
        name: "WhatsApp · 79274934757:61@s.whatsapp.net",
        status: "active",
        settings: { transport: "whatsmeow" },
      },
      {
        id: "whatsapp-personal-old",
        type: "whatsapp",
        name: "WhatsApp · 79274934757:60@s.whatsapp.net",
        status: "disabled",
        settings: {},
      },
    ]);

    renderPage();

    expect(await screen.findByText("WhatsApp · +79274934757")).toBeInTheDocument();
    expect(screen.getByText("Личный аккаунт · QR")).toBeInTheDocument();
    expect(screen.queryByText("WhatsApp · 79274934757:60@s.whatsapp.net")).not.toBeInTheDocument();
    expect(screen.getByText("WhatsApp Business")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Подключить WhatsApp" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Подключить WhatsApp Business" })).toBeInTheDocument();
  });

  it("offers reconnect for an active WhatsApp channel", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([
      {
        id: "whatsapp-account",
        type: "whatsapp",
        name: "WhatsApp магазина",
        status: "active",
        settings: { phone_number_id: "123456789" },
        created_at: "2026-08-08T00:00:00Z",
        updated_at: "2026-08-08T00:00:00Z",
      },
    ]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Меню канала WhatsApp Business" }));
    fireEvent.click(within(screen.getByRole("menu", { name: "Действия с каналом WhatsApp Business" })).getByRole("menuitem", { name: "Переподключить…" }));

    expect(
      screen.getByRole("dialog", { name: "Переподключить WhatsApp Business" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Phone Number ID 123456789")).toBeInTheDocument();
  });

  it("opens Avito OAuth connection from the channel catalog", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Подключить Avito" }));
    expect(screen.getByRole("dialog", { name: "Подключить Avito" })).toBeInTheDocument();
  });

  it("opens VK connection from the channel catalog", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Подключить VK" }));
    expect(screen.getByRole("dialog", { name: "Подключить VK" })).toBeInTheDocument();
  });

  it("opens Instagram OAuth and MAX token dialogs", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Подключить Instagram" }));
    expect(screen.getByRole("dialog", { name: "Подключить Instagram" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Закрыть подключение Instagram Messaging API" }));
    fireEvent.click(screen.getByRole("button", { name: "Подключить Max" }));
    expect(screen.getByRole("dialog", { name: "Подключить MAX" })).toBeInTheDocument();
  });

  it("offers reconnect for active Instagram and MAX channels", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([
      { id: "ig-current", type: "instagram", name: "Instagram", status: "active", settings: { username: "shop" } },
      { id: "max-current", type: "max", name: "MAX магазина", status: "active", settings: { username: "max_shop", bot_id: 42 } },
    ]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Меню канала Instagram" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Переподключить…" }));
    expect(screen.getByRole("dialog", { name: "Переподключить Instagram" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Закрыть подключение Instagram Messaging API" }));

    fireEvent.click(screen.getByRole("button", { name: "Меню канала Max" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Переподключить…" }));
    expect(screen.getByRole("dialog", { name: "Переподключить MAX" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Название канала/)).toHaveValue("MAX магазина");
  });

  it("offers reconnect and displays the active VK community", async () => {
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([
      {
        id: "vk-account",
        type: "vk",
        name: "VK магазина",
        status: "active",
        settings: { group_id: 123456, group_name: "Магазин", screen_name: "shop" },
        created_at: "2026-08-08T00:00:00Z",
        updated_at: "2026-08-08T00:00:00Z",
      },
    ]);
    renderPage();

    expect(await screen.findByText("@shop")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Меню канала VK" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Переподключить…" }));
    expect(screen.getByRole("dialog", { name: "Переподключить VK" })).toBeInTheDocument();
    expect(screen.getByLabelText("ID сообщества")).toHaveValue("123456");
  });
});
