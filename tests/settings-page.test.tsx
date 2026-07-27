import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "@/app/settings/page";

const channelsApi = vi.hoisted(() => ({
  listChannelsApiV1ChannelsGet: vi.fn(),
}));

const integrationsApi = vi.hoisted(() => ({
  getHealth: vi.fn(),
  probeLlm: vi.fn(),
  probeEmbeddings: vi.fn(),
}));

const telegramApi = vi.hoisted(() => ({
  startAccount: vi.fn(),
  confirmCode: vi.fn(),
  confirmPassword: vi.fn(),
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
vi.mock("@/lib/api/integrations", () => ({ integrationsApi }));
vi.mock("@/lib/api/telegram", () => ({ telegramApi }));

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

const integrationsHealth = {
  llm: { name: "llm", status: "ok", message: "Omni Router готов", details: {} },
  embeddings: { name: "embeddings", status: "not_configured", message: "Не настроено", details: {} },
  qdrant: { name: "qdrant", status: "ok", message: "Qdrant готов", details: {} },
  email: { name: "email", status: "disabled", message: "Отключено", details: {} },
  telegram: { name: "telegram", status: "ok", message: "Telegram готов", details: {} },
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
    integrationsApi.getHealth.mockResolvedValue(integrationsHealth);
    integrationsApi.probeLlm.mockResolvedValue(integrationsHealth.llm);
    integrationsApi.probeEmbeddings.mockResolvedValue({
      ...integrationsHealth.embeddings,
      status: "ok",
      message: "Вектор получен",
    });
    telegramApi.startAccount.mockResolvedValue({ channel_id: "channel-new", status: "code_required" });
    telegramApi.confirmCode.mockResolvedValue({ channel_id: "channel-new", status: "password_required", display_name: "" });
    telegramApi.confirmPassword.mockResolvedValue({ channel_id: "channel-new", status: "active", display_name: "Тимур" });
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
    expect(screen.getAllByText("Работает").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Не подключено")).toHaveLength(5);
    expect(screen.queryByRole("link", { name: "Подключить" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Скоро")).toHaveLength(5);
  });

  it("keeps settings visible when channel listing is forbidden", async () => {
    channelsApi.listChannelsApiV1ChannelsGet.mockRejectedValueOnce(
      new Error("403 Forbidden"),
    );

    renderPage();

    expect(await screen.findByText("Поведение ассистента")).toBeInTheDocument();
    expect(screen.queryByText("Настройки не загрузились")).not.toBeInTheDocument();
    expect(screen.getAllByText("Не подключено")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Подключить" })).toBeInTheDocument();
    expect(screen.getAllByText("Скоро")).toHaveLength(5);
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

  it("connects a Telegram account through phone, OTP and 2FA", async () => {
    channelsApi.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Подключить" }));
    expect(screen.getByRole("dialog", { name: "Подключить Telegram" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Номер телефона"), { target: { value: "+79991234567" } });
    fireEvent.click(screen.getByRole("button", { name: "Получить код" }));
    await waitFor(() => expect(telegramApi.startAccount).toHaveBeenCalledWith({ phone: "+79991234567" }));

    fireEvent.change(await screen.findByLabelText("Код подтверждения"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить" }));
    await waitFor(() => expect(telegramApi.confirmCode).toHaveBeenCalledWith({ channel_id: "channel-new", code: "12345" }));

    fireEvent.change(await screen.findByLabelText("Облачный пароль"), { target: { value: "secret-password" } });
    fireEvent.click(screen.getByRole("dialog").querySelector('button[type="submit"]')!);
    await waitFor(() => expect(telegramApi.confirmPassword).toHaveBeenCalledWith({ channel_id: "channel-new", password: "secret-password" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(channelsApi.listChannelsApiV1ChannelsGet).toHaveBeenCalledTimes(2);
  });

  it("shows integration health and runs manual probes", async () => {
    renderPage();

    expect(await screen.findByText("Подключения AI")).toBeInTheDocument();
    expect(screen.getByText("Omni Router готов")).toBeInTheDocument();
    expect(screen.getByText("Ключи и адреса хранятся только в окружении backend и здесь не отображаются.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Проверить ответ" }));
    fireEvent.click(screen.getByRole("button", { name: "Проверить вектор" }));
    await waitFor(() => expect(integrationsApi.probeLlm).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(integrationsApi.probeEmbeddings).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Вектор получен")).toBeInTheDocument();
  });
});
