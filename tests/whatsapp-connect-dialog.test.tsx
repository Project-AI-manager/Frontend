import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WhatsAppConnectDialog } from "@/components/settings/whatsapp-connect-dialog";

const api = vi.hoisted(() => ({ connect: vi.fn() }));

vi.mock("@/lib/api/whatsapp", () => ({
  whatsappApi: { connect: api.connect },
}));

describe("WhatsAppConnectDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.connect.mockResolvedValue({
      id: "wa-1",
      type: "whatsapp",
      name: "WhatsApp магазина",
      status: "active",
      settings: {},
      created_at: "2026-08-08T00:00:00Z",
      updated_at: "2026-08-08T00:00:00Z",
    });
  });

  it("submits trimmed Cloud API credentials and completes connection", async () => {
    const onClose = vi.fn();
    const onConnected = vi.fn().mockResolvedValue(undefined);
    render(<WhatsAppConnectDialog onClose={onClose} onConnected={onConnected} />);

    fireEvent.change(screen.getByLabelText("Название канала"), {
      target: { value: " WhatsApp магазина " },
    });
    fireEvent.change(screen.getByLabelText("Phone Number ID"), {
      target: { value: " 123456 " },
    });
    fireEvent.change(screen.getByLabelText("WhatsApp Business Account ID"), {
      target: { value: " 654321 " },
    });
    fireEvent.change(screen.getByLabelText("Permanent access token"), {
      target: { value: " access-token " },
    });
    fireEvent.change(screen.getByLabelText("App secret"), {
      target: { value: " app-secret " },
    });
    fireEvent.change(screen.getByLabelText("Verify token"), {
      target: { value: " verify-token " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Подключить" }));

    await waitFor(() =>
      expect(api.connect).toHaveBeenCalledWith({
        phone_number_id: "123456",
        waba_id: "654321",
        access_token: "access-token",
        app_secret: "app-secret",
        verify_token: "verify-token",
        name: "WhatsApp магазина",
      }),
    );
    expect(onConnected).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Завершите настройку webhook")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Готово" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the dialog open and shows an API error", async () => {
    api.connect.mockRejectedValue(new Error("bad credentials"));
    const onClose = vi.fn();
    render(
      <WhatsAppConnectDialog
        onClose={onClose}
        onConnected={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    for (const [label, value] of [
      ["Название канала", "WhatsApp"],
      ["Phone Number ID", "123"],
      ["WhatsApp Business Account ID", "456"],
      ["Permanent access token", "token"],
      ["App secret", "secret"],
      ["Verify token", "verify"],
    ]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Подключить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось подключить WhatsApp",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("passes the current channel id for an atomic reconnect", async () => {
    render(
      <WhatsAppConnectDialog
        replacing
        replaceChannelId="wa-current"
        onClose={vi.fn()}
        onConnected={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    for (const [label, value] of [
      ["Название канала", "WhatsApp"],
      ["Phone Number ID", "123"],
      ["WhatsApp Business Account ID", "456"],
      ["Permanent access token", "access-token"],
      ["App secret", "app-secret"],
      ["Verify token", "verify-token"],
    ]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Переподключить" }));

    await waitFor(() =>
      expect(api.connect).toHaveBeenCalledWith(
        expect.objectContaining({ replace_channel_id: "wa-current" }),
      ),
    );
  });
});
