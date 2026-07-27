import { apiClient } from "./client";

export type TelegramAccountStartRequest = {
  phone: string;
};

export type TelegramAccountStartResponse = {
  channel_id: string;
  status: "code_required" | "active";
};

export type TelegramAccountConfirmRequest = {
  channel_id: string;
  code: string;
};

export type TelegramAccountPasswordRequest = {
  channel_id: string;
  password: string;
};

export type TelegramAccountAuthResponse = {
  channel_id: string;
  status: "password_required" | "active";
  display_name: string;
};

export const telegramApi = {
  startAccount: (data: TelegramAccountStartRequest) =>
    apiClient<TelegramAccountStartResponse>({
      url: "/api/v1/channels/telegram/account/start",
      method: "POST",
      data,
    }),
  confirmCode: (data: TelegramAccountConfirmRequest) =>
    apiClient<TelegramAccountAuthResponse>({
      url: "/api/v1/channels/telegram/account/confirm",
      method: "POST",
      data,
    }),
  confirmPassword: (data: TelegramAccountPasswordRequest) =>
    apiClient<TelegramAccountAuthResponse>({
      url: "/api/v1/channels/telegram/account/password",
      method: "POST",
      data,
    }),
};
