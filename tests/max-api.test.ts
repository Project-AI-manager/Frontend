import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/client";
import { maxApi } from "@/lib/api/max";

vi.mock("@/lib/api/client", () => ({ apiClient: vi.fn() }));

describe("maxApi", () => {
  beforeEach(() => vi.mocked(apiClient).mockReset());

  it("connects a bot with the manual token contract", async () => {
    vi.mocked(apiClient).mockResolvedValue({ id: "max-1" });
    const data = { bot_token: "secret", name: "MAX", replace_channel_id: "max-current" };
    await maxApi.connect(data);
    expect(apiClient).toHaveBeenCalledWith({
      url: "/api/v1/channels/max",
      method: "POST",
      data,
    });
  });
});
