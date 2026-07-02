import { apiClient } from "./client";

export type AISettingsResponse = {
  auto_reply_enabled: boolean;
  confidence_threshold: number;
  llm_provider: string;
  embedding_model: string;
  system_prompt: string;
  available_providers: string[];
};

export type AISettingsUpdate = Partial<
  Pick<
    AISettingsResponse,
    | "auto_reply_enabled"
    | "confidence_threshold"
    | "llm_provider"
    | "embedding_model"
    | "system_prompt"
  >
>;

export type WorkspaceSettingsResponse = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export type WorkspaceSettingsUpdate = {
  name: string;
};

export type BillingSettingsResponse = {
  plan: string;
  plan_name: string;
  subscription_status: string;
  dialogs_used: number;
  dialogs_limit: number;
  ai_replies_used: number;
  channel_limit: number;
};

export const settingsApi = {
  getAiSettings: () =>
    apiClient<AISettingsResponse>({
      url: "/api/v1/settings/ai",
      method: "GET",
    }),
  updateAiSettings: (data: AISettingsUpdate) =>
    apiClient<AISettingsResponse>({
      url: "/api/v1/settings/ai",
      method: "PUT",
      data,
    }),
  getWorkspaceSettings: () =>
    apiClient<WorkspaceSettingsResponse>({
      url: "/api/v1/settings/workspace",
      method: "GET",
    }),
  updateWorkspaceSettings: (data: WorkspaceSettingsUpdate) =>
    apiClient<WorkspaceSettingsResponse>({
      url: "/api/v1/settings/workspace",
      method: "PUT",
      data,
    }),
  getBillingSettings: () =>
    apiClient<BillingSettingsResponse>({
      url: "/api/v1/settings/billing",
      method: "GET",
    }),
};
