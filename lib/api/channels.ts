import { apiClient } from "./client";

export const channelsManagementApi = {
  disconnect: (channelId: string) =>
    apiClient<void>({
      url: `/api/v1/channels/${channelId}`,
      method: "DELETE",
    }),
};
