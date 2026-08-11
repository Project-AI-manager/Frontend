import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MaxConnectDialog } from "@/components/settings/max-connect-dialog";

const api = vi.hoisted(() => ({ connect: vi.fn() }));
vi.mock("@/lib/api/max", () => ({ maxApi: { connect: api.connect } }));

describe("MaxConnectDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.connect.mockResolvedValue({ id: "max-1", type: "max", status: "active", settings: {} });
  });

  it("submits trimmed bot credentials and closes after refresh", async () => {
    const onClose = vi.fn();
    const onConnected = vi.fn().mockResolvedValue(undefined);
    render(<MaxConnectDialog onClose={onClose} onConnected={onConnected} />);
    fireEvent.change(screen.getByLabelText(/Название канала/), { target: { value: " MAX магазина " } });
    fireEvent.change(screen.getByLabelText("Токен бота"), { target: { value: " bot-token-123 " } });
    fireEvent.click(screen.getByRole("button", { name: "Подключить" }));
    await waitFor(() => expect(api.connect).toHaveBeenCalledWith({ bot_token: "bot-token-123", name: "MAX магазина" }));
    expect(onConnected).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("passes channel id when reconnecting", async () => {
    render(<MaxConnectDialog replacing replaceChannelId="max-current" initialName="MAX" onClose={vi.fn()} onConnected={vi.fn().mockResolvedValue(undefined)} />);
    fireEvent.change(screen.getByLabelText("Токен бота"), { target: { value: " new-bot-token " } });
    fireEvent.click(screen.getByRole("button", { name: "Переподключить" }));
    await waitFor(() => expect(api.connect).toHaveBeenCalledWith(expect.objectContaining({ replace_channel_id: "max-current" })));
  });
});
