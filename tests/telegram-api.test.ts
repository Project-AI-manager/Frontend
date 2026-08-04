import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/client";
import { telegramApi } from "@/lib/api/telegram";

vi.mock("@/lib/api/client", () => ({ apiClient: vi.fn() }));

describe("telegramApi", () => {
  beforeEach(() => vi.mocked(apiClient).mockReset());

  it("calls the MTProto phone, QR, OTP and 2FA endpoints", async () => {
    vi.mocked(apiClient).mockResolvedValue({});

    await telegramApi.startAccount({ phone: "+79991234567" });
    await telegramApi.startQrAccount();
    await telegramApi.getQrStatus("channel-1");
    await telegramApi.confirmCode({ channel_id: "channel-1", code: "12345" });
    await telegramApi.confirmPassword({ channel_id: "channel-1", password: "secret" });

    expect(apiClient).toHaveBeenNthCalledWith(1, {
      url: "/api/v1/channels/telegram/account/start",
      method: "POST",
      data: { phone: "+79991234567" },
    });
    expect(apiClient).toHaveBeenNthCalledWith(2, {
      url: "/api/v1/channels/telegram/account/qr/start",
      method: "POST",
    });
    expect(apiClient).toHaveBeenNthCalledWith(3, {
      url: "/api/v1/channels/telegram/account/qr/channel-1/status",
      method: "GET",
    });
    expect(apiClient).toHaveBeenNthCalledWith(4, {
      url: "/api/v1/channels/telegram/account/confirm",
      method: "POST",
      data: { channel_id: "channel-1", code: "12345" },
    });
    expect(apiClient).toHaveBeenNthCalledWith(5, {
      url: "/api/v1/channels/telegram/account/password",
      method: "POST",
      data: { channel_id: "channel-1", password: "secret" },
    });
  });
});
