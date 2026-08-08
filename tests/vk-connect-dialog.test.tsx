import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VkConnectDialog } from "@/components/settings/vk-connect-dialog";

const api = vi.hoisted(() => ({ connect: vi.fn() }));

vi.mock("@/lib/api/vk", () => ({
  vkApi: { connect: api.connect },
}));

function fillForm() {
  fireEvent.change(screen.getByLabelText("Название канала"), {
    target: { value: " VK магазина " },
  });
  fireEvent.change(screen.getByLabelText("ID сообщества"), {
    target: { value: "123456" },
  });
  fireEvent.change(screen.getByLabelText("Ключ доступа сообщества"), {
    target: { value: " vk-community-access-token " },
  });
  fireEvent.change(screen.getByLabelText("Строка подтверждения"), {
    target: { value: " confirmation-code " },
  });
  fireEvent.change(screen.getByLabelText("Секретный ключ"), {
    target: { value: " callback-secret " },
  });
}

describe("VkConnectDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.connect.mockResolvedValue({
      id: "vk-1",
      type: "vk",
      name: "VK магазина",
      status: "active",
      settings: {
        group_id: 123456,
        group_name: "Магазин",
        screen_name: "shop",
        callback_url: "https://api.example.test/api/v1/channels/webhook/vk/opaque",
      },
      created_at: "2026-08-08T00:00:00Z",
      updated_at: "2026-08-08T00:00:00Z",
    });
  });

  it("submits trimmed credentials and shows one-time setup values", async () => {
    const onConnected = vi.fn().mockResolvedValue(undefined);
    render(
      <VkConnectDialog onClose={vi.fn()} onConnected={onConnected} />,
    );
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Подключить" }));

    await waitFor(() =>
      expect(api.connect).toHaveBeenCalledWith({
        group_id: 123456,
        access_token: "vk-community-access-token",
        callback_confirmation: "confirmation-code",
        callback_secret: "callback-secret",
        name: "VK магазина",
      }),
    );
    expect(onConnected).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog", { name: "Завершите настройку Callback API" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://api.example.test/api/v1/channels/webhook/vk/opaque")).toBeInTheDocument();
    expect(screen.getByDisplayValue("confirmation-code")).toBeInTheDocument();
    expect(screen.getByText(/Токен сохранён на сервере/)).toBeInTheDocument();
  });

  it("keeps the dialog open and shows an API error", async () => {
    api.connect.mockRejectedValue(new Error("bad credentials"));
    render(<VkConnectDialog onClose={vi.fn()} onConnected={vi.fn()} />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Подключить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось подключить VK");
  });

  it("prefills non-secret community data on reconnect", () => {
    render(
      <VkConnectDialog
        replacing
        replaceChannelId="vk-channel-1"
        initialGroupId="123456"
        initialName="VK магазина"
        onClose={vi.fn()}
        onConnected={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Переподключить VK" })).toBeInTheDocument();
    expect(screen.getByLabelText("ID сообщества")).toHaveValue("123456");
    expect(screen.getByLabelText("Название канала")).toHaveValue("VK магазина");
    expect(screen.getByLabelText("Ключ доступа сообщества")).toHaveValue("");
  });
});
