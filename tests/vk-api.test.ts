import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/client";
import { vkApi } from "@/lib/api/vk";

vi.mock("@/lib/api/client", () => ({ apiClient: vi.fn() }));

describe("vkApi", () => {
  beforeEach(() => vi.mocked(apiClient).mockReset());

  it("connects a VK community", async () => {
    vi.mocked(apiClient).mockResolvedValue({});
    const data = {
      group_id: 123456,
      access_token: "vk-community-access-token",
      callback_confirmation: "confirmation-code",
      callback_secret: "callback-secret",
      name: "VK магазина",
    };

    await vkApi.connect(data);

    expect(apiClient).toHaveBeenCalledWith({
      url: "/api/v1/channels/vk",
      method: "POST",
      data,
    });
  });
});
