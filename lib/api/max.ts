import { apiClient } from "./client";
import type { ChannelResponse } from "./generated/ai.schemas";

export type MaxConnectRequest = {
  bot_token: string;
  name?: string;
  replace_channel_id?: string;
};

export const maxApi = {
  connect: (data: MaxConnectRequest) =>
    apiClient<ChannelResponse>({
      url: "/api/v1/channels/max",
      method: "POST",
      data,
    }),
};
