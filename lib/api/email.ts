import { apiClient } from "./client";

export type EmailActionResponse = {
  ok: boolean;
  sent: boolean;
  message: string;
  dev_token?: string | null;
};

export const emailApi = {
  requestVerification: () =>
    apiClient<EmailActionResponse>({
      url: "/api/v1/email/verification/request",
      method: "POST",
    }),
  confirmVerification: (token: string) =>
    apiClient<EmailActionResponse>({
      url: "/api/v1/email/verification/confirm",
      method: "POST",
      data: { token },
    }),
};
