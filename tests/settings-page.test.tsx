import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "@/app/settings/page";

const channelsApi = vi.hoisted(() => ({
  listChannelsApiV1ChannelsGet: vi.fn(),
}));

const settingsApi = vi.hoisted(() => ({
  getAiSettings: vi.fn(),
  updateAiSettings: vi.fn(),
  getBillingSettings: vi.fn(),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({
    children,
    immersive,
  }: {
    children: React.ReactNode;
    immersive?: boolean;
  }) => <div data-immersive={immersive ? "true" : "false"}>{children}</div>,
}));

vi.mock("@/lib/api/generated/channels/channels", () => ({
  getChannels: () => channelsApi,
}));

vi.mock("@/lib/api/settings", () => ({ settingsApi }));

const aiSettings = {
  auto_reply_enabled: true,
  confidence_threshold: 72,
  llm_provider: "openai",
  embedding_model: "text-embedding-3-small",
  system_prompt: "",
  available_providers: ["openai"],
};

const billingSettings = {
  plan: "demo",
  plan_name: "Демо",
  subscription_status: "active",
  dialogs_used: 10,
  dialogs_limit: 500,
  ai_replies_used: 20,
  channel_limit: 1,
};

const telegram = {
  id: "channel-1",
  type: "telegram",
  name: "Telegram account",
  status: "active",
  settings: { transport: "mtproto" },
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsPage />
    </QueryClientProvider>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsApi.getAiSettings.mockResolvedValue(aiSettings);
    settingsApi.getBillingSettings.mockResolvedValue(billingSettings);
    settingsApi.updateAiSettings.mockResolvedValue(aiSettings);
    channelsApi.listChannelsApiV1ChannelsGet.mockResolvedValue([telegram]);
  });

  it("renders the exact normal-state sections in immersive layout", async () => {
    const { container } = renderPage();

    expect(await screen.findByText("Поведение ассистента")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("data-immersive", "true");
    expect(screen.getByText("Отвечать автоматически")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("7 520 ₽")).toBeInTheDocument();
    expect(
      screen.getByText("Хватит примерно на 2 900 ответов"),
    ).toBeInTheDocument();
    expect(screen.getByText("12 480 ₽")).toBeInTheDocument();
    expect(screen.getByText("−14% к июню")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Сумма, ₽")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Пополнить" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument();
    expect(document.getElementById("channels")).toBeInTheDocument();
  });

  it("merges live channels into the canonical six-channel catalog", async () => {
    renderPage();

    expect(await screen.findByText("Telegram")).toBeInTheDocument();
    for (const name of ["WhatsApp", "Avito", "Instagram", "Max"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getAllByText("VK")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Меню канала Telegram" })).toBeInTheDocument();
    expect(screen.getByText("Работает")).toBeInTheDocument();
    expect(screen.getAllByText("Не подключено")).toHaveLength(5);
    expect(screen.getAllByRole("link", { name: "Подключить" })).toHaveLength(5);
  });

  it("keeps settings visible when channel listing is forbidden", async () => {
    channelsApi.listChannelsApiV1ChannelsGet.mockRejectedValueOnce(
      new Error("403 Forbidden"),
    );

    renderPage();

    expect(await screen.findByText("Поведение ассистента")).toBeInTheDocument();
    expect(screen.queryByText("Настройки не загрузились")).not.toBeInTheDocument();
    expect(screen.getAllByText("Не подключено")).toHaveLength(6);
    expect(screen.getAllByRole("link", { name: "Подключить" })).toHaveLength(6);
  });

  it("auto-saves toggle and confidence changes without adding a save button", async () => {
    renderPage();
    await screen.findByText("Поведение ассистента");

    fireEvent.click(
      screen.getByRole("switch", { name: "Автоматические ответы" }),
    );

    await waitFor(() =>
      expect(settingsApi.updateAiSettings).toHaveBeenCalledWith({
        auto_reply_enabled: false,
        confidence_threshold: 72,
      }),
    );

    fireEvent.change(screen.getByLabelText("Порог уверенности для передачи человеку"), {
      target: { value: "64" },
    });

    await waitFor(() =>
      expect(settingsApi.updateAiSettings).toHaveBeenLastCalledWith({
        auto_reply_enabled: false,
        confidence_threshold: 64,
      }),
    );
    expect(screen.getByText("64%")).toBeInTheDocument();
  });
});
