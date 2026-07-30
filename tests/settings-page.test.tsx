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
  balance_kopecks: 100000,
  expenses_kopecks: 0,
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
    expect(screen.getByText("Доля автоматических ответов")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("1 000 ₽")).toBeInTheDocument();
    expect(
      screen.getByText("Бонусный баланс для работы ассистента"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 ₽")).toBeInTheDocument();
    expect(screen.getByText("Расход за текущий месяц")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Сумма, ₽")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Пополнить" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument();
    expect(screen.queryByText("Каналы связи")).not.toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText("Доля автоматических ответов"), {
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

  it("does not expose internal AI integration diagnostics", async () => {
    renderPage();

    expect(await screen.findByText("Поведение ассистента")).toBeInTheDocument();
    expect(screen.queryByText("Подключения AI")).not.toBeInTheDocument();
    expect(integrationsApi.getHealth).not.toHaveBeenCalled();
  });
});
