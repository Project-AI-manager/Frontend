import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/client";
import { whatsappApi } from "@/lib/api/whatsapp";

vi.mock("@/lib/api/client", () => ({ apiClient: vi.fn() }));

describe("whatsappApi", () => {
  beforeEach(() => vi.mocked(apiClient).mockReset());

  it("connects WhatsApp Cloud API credentials", async () => {
    vi.mocked(apiClient).mockResolvedValue({});
    const data = {
      phone_number_id: "123456",
      waba_id: "654321",
      access_token: "access-token",
      app_secret: "app-secret",
      verify_token: "verify-token",
      name: "WhatsApp магазина",
    };

    await whatsappApi.connect(data);

    expect(apiClient).toHaveBeenCalledWith({
      url: "/api/v1/channels/whatsapp",
      method: "POST",
      data,
    });
  });
});
