import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AnalyticsPage from "@/app/analytics/page";

const api = vi.hoisted(() => ({
  getOverview: vi.fn(),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api/analytics", () => ({
  analyticsApi: api,
}));

const overview = {
  dialogs_total: 4812,
  dialogs_open: 100,
  dialogs_auto: 3753,
  dialogs_escalated: 190,
  dialogs_closed: 4522,
  auto_reply_rate: 0.78,
  escalation_rate: 0.04,
  avg_response_sec: 12,
  avg_ai_confidence: 0.91,
  ai_replies_count: 4812,
  manager_replies_count: 1059,
  inbound_messages_count: 8200,
  dialogs_used: 4812,
  dialogs_limit: 10000,
  knowledge_documents_ready: 26,
  knowledge_chunks_count: 180,
  pending_candidates_count: 3,
  status_breakdown: [],
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <AnalyticsPage />
    </QueryClientProvider>,
  );
}

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getOverview.mockResolvedValue(overview);
  });

  it("renders the normal reference analytics layout with live values", async () => {
    renderPage();

    expect(await screen.findByText("4 812")).toBeInTheDocument();
    expect(screen.getByText("28 июня — 27 июля")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выгрузить" })).toBeInTheDocument();
    expect(screen.getByText("Токенов")).toBeInTheDocument();
    expect(screen.getByText("8,4 млн")).toBeInTheDocument();
    expect(screen.getByText("78%")).toBeInTheDocument();
    expect(screen.getByText("Обращения по дням")).toBeInTheDocument();
    expect(screen.getByText("155 / день")).toBeInTheDocument();
    expect(screen.getByText("Расход по каналам")).toBeInTheDocument();
    expect(screen.getByText("Когда пишут клиенты")).toBeInTheDocument();
  });

  it("switches the segmented period control", async () => {
    renderPage();
    await screen.findByText("4 812");

    const sevenDays = screen.getByRole("button", { name: "7 дней" });
    const thirtyDays = screen.getByRole("button", { name: "30 дней" });
    expect(thirtyDays).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(sevenDays);

    expect(sevenDays).toHaveAttribute("aria-pressed", "true");
    expect(thirtyDays).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the reference empty state", async () => {
    api.getOverview.mockResolvedValueOnce({
      ...overview,
      dialogs_total: 0,
      dialogs_used: 0,
    });
    renderPage();

    expect(await screen.findByText("Данных пока недостаточно")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Графики появятся, когда наберётся хотя бы день переписок.",
      ),
    ).toBeInTheDocument();
  });

  it("retries the live API from the reference error state", async () => {
    api.getOverview
      .mockRejectedValueOnce(new Error("Ошибка сети"))
      .mockResolvedValueOnce(overview);
    renderPage();

    expect(await screen.findByText("Аналитика не загрузилась")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    await waitFor(() => expect(api.getOverview).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("4 812")).toBeInTheDocument();
  });
});
