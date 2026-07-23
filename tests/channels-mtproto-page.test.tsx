import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChannelsPage from "@/app/channels/page";

const api = vi.hoisted(() => ({
  listChannelsApiV1ChannelsGet: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/lib/api/generated/channels/channels", () => ({ getChannels: () => api }));
vi.mock("@/lib/api/client", () => ({ axiosInstance: { post: api.post } }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ChannelsPage />
    </QueryClientProvider>,
  );
}

describe("Telegram personal account flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listChannelsApiV1ChannelsGet.mockResolvedValue([]);
    api.post
      .mockResolvedValueOnce({ data: { channel_id: "channel-1", status: "code_required" } })
      .mockResolvedValueOnce({ data: { channel_id: "channel-1", status: "active", display_name: "Тимур" } });
  });

  it("starts and confirms OTP authorization", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Номер телефона"), {
      target: { value: "+79990001122" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить код" }));

    expect(await screen.findByText("Код отправлен в Telegram. Введи его ниже.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Код из Telegram"), {
      target: { value: "12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить код" }));

    await waitFor(() =>
      expect(api.post).toHaveBeenLastCalledWith(
        "/api/v1/channels/telegram/account/confirm",
        { channel_id: "channel-1", code: "12345" },
      ),
    );
    expect(await screen.findByText("Telegram подключён: Тимур")).toBeInTheDocument();
  });
});
