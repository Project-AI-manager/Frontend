import { apiClient } from "./client";

export type TelegramAccountStartRequest = {
  phone: string;
};

export type TelegramAccountStartResponse = {
  channel_id: string;
  status: "code_required" | "active";
  delivery_method: "app" | "sms" | "call" | "email" | "other";
  next_delivery_method: "app" | "sms" | "call" | "email" | "other" | null;
  timeout_seconds: number | null;
  phone_masked: string;
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

export type TelegramQRStartResponse = {
  channel_id: string;
  status: "waiting";
  qr_url: string;
  expires_at: string;
};

export type TelegramQRStatusResponse = {
  channel_id: string;
  status: "waiting" | "password_required" | "active" | "expired";
  display_name: string;
};

export const telegramApi = {
  startAccount: (data: TelegramAccountStartRequest) =>
    apiClient<TelegramAccountStartResponse>({
      url: "/api/v1/channels/telegram/account/start",
      method: "POST",
      data,
    }),
  startQrAccount: () =>
    apiClient<TelegramQRStartResponse>({
      url: "/api/v1/channels/telegram/account/qr/start",
      method: "POST",
    }),
  getQrStatus: (channelId: string) =>
    apiClient<TelegramQRStatusResponse>({
      url: `/api/v1/channels/telegram/account/qr/${channelId}/status`,
      method: "GET",
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
