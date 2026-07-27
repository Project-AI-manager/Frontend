import { apiClient } from "./client";

export type IntegrationStatus = "ok" | "disabled" | "not_configured" | "error";

export type IntegrationProbeResponse = {
  name: string;
  status: IntegrationStatus;
  message: string;
  details: Record<string, unknown>;
};

export type IntegrationsHealthResponse = {
  llm: IntegrationProbeResponse;
  embeddings: IntegrationProbeResponse;
  qdrant: IntegrationProbeResponse;
  email: IntegrationProbeResponse;
  telegram: IntegrationProbeResponse;
};

export const integrationsApi = {
  getHealth: () =>
    apiClient<IntegrationsHealthResponse>({
      url: "/api/v1/integrations/health",
      method: "GET",
    }),
  probeLlm: () =>
    apiClient<IntegrationProbeResponse>({
      url: "/api/v1/integrations/llm/probe",
      method: "POST",
    }),
  probeEmbeddings: () =>
    apiClient<IntegrationProbeResponse>({
      url: "/api/v1/integrations/embeddings/probe",
      method: "POST",
    }),
};
