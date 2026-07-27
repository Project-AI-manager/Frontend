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
  date_from: "2026-06-28",
  date_to: "2026-07-27",
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
  daily_series: Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 5, 28 + index));
    return {
      date: date.toISOString().slice(0, 10),
      dialogs: 100 + index,
    };
  }),
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

    expect((await screen.findAllByText("4 812")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Другой период" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выгрузить подробно" })).toBeInTheDocument();
    expect(screen.getByText("Средний ответ")).toBeInTheDocument();
    expect(screen.getByText("12 сек")).toBeInTheDocument();
    expect(screen.getByText("78%")).toBeInTheDocument();
    expect(screen.getByText("С ответом автопилота")).toBeInTheDocument();
    expect(screen.getByText("Автопилот ответил в 3 753 диалогах")).toBeInTheDocument();
    expect(screen.queryByText(/п\.п\./i)).not.toBeInTheDocument();
    expect(screen.getByText("Обращения по дням")).toBeInTheDocument();
    expect(screen.getByText("115 / день")).toBeInTheDocument();
    expect(screen.getByText("28.06")).toBeInTheDocument();
    expect(screen.getByText("27.07")).toBeInTheDocument();
    expect(screen.getByLabelText("27.07: 129 обращений")).toBeInTheDocument();
    expect(screen.getByText("Распределение диалогов")).toBeInTheDocument();
    expect(screen.getByText("Ответы и сообщения")).toBeInTheDocument();
  });

  it("switches the segmented period control", async () => {
    renderPage();
    await screen.findAllByText("4 812");

    const sevenDays = screen.getByRole("button", { name: "7 дней" });
    const thirtyDays = screen.getByRole("button", { name: "30 дней" });
    expect(thirtyDays).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(sevenDays);

    expect(sevenDays).toHaveAttribute("aria-pressed", "true");
    expect(thirtyDays).toHaveAttribute("aria-pressed", "false");
    await waitFor(() => expect(api.getOverview).toHaveBeenCalledTimes(2));
    const firstPeriod = api.getOverview.mock.calls[0][0];
    const secondPeriod = api.getOverview.mock.calls[1][0];
    expect(firstPeriod).toEqual(expect.objectContaining({ from: expect.any(String), to: expect.any(String) }));
    expect(secondPeriod.to).toBe(firstPeriod.to);
    expect(secondPeriod.from).not.toBe(firstPeriod.from);
  });

  it("applies a custom period", async () => {
    renderPage();
    await screen.findAllByText("4 812");

    fireEvent.click(screen.getByRole("button", { name: "Другой период" }));
    fireEvent.change(screen.getByLabelText("Начало периода"), { target: { value: "2026-07-01" } });
    fireEvent.change(screen.getByLabelText("Конец периода"), { target: { value: "2026-07-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Применить" }));

    await waitFor(() => expect(api.getOverview).toHaveBeenCalledTimes(2));
    expect(api.getOverview).toHaveBeenLastCalledWith({ from: "2026-07-01", to: "2026-07-15" });
    expect(screen.getByRole("button", { name: "Другой период" })).toHaveAttribute("aria-pressed", "true");
  });

  it("downloads the detailed report as CSV", async () => {
    const createObjectURL = vi.fn(() => "blob:analytics");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    renderPage();
    await screen.findAllByText("4 812");

    fireEvent.click(screen.getByRole("button", { name: "Выгрузить подробно" }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:analytics");
    click.mockRestore();
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
    expect((await screen.findAllByText("4 812")).length).toBeGreaterThan(0);
  });
});
