import { getIntegrations } from "./generated/integrations/integrations";

const integrationsClient = getIntegrations();

export const integrationsApi = {
  getHealth: () => integrationsClient.healthApiV1IntegrationsHealthGet(),
  probeLlm: () => integrationsClient.llmProbeApiV1IntegrationsLlmProbePost(),
};
