import { apiClient } from "./client";

export const avitoApi = {
  startOAuth: () =>
    apiClient<{ authorization_url: string }>({
      url: "/api/v1/channels/avito/oauth/start",
      method: "POST",
      withCredentials: true,
    }),
};
