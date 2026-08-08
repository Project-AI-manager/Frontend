import { apiClient } from "./client";
import type { ChannelResponse } from "./generated/ai.schemas";

export type VkConnectRequest = {
  group_id: number;
  access_token: string;
  callback_confirmation: string;
  callback_secret: string;
  name: string;
  replace_channel_id?: string;
};

export const vkApi = {
  connect: (data: VkConnectRequest) =>
    apiClient<ChannelResponse>({
      url: "/api/v1/channels/vk",
      method: "POST",
      data,
    }),
};
