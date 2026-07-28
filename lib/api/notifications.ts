import { apiClient } from "./client";

export type NotificationSettings = {
  escalation_email_enabled: boolean;
  daily_digest_email_enabled: boolean;
};

export const notificationsApi = {
  get: () =>
    apiClient<NotificationSettings>({ url: "/api/v1/users/me/notifications", method: "GET" }),
  update: (data: Partial<NotificationSettings>) =>
    apiClient<NotificationSettings>({
      url: "/api/v1/users/me/notifications",
      method: "PUT",
      data,
    }),
};
