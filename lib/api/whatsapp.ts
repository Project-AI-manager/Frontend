import { apiClient } from "./client";
import type { ChannelResponse } from "./generated/ai.schemas";

export type WhatsAppConnectRequest = {
  phone_number_id: string;
  waba_id: string;
  access_token: string;
  app_secret: string;
  verify_token: string;
  name: string;
  replace_channel_id?: string;
};

export type WhatsAppPersonalQRResponse = {
  channel_id: string;
  status: "waiting" | "active" | "expired" | "error" | "disconnected";
  qr: string;
  error: string;
};

export const whatsappApi = {
  connect: (data: WhatsAppConnectRequest) =>
    apiClient<ChannelResponse>({
      url: "/api/v1/channels/whatsapp",
      method: "POST",
      data,
    }),
  startPersonalQr: () =>
    apiClient<WhatsAppPersonalQRResponse>({
      url: "/api/v1/channels/whatsapp/personal/qr/start",
      method: "POST",
    }),
  getPersonalQrStatus: (channelId: string) =>
    apiClient<WhatsAppPersonalQRResponse>({
      url: `/api/v1/channels/whatsapp/personal/qr/${channelId}/status`,
      method: "GET",
    }),
};
