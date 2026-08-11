import { apiClient } from "./client";

export const instagramApi = {
  startOAuth: (replaceChannelId?: string) =>
    apiClient<{ authorization_url: string }>({
      url: "/api/v1/channels/instagram/oauth/start",
      method: "POST",
      data: replaceChannelId ? { replace_channel_id: replaceChannelId } : {},
      withCredentials: true,
    }),
};
